import api from './api'

export interface ChannelResponse {
  id: number
  slug: string
  privacy: 'PUBLIC' | 'PRIVATE'
  createdAt: string
  updatedAt: string
}

export interface ChannelDetailsResponse extends ChannelResponse {
  memberCount: number
  isAdmin: boolean
  isMember: boolean
}

export const channelsService = {
  async getChannels(): Promise<ChannelResponse[]> {
    const response = await api.get(`/channels`)
    return response.data
  },

  async getChannelDetails(channelId: number): Promise<ChannelDetailsResponse> {
    const response = await api.get(`/channels/${channelId}`)
    return response.data
  }
}
