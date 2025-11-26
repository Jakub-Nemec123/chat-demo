import axios from 'axios'

const TOKEN_KEY = 'auth.token'

const api = axios.create({
  baseURL: 'http://127.0.0.1:3333',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to every request
api.interceptors.request.use((config) => {
  const tokenRaw = localStorage.getItem(TOKEN_KEY)
  if (tokenRaw) {
    try {
      const tokenBundle = JSON.parse(tokenRaw)
      if (tokenBundle.token && tokenBundle.expiresAt > Date.now()) {
        config.headers.Authorization = `Bearer ${tokenBundle.token}`
      }
    } catch {
      // Invalid token data, ignore
    }
  }
  return config
})

export default api
