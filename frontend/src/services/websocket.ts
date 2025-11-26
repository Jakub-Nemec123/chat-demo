import { io, Socket } from 'socket.io-client'
import { ref, type Ref } from 'vue'

const TOKEN_KEY = 'auth.token'

export interface WsMessage {
  id: number
  userId: number
  channelId: number
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: number
    username: string
    first_name: string | null
    last_name: string | null
  }
}

export interface TypingUser {
  userId: number
  channelId: number
}

class WebSocketService {
  private socket: Socket | null = null
  private currentChannelId: number | null = null

  // Reactive state
  public isConnected: Ref<boolean> = ref(false)
  public typingUsers: Ref<TypingUser[]> = ref([])

  // Event callbacks
  private onMessageCallback: ((message: WsMessage) => void) | null = null
  private onUserJoinedCallback: ((data: { channelId: number; user: { id: number; username: string } }) => void) | null = null
  private onUserLeftCallback: ((data: { channelId: number; userId: number }) => void) | null = null
  private onChannelDeletedCallback: ((data: { channelId: number }) => void) | null = null

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket?.connected) {
      return
    }

    this.socket = io('http://127.0.0.1:3333', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id)
      this.isConnected.value = true

      // Rejoin channel if we were in one
      if (this.currentChannelId) {
        this.joinChannel(this.currentChannelId)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected')
      this.isConnected.value = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error)
      this.isConnected.value = false
    })

    // Message events
    this.socket.on('message:new', (message: WsMessage) => {
      console.log('[WS] New message:', message)
      if (this.onMessageCallback) {
        this.onMessageCallback(message)
      }
    })

    // Typing events
    this.socket.on('user:typing', (data: TypingUser) => {
      const exists = this.typingUsers.value.find(
        (u) => u.userId === data.userId && u.channelId === data.channelId
      )
      if (!exists) {
        this.typingUsers.value.push(data)
      }
    })

    this.socket.on('user:stopped_typing', (data: TypingUser) => {
      this.typingUsers.value = this.typingUsers.value.filter(
        (u) => !(u.userId === data.userId && u.channelId === data.channelId)
      )
    })

    // Channel events
    this.socket.on('channel:user_joined', (data: { channelId: number; user: { id: number; username: string } }) => {
      console.log('[WS] User joined channel:', data)
      if (this.onUserJoinedCallback) {
        this.onUserJoinedCallback(data)
      }
    })

    this.socket.on('channel:user_left', (data: { channelId: number; userId: number }) => {
      console.log('[WS] User left channel:', data)
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback(data)
      }
    })

    this.socket.on('channel:deleted', (data: { channelId: number }) => {
      console.log('[WS] Channel deleted:', data)
      if (this.onChannelDeletedCallback) {
        this.onChannelDeletedCallback(data)
      }
    })

    this.socket.on('error', (error: { message: string }) => {
      console.error('[WS] Error:', error.message)
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected.value = false
      this.currentChannelId = null
    }
  }

  /**
   * Join a channel room
   */
  joinChannel(channelId: number) {
    if (!this.socket) {
      console.warn('[WS] Not connected, connecting first...')
      this.connect()
      // Wait a bit for connection then retry
      setTimeout(() => this.joinChannel(channelId), 500)
      return
    }

    // Get token from localStorage
    const tokenRaw = localStorage.getItem(TOKEN_KEY)
    if (!tokenRaw) {
      console.error('[WS] No auth token found')
      return
    }

    let token: string
    try {
      const tokenBundle = JSON.parse(tokenRaw)
      token = tokenBundle.token
    } catch {
      console.error('[WS] Invalid token data')
      return
    }

    // Leave previous channel if any
    if (this.currentChannelId && this.currentChannelId !== channelId) {
      this.leaveChannel(this.currentChannelId)
    }

    this.currentChannelId = channelId
    this.socket.emit('join:channel', { channelId, token })
    console.log('[WS] Joining channel:', channelId)
  }

  /**
   * Leave a channel room
   */
  leaveChannel(channelId: number) {
    if (!this.socket) return

    this.socket.emit('leave:channel', { channelId })
    if (this.currentChannelId === channelId) {
      this.currentChannelId = null
    }
    console.log('[WS] Left channel:', channelId)
  }

  /**
   * Send typing indicator
   */
  startTyping(channelId: number) {
    if (!this.socket) return
    this.socket.emit('typing:start', { channelId })
  }

  /**
   * Stop typing indicator
   */
  stopTyping(channelId: number) {
    if (!this.socket) return
    this.socket.emit('typing:stop', { channelId })
  }

  /**
   * Register callback for new messages
   */
  onMessage(callback: (message: WsMessage) => void) {
    this.onMessageCallback = callback
  }

  /**
   * Register callback for user joined
   */
  onUserJoined(callback: (data: { channelId: number; user: { id: number; username: string } }) => void) {
    this.onUserJoinedCallback = callback
  }

  /**
   * Register callback for user left
   */
  onUserLeft(callback: (data: { channelId: number; userId: number }) => void) {
    this.onUserLeftCallback = callback
  }

  /**
   * Register callback for channel deleted
   */
  onChannelDeleted(callback: (data: { channelId: number }) => void) {
    this.onChannelDeletedCallback = callback
  }

  /**
   * Get typing users for a channel
   */
  getTypingUsers(channelId: number): TypingUser[] {
    return this.typingUsers.value.filter((u) => u.channelId === channelId)
  }
}

// Export singleton instance
export const wsService = new WebSocketService()
