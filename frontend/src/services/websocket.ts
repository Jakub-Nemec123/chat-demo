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
  public isAuthenticated: Ref<boolean> = ref(false)
  public typingUsers: Ref<TypingUser[]> = ref([])

  // Event callbacks - arrays to support multiple listeners
  private onMessageCallbacks: ((message: WsMessage) => void)[] = []
  private onUserJoinedCallback: ((data: { channelId: number; user: { id: number; username: string } }) => void) | null = null
  private onUserLeftCallback: ((data: { channelId: number; userId: number }) => void) | null = null
  private onChannelDeletedCallback: ((data: { channelId: number }) => void) | null = null
  private onChannelInvitedCallback: ((data: { channel: { id: number; name: string; privacy: string }; invitedBy: { id: number; username: string } }) => void) | null = null
  private onChannelKickedCallback: ((data: { channelId: number; channelName: string }) => void) | null = null

  /**
   * Connect to WebSocket server
   */
  connect() {
    // Already connected or connecting
    if (this.socket?.connected) {
      console.log('[WS Client] Already connected')
      return
    }

    // Socket exists but not connected - don't create new one, let it reconnect
    if (this.socket) {
      console.log('[WS Client] Socket exists, waiting for reconnect...')
      return
    }

    console.log('[WS Client] Connecting to server...')

    this.socket = io('http://127.0.0.1:3333', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('[WS Client] Connected:', this.socket?.id)
      this.isConnected.value = true

      // Auto-authenticate after connection
      this.authenticate()

      // Rejoin channel if we were in one
      if (this.currentChannelId) {
        console.log('[WS Client] Rejoining channel:', this.currentChannelId)
        this.joinChannel(this.currentChannelId)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[WS Client] Disconnected, reason:', reason)
      this.isConnected.value = false
      this.isAuthenticated.value = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('[WS Client] Connection error:', error.message)
      this.isConnected.value = false
    })

    // Auth confirmation
    this.socket.on('auth:success', (data: { userId: number }) => {
      console.log('[WS Client] Authenticated as user:', data.userId)
      this.isAuthenticated.value = true
    })

    // Confirmation of joining channel
    this.socket.on('joined:channel', (data: { channelId: number; roomName: string }) => {
      console.log('[WS Client] Successfully joined channel:', data)
    })

    // Message events
    this.socket.on('message:new', (message: WsMessage) => {
      console.log('[WS Client] Received new message:', message)
      // Call all registered callbacks
      this.onMessageCallbacks.forEach(callback => {
        try {
          callback(message)
        } catch (e) {
          console.error('[WS Client] Error in message callback:', e)
        }
      })
    })

    // Typing events
    this.socket.on('user:typing', (data: TypingUser) => {
      console.log('[WS Client] User typing:', data)
      const exists = this.typingUsers.value.find(
        (u) => u.userId === data.userId && u.channelId === data.channelId
      )
      if (!exists) {
        this.typingUsers.value.push(data)
      }
    })

    this.socket.on('user:stopped_typing', (data: TypingUser) => {
      console.log('[WS Client] User stopped typing:', data)
      this.typingUsers.value = this.typingUsers.value.filter(
        (u) => !(u.userId === data.userId && u.channelId === data.channelId)
      )
    })

    // Channel events
    this.socket.on('channel:user_joined', (data: { channelId: number; user: { id: number; username: string } }) => {
      console.log('[WS Client] User joined channel:', data)
      if (this.onUserJoinedCallback) {
        this.onUserJoinedCallback(data)
      }
    })

    this.socket.on('channel:user_left', (data: { channelId: number; userId: number }) => {
      console.log('[WS Client] User left channel:', data)
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback(data)
      }
    })

    this.socket.on('channel:deleted', (data: { channelId: number }) => {
      console.log('[WS Client] Channel deleted:', data)
      if (this.onChannelDeletedCallback) {
        this.onChannelDeletedCallback(data)
      }
    })

    // Channel invite notification (user-specific)
    this.socket.on('channel:invited', (data: { channel: { id: number; name: string; privacy: string }; invitedBy: { id: number; username: string } }) => {
      console.log('[WS Client] Invited to channel:', data)
      if (this.onChannelInvitedCallback) {
        this.onChannelInvitedCallback(data)
      }
    })

    // Channel kicked notification (user-specific)
    this.socket.on('channel:kicked', (data: { channelId: number; channelName: string }) => {
      console.log('[WS Client] Kicked from channel:', data)
      if (this.onChannelKickedCallback) {
        this.onChannelKickedCallback(data)
      }
    })

    this.socket.on('error', (error: { message: string }) => {
      console.error('[WS Client] Server error:', error.message)
    })
  }

  /**
   * Authenticate user to join personal room
   */
  authenticate() {
    if (!this.socket?.connected) {
      console.warn('[WS Client] Not connected, cannot authenticate')
      return
    }

    const tokenRaw = localStorage.getItem(TOKEN_KEY)
    if (!tokenRaw) {
      console.warn('[WS Client] No auth token found')
      return
    }

    let token: string
    try {
      const tokenBundle = JSON.parse(tokenRaw)
      token = tokenBundle.token
    } catch {
      console.error('[WS Client] Invalid token data')
      return
    }

    console.log('[WS Client] Authenticating...')
    this.socket.emit('auth:user', { token })
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
    if (!this.socket?.connected) {
      console.warn('[WS Client] Not connected, connecting first...')
      this.connect()
      // Wait a bit for connection then retry
      setTimeout(() => this.joinChannel(channelId), 1000)
      return
    }

    // Get token from localStorage
    const tokenRaw = localStorage.getItem(TOKEN_KEY)
    if (!tokenRaw) {
      console.error('[WS Client] No auth token found')
      return
    }

    let token: string
    try {
      const tokenBundle = JSON.parse(tokenRaw)
      token = tokenBundle.token
    } catch {
      console.error('[WS Client] Invalid token data')
      return
    }

    // Leave previous channel if any
    if (this.currentChannelId && this.currentChannelId !== channelId) {
      this.leaveChannel(this.currentChannelId)
    }

    this.currentChannelId = channelId
    console.log('[WS Client] Emitting join:channel', { channelId, tokenLength: token.length })
    this.socket.emit('join:channel', { channelId, token })
  }

  /**
   * Leave a channel room
   */
  leaveChannel(channelId: number) {
    if (!this.socket) return

    console.log('[WS Client] Leaving channel:', channelId)
    this.socket.emit('leave:channel', { channelId })
    if (this.currentChannelId === channelId) {
      this.currentChannelId = null
    }
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
   * Supports multiple listeners
   */
  onMessage(callback: (message: WsMessage) => void) {
    // Prevent duplicate registration
    if (!this.onMessageCallbacks.includes(callback)) {
      this.onMessageCallbacks.push(callback)
    }
  }

  /**
   * Remove a message callback
   */
  offMessage(callback: (message: WsMessage) => void) {
    this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback)
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
   * Register callback for channel invite
   */
  onChannelInvited(callback: (data: { channel: { id: number; name: string; privacy: string }; invitedBy: { id: number; username: string } }) => void) {
    this.onChannelInvitedCallback = callback
  }

  /**
   * Register callback for channel kicked
   */
  onChannelKicked(callback: (data: { channelId: number; channelName: string }) => void) {
    this.onChannelKickedCallback = callback
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
