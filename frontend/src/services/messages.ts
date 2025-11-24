import api from './api'

export interface MessageResponse {
  id: number
  userId: number
  channelId: number
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
  }
}

export interface MessagesIndexResponse {
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
    first_page: number
    first_page_url: string
    last_page_url: string
    next_page_url: string | null
    previous_page_url: string | null
  }
  data: MessageResponse[]
}

export const messagesService = {
  async getMessages(channelId: number, page: number = 1): Promise<MessagesIndexResponse> {
    const response = await api.get(`/channels/${channelId}/messages`, {
      params: { page }
    })
    return response.data
  },

  async createMessage(channelId: number, content: string): Promise<MessageResponse> {
    const response = await api.post(`/channels/${channelId}/messages`, {
      content
    })
    return response.data
  }
}
