import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import api from 'src/services/api'

export interface MessageUser {
  id: number
  username: string
  firstName: string | null
  lastName: string | null
}

export interface Message {
  id: number
  userId: number
  channelId: number
  content: string
  createdAt: string
  updatedAt: string
  user: MessageUser
}

export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
}

export const useMessagesStore = defineStore('messages', () => {
  // State - messages per channel
  const messagesByChannel = ref<Map<number, Message[]>>(new Map())
  const paginationByChannel = ref<Map<number, PaginationMeta>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get messages for specific channel
  function getMessages(channelId: number): Message[] {
    return messagesByChannel.value.get(channelId) || []
  }

  function getPagination(channelId: number): PaginationMeta | null {
    return paginationByChannel.value.get(channelId) || null
  }

  function hasMoreMessages(channelId: number): boolean {
    const pagination = getPagination(channelId)
    if (!pagination) return true
    return pagination.currentPage < pagination.lastPage
  }

  // Actions
  async function fetchMessages(channelId: number, page: number = 1) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get(`/channels/${channelId}/messages`, {
        params: { page }
      })

      const { data, meta } = response.data

      // Transform messages
      const messages: Message[] = data.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        channelId: m.channelId,
        content: m.content,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        user: {
          id: m.user.id,
          username: m.user.username,
          firstName: m.user.first_name,
          lastName: m.user.last_name,
        }
      }))

      // Reverse to get chronological order (API returns newest first)
      messages.reverse()

      const currentMessages = messagesByChannel.value.get(channelId) || []

      // Create new Map to trigger Vue reactivity
      const newMessagesMap = new Map(messagesByChannel.value)
      if (page === 1) {
        // First page - replace messages
        newMessagesMap.set(channelId, messages)
      } else {
        // Subsequent pages - prepend older messages
        newMessagesMap.set(channelId, [...messages, ...currentMessages])
      }
      messagesByChannel.value = newMessagesMap

      // Update pagination - create new Map to trigger reactivity
      const newPaginationMap = new Map(paginationByChannel.value)
      newPaginationMap.set(channelId, {
        total: meta.total,
        perPage: meta.per_page,
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        firstPage: meta.first_page,
      })
      paginationByChannel.value = newPaginationMap

      return messages
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch messages'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function loadMoreMessages(channelId: number) {
    const pagination = getPagination(channelId)
    if (!pagination || pagination.currentPage >= pagination.lastPage) {
      return []
    }
    return fetchMessages(channelId, pagination.currentPage + 1)
  }

  async function sendMessage(channelId: number, content: string) {
    error.value = null

    try {
      const response = await api.post(`/channels/${channelId}/messages`, { content })
      const message: Message = {
        id: response.data.id,
        userId: response.data.userId,
        channelId: response.data.channelId,
        content: response.data.content,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        user: {
          id: response.data.user.id,
          username: response.data.user.username,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
        }
      }

      // Add to messages
      addMessage(message)

      return message
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to send message'
      throw e
    }
  }

  // For WebSocket/real-time updates
  function addMessage(message: Message) {
    const channelMessages = messagesByChannel.value.get(message.channelId) || []

    // Check if message already exists
    const exists = channelMessages.find(m => m.id === message.id)
    if (!exists) {
      // Create new Map to trigger Vue reactivity
      const newMap = new Map(messagesByChannel.value)
      newMap.set(message.channelId, [...channelMessages, message])
      messagesByChannel.value = newMap
    }
  }

  function clearChannelMessages(channelId: number) {
    const newMessagesMap = new Map(messagesByChannel.value)
    newMessagesMap.delete(channelId)
    messagesByChannel.value = newMessagesMap

    const newPaginationMap = new Map(paginationByChannel.value)
    newPaginationMap.delete(channelId)
    paginationByChannel.value = newPaginationMap
  }

  function clearAllMessages() {
    messagesByChannel.value = new Map()
    paginationByChannel.value = new Map()
  }

  return {
    // State
    messagesByChannel,
    isLoading,
    error,
    // Getters
    getMessages,
    getPagination,
    hasMoreMessages,
    // Actions
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    addMessage,
    clearChannelMessages,
    clearAllMessages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessagesStore, import.meta.hot))
}
