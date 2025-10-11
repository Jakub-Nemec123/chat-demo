import { reactive, computed } from 'vue'

import type { User } from 'src/components/models'

type TokenBundle = {
  token: string
  expiresAt: number
}

const TOKEN_KEY = 'auth.token'
const USER_KEY = 'auth.user'
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

function loginWithCredentials(username: string, password: string) {
  if (!(username === 'test' && password === 'test')) {
    throw new Error('Nesprávny username alebo heslo')
  }

  const user: User = {
    id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    name: 'Test Name',
    username: 'Test username',
    email: 'test@example.com'
  }

  const token = `fake.${btoa(user.username)}.${Math.random().toString(36).slice(2)}`
  const ttlMinutes = 120
  const expiresAt = now() + ttlMinutes * 60 * 1000

  state.currentUser = user
  state.token = token
  state.expiresAt = expiresAt

  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt } satisfies TokenBundle))
}

function logout() {
  state.currentUser = null
  state.token = null
  state.expiresAt = 0
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function useAuth() {
  return {
    state,
    isAuthenticated,
    secondsLeft,
    bootstrapFromStorage,
    loginWithCredentials,
    logout
  }
}
