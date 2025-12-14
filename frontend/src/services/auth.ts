import api from './api'
import type { AuthData, NewUserData, TokenData } from 'src/models/auth'

export default {
  // async invalidateToken(token: string) {}
  async getToken(authData: AuthData): Promise<TokenData> {
    // TODO: validate the request data
    const response = await api.post('/sessions', authData)
    return response.data as TokenData
  },
  async getNewUserToken(userData: NewUserData): Promise<TokenData> {
    const response = await api.post('/users', userData)
    return response.data as TokenData
  },
}
