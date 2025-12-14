import { reactive, computed } from 'vue'
import bcrypt from 'bcryptjs'
import type { User } from 'src/models'
import { UserStates } from 'src/models'
import authService from 'src/services/auth'
import type { NewUserData } from 'src/models/auth'
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

async function createNewUser(newUser: NewUserData) {
  try {
    const response = await authService.getNewUserToken(newUser)
    const user: User = {
      id: response.user.id.toString(),
      name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.username,
      username: response.user.username,
      email: response.user.email,
      currentState: UserStates.online
    }

    state.currentUser = user
    state.token = response.token
    state.expiresAt = Date.parse(response.expiresAt)

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

async function loginWithCredentials(email: string, password: string) {
  try {
    const response = await authService.getToken({ email, password });
    console.debug('got token', response);

    const user: User = {
      id: response.user.id.toString(),
      name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.username,
      username: response.user.username,
      email: response.user.email,
      currentState: UserStates.online
    }

    state.currentUser = user
    state.token = response.token
    state.expiresAt = Date.parse(response.expiresAt)

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

async function changePassword(password: string, passwordRepeat: string) {
  await authService.updatePassword({ password, passwordRepeat })
  // TODO: handle errors
  return true
}

export function useAuth() {
  return {
    state,
    isAuthenticated,
    secondsLeft,
    setPresence,
    createNewUser,
    ensurePasswordHashExists,
    bootstrapFromStorage,
    loginWithCredentials,
    logout,
    updateProfile,
    changePassword
  }
}
