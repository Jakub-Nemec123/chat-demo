import api from './api'
import type { AuthData, TokenData } from '../models/auth'

export default {
  // async invalidateToken(token: string) {}
  async getToken(authData: AuthData): Promise<TokenData> {
    // TODO: validate the request data
    const response = await api.post('/sessions', authData)
    return response.data as TokenData
  }
}
