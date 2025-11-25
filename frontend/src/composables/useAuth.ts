import { reactive, computed } from 'vue'
import bcrypt from 'bcryptjs'
import type { User } from 'src/models'
import { UserStates } from 'src/models'
import authService from 'src/services/auth'
import type { TokenData } from 'src/models/auth'
import { Notify } from 'quasar'
import { AxiosError } from 'axios'


//to do
//We should probably export functions regarding User settings to different file

type TokenBundle = {
  token: string
  expiresAt: number
}

const TOKEN_KEY = 'auth.token'
const USER_KEY = 'auth.user'
const PASSHASH_KEY = 'auth.passwordHash' // lokalne

const now = () => Date.now()

const state = reactive<{
  currentUser: User | null
  token: string | null
  expiresAt: number
}>({
  currentUser: null,
  token: null,
  expiresAt: 0
})

const isAuthenticated = computed(() => !!state.token && state.expiresAt > now())
const secondsLeft = computed(() => Math.max(0, Math.floor((state.expiresAt - now()) / 1000)))

function bootstrapFromStorage() {
  const tRaw = localStorage.getItem(TOKEN_KEY)
  const uRaw = localStorage.getItem(USER_KEY)
  if (!tRaw || !uRaw) return
  try {
    const tb: TokenBundle = JSON.parse(tRaw)
    const user: User = JSON.parse(uRaw)
    if (tb.expiresAt > now()) {
      state.token = tb.token
      state.expiresAt = tb.expiresAt
      state.currentUser = user
    } else {
      logout()
    }
  } catch {
    logout()
  }
}

async function ensurePasswordHashExists(defaultPlain = 'test'){
  if (!localStorage.getItem(PASSHASH_KEY)){
    const hash = await bcrypt.hash(defaultPlain, 10)
    localStorage.setItem(PASSHASH_KEY, hash)
  }
}

async function loginWithCredentials(email: string, password: string) {
  // TODO: try catch notification
  try {
    const token: TokenData = await authService.getToken({ email, password });
    console.debug('got token', token);

    const user: User = {
      id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: 'Test Name',
      username: 'Test username',
      email: 'test@example.com',
      currentState: UserStates.online
    }

    state.currentUser = user
    state.token = token.token
    state.expiresAt = Date.parse(token.expiresAt)

    localStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.setItem(TOKEN_KEY, JSON.stringify({
      token: state.token,
      expiresAt: state.expiresAt
    } satisfies TokenBundle))
  } catch (e: unknown) {
    if (
      e instanceof AxiosError
      && e.code === 'ERR_BAD_REQUEST'
    ) {
      // TODO: add types
      for (const error of e.response?.data?.errors || []) {
        Notify.create({ message: error.message, type: 'negative' })
      }
    }
  }
}

function logout() {
  state.currentUser = null
  state.token = null
  state.expiresAt = 0
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function updateProfile(patch: Partial<Pick<User, 'name' | 'email' | 'username'>>) {
  if (!state.currentUser) throw new Error('no user')
  const next: User = {
    ...state.currentUser,
    ...patch
  }
  state.currentUser = next
  localStorage.setItem(USER_KEY, JSON.stringify(next))
  return next
}

function setPresence(nextState: UserStates){
  if (!state.currentUser) throw new Error('no User')
  const next: User = { ...state.currentUser, currentState: nextState}
  state.currentUser = next
  localStorage.setItem(USER_KEY, JSON.stringify(next))
  return next
}

async function changePassword(currentPlain: string, newPlain: string){
  const hash = localStorage.getItem(PASSHASH_KEY)
  if (!hash) throw new Error ('Password hash not set')

  const ok = await bcrypt.compare(currentPlain, hash)
  if (!ok) throw new Error('Actual password doesnt match')

  const nextHash = await bcrypt.hash(newPlain, 12)
  localStorage.setItem(PASSHASH_KEY, nextHash)

  return true
}

export function useAuth() {
  return {
    state,
    isAuthenticated,
    secondsLeft,
    setPresence,
    ensurePasswordHashExists,
    bootstrapFromStorage,
    loginWithCredentials,
    logout,
    updateProfile,
    changePassword
  }
}
