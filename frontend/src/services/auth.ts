import api from './api'
import type { AuthData, NewUserData, PassData, TokenData, UserData } from 'src/models/auth'

export default {
  // async invalidateToken(token: string) {}
  async updatePassword(passData: PassData): Promise<UserData> {
    const response = await api.patch('/users/me', passData)
    return response.data as UserData
  },
  async updateUser(userData: UserData): Promise<UserData> {
    const response = await api.patch('/users/me', userData)
    return response.data as UserData
  },
  async getToken(authData: AuthData): Promise<TokenData> {
    // TODO: validate the request data
    const response = await api.post('/sessions', authData)
    return response.data as TokenData
  },
  async getNewUserToken(userData: UserData | PassData): Promise<TokenData> {
    const response = await api.post('/users', userData)
    return response.data as TokenData
  },
}
