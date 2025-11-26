import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import api from 'src/services/api'
import type { Channel, ChannelPrivacy } from 'src/models'

export interface ChannelFromAPI {
  id: number
  name: string
  privacy: 'PUBLIC' | 'PRIVATE'
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  isAdmin: boolean
  alerts: 'ALL' | 'MENTIONS' | 'NONE'
  joinedAt: string
}

export interface ChannelMember {
  id: number
  username: string
  first_name: string | null
  last_name: string | null
  is_admin: boolean
  joined_at: string
  status: 'ONLINE' | 'DO_NOT_DISTURB' | 'OFFLINE'
  status_message: string
}

export const useChannelsStore = defineStore('channels', () => {
  // State
  const channels = ref<ChannelFromAPI[]>([])
  const activeChannelId = ref<number | null>(null)
  const members = ref<ChannelMember[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeChannel = computed(() =>
    channels.value.find(c => c.id === activeChannelId.value) || null
  )

  const sortedChannels = computed(() =>
    [...channels.value].sort((a, b) =>
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    )
  )

  const isActiveChannelAdmin = computed(() =>
    activeChannel.value?.isAdmin || false
  )

  // Actions
  async function fetchChannels() {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.get('/channels')
      channels.value = response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch channels'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchChannel(channelId: number) {
    try {
      const response = await api.get(`/channels/${channelId}`)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch channel'
      throw e
    }
  }

  /**
   * /join channelName [private]
   */
  async function joinOrCreateChannel(name: string, privacy: 'PUBLIC' | 'PRIVATE' = 'PUBLIC') {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.post('/channels', { name, privacy })
      const channelData = response.data

      // Add to list if not already there
      const exists = channels.value.find(c => c.id === channelData.id)
      if (!exists) {
        channels.value.unshift({
          id: channelData.id,
          name: channelData.name,
          privacy: channelData.privacy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          isAdmin: channelData.isAdmin,
          alerts: 'ALL',
          joinedAt: new Date().toISOString(),
        })
      }

      // Set as active
      activeChannelId.value = channelData.id

      return channelData
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to join/create channel'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * /cancel - leave channel
   */
  async function leaveChannel(channelId: number) {
    try {
      const response = await api.post(`/channels/${channelId}/leave`)

      // Remove from list
      channels.value = channels.value.filter(c => c.id !== channelId)

      // Clear active if it was this channel
      if (activeChannelId.value === channelId) {
        activeChannelId.value = channels.value[0]?.id || null
      }

      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to leave channel'
      throw e
    }
  }

  /**
   * /quit - delete channel (admin only)
   */
  async function deleteChannel(channelId: number) {
    try {
      await api.delete(`/channels/${channelId}`)

      // Remove from list
      channels.value = channels.value.filter(c => c.id !== channelId)

      if (activeChannelId.value === channelId) {
        activeChannelId.value = channels.value[0]?.id || null
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to delete channel'
      throw e
    }
  }

  /**
   * /invite nickName
   */
  async function inviteUser(channelId: number, username: string) {
    try {
      const response = await api.post(`/channels/${channelId}/invite`, { username })
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to invite user'
      throw e
    }
  }

  /**
   * /kick nickName
   */
  async function kickUser(channelId: number, username: string) {
    try {
      const response = await api.post(`/channels/${channelId}/kick`, { username })
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to kick user'
      throw e
    }
  }

  /**
   * /revoke nickName
   */
  async function revokeUser(channelId: number, username: string) {
    try {
      const response = await api.post(`/channels/${channelId}/revoke`, { username })
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to revoke user'
      throw e
    }
  }

  /**
   * /list - get members
   */
  async function fetchMembers(channelId: number) {
    try {
      const response = await api.get(`/channels/${channelId}/members`)
      members.value = response.data
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch members'
      throw e
    }
  }

  function setActiveChannel(channelId: number | null) {
    activeChannelId.value = channelId
  }

  function findChannelByName(name: string) {
    return channels.value.find(c => c.name === name)
  }

  // For WebSocket updates
  function addChannel(channel: ChannelFromAPI) {
    const exists = channels.value.find(c => c.id === channel.id)
    if (!exists) {
      channels.value.unshift(channel)
    }
  }

  function removeChannel(channelId: number) {
    channels.value = channels.value.filter(c => c.id !== channelId)
    if (activeChannelId.value === channelId) {
      activeChannelId.value = channels.value[0]?.id || null
    }
  }

  function updateChannelActivity(channelId: number) {
    const channel = channels.value.find(c => c.id === channelId)
    if (channel) {
      channel.lastActivityAt = new Date().toISOString()
    }
  }

  return {
    // State
    channels,
    activeChannelId,
    members,
    isLoading,
    error,
    // Getters
    activeChannel,
    sortedChannels,
    isActiveChannelAdmin,
    // Actions
    fetchChannels,
    fetchChannel,
    joinOrCreateChannel,
    leaveChannel,
    deleteChannel,
    inviteUser,
    kickUser,
    revokeUser,
    fetchMembers,
    setActiveChannel,
    findChannelByName,
    addChannel,
    removeChannel,
    updateChannelActivity,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChannelsStore, import.meta.hot))
}
