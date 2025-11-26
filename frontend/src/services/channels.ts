import api from './api'

export interface ChannelResponse {
  id: number
  slug: string
  privacy: 'PUBLIC' | 'PRIVATE'
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  isAdmin: boolean
  alerts: 'ALL' | 'MENTIONS' | 'NONE'
  joinedAt: string
}

export interface ChannelDetailsResponse extends ChannelResponse {
  memberCount: number
  isMember: boolean
}

export interface CreateChannelPayload {
  name: string
  privacy: 'PUBLIC' | 'PRIVATE'
}

export interface CreateChannelResponse {
  id: number
  slug: string
  privacy: 'PUBLIC' | 'PRIVATE'
  createdAt: string
  updatedAt: string
  isAdmin: boolean
  isMember: boolean
}

export const channelsService = {
  /**
   * Get all channels where current user is a member
   */
  async getChannels(): Promise<ChannelResponse[]> {
    const response = await api.get('/channels')
    return response.data
  },

  /**
   * Get channel details
   */
  async getChannelDetails(channelId: number): Promise<ChannelDetailsResponse> {
    const response = await api.get(`/channels/${channelId}`)
    return response.data
  },

  /**
   * Create a new channel (creator becomes admin)
   */
  async createChannel(payload: CreateChannelPayload): Promise<CreateChannelResponse> {
    const response = await api.post('/channels', payload)
    return response.data
  },

  /**
   * Delete a channel (admin only)
   */
  async deleteChannel(channelId: number): Promise<void> {
    await api.delete(`/channels/${channelId}`)
  },

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: number): Promise<void> {
    await api.post(`/channels/${channelId}/leave`)
  },

  /**
   * Join a public channel
   */
  async joinChannel(channelId: number): Promise<void> {
    await api.post(`/channels/${channelId}/join`)
  }
}
