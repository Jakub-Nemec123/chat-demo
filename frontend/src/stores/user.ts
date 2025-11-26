import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import api from 'src/services/api'

export type UserStatus = 'ONLINE' | 'DO_NOT_DISTURB' | 'OFFLINE'

export interface UserStatusData {
  status: UserStatus
  message: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const currentStatus = ref<UserStatus>('ONLINE')
  const statusMessage = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isOnline = computed(() => currentStatus.value === 'ONLINE')
  const isDND = computed(() => currentStatus.value === 'DO_NOT_DISTURB')
  const isOffline = computed(() => currentStatus.value === 'OFFLINE')

  const statusLabel = computed(() => {
    switch (currentStatus.value) {
      case 'ONLINE': return 'Online'
      case 'DO_NOT_DISTURB': return 'Do Not Disturb'
      case 'OFFLINE': return 'Offline'
      default: return 'Unknown'
    }
  })

  const statusColor = computed(() => {
    switch (currentStatus.value) {
      case 'ONLINE': return 'positive'
      case 'DO_NOT_DISTURB': return 'negative'
      case 'OFFLINE': return 'grey-6'
      default: return 'grey'
    }
  })

  // Actions
  async function fetchStatus() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get('/status')
      currentStatus.value = response.data.status
      statusMessage.value = response.data.message || ''
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch status'
      // Default to online on error
      currentStatus.value = 'ONLINE'
    } finally {
      isLoading.value = false
    }
  }

  async function updateStatus(status: UserStatus, message: string = '') {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put('/status', { status, message })
      currentStatus.value = response.data.status
      statusMessage.value = response.data.message || ''
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to update status'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function setOnline() {
    return updateStatus('ONLINE')
  }

  async function setDND() {
    return updateStatus('DO_NOT_DISTURB')
  }

  async function setOffline() {
    return updateStatus('OFFLINE')
  }

  function shouldReceiveNotifications(): boolean {
    return currentStatus.value !== 'DO_NOT_DISTURB'
  }

  function shouldReceiveMessages(): boolean {
    return currentStatus.value !== 'OFFLINE'
  }

  return {
    // State
    currentStatus,
    statusMessage,
    isLoading,
    error,
    // Getters
    isOnline,
    isDND,
    isOffline,
    statusLabel,
    statusColor,
    // Actions
    fetchStatus,
    updateStatus,
    setOnline,
    setDND,
    setOffline,
    shouldReceiveNotifications,
    shouldReceiveMessages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
