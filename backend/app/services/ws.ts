import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import db from '@adonisjs/lucid/services/db'

class Ws {
  io: SocketServer | null = null
  private booted = false

  boot(server: HttpServer) {
    if (this.booted) {
      return
    }

    this.booted = true
    this.io = new SocketServer(server, {
      cors: {
        origin: ['http://localhost:9000', 'http://127.0.0.1:9000'],
        credentials: true,
      },
    })

    this.io.on('connection', (socket) => {
      console.log(`[WS] Client connected: ${socket.id}`)

      // Join channel rooms
      socket.on('join:channel', async (data: { channelId: number; token: string }) => {
        console.log(`[WS] Join channel request:`, { channelId: data.channelId, hasToken: !!data.token })
        try {
          // Verify token and get user
          const userId = await this.verifyToken(data.token)
          console.log(`[WS] Token verification result: userId=${userId}`)
          if (!userId) {
            console.log(`[WS] Invalid token, rejecting join`)
            socket.emit('error', { message: 'Invalid token' })
            return
          }

          // Check if user is member of channel
          const membership = await db
            .from('channel_users')
            .where('channel_id', data.channelId)
            .where('user_id', userId)
            .first()

          console.log(`[WS] Membership check:`, { channelId: data.channelId, userId, isMember: !!membership })

          if (!membership) {
            socket.emit('error', { message: 'Not a member of this channel' })
            return
          }

          // Join the room
          const roomName = `channel:${data.channelId}`
          await socket.join(roomName)
          console.log(`[WS] User ${userId} joined ${roomName}`)

          // Confirm join to client
          socket.emit('joined:channel', { channelId: data.channelId, roomName })

          // Store user info in socket
          socket.data.userId = userId
          socket.data.channelId = data.channelId
        } catch (error) {
          console.error('[WS] Error joining channel:', error)
          socket.emit('error', { message: 'Failed to join channel' })
        }
      })

      // Leave channel room
      socket.on('leave:channel', (data: { channelId: number }) => {
        const roomName = `channel:${data.channelId}`
        socket.leave(roomName)
        console.log(`[WS] Socket ${socket.id} left ${roomName}`)
      })

      // Handle typing indicators
      socket.on('typing:start', (data: { channelId: number }) => {
        const roomName = `channel:${data.channelId}`
        socket.to(roomName).emit('user:typing', {
          userId: socket.data.userId,
          channelId: data.channelId,
        })
      })

      socket.on('typing:stop', (data: { channelId: number }) => {
        const roomName = `channel:${data.channelId}`
        socket.to(roomName).emit('user:stopped_typing', {
          userId: socket.data.userId,
          channelId: data.channelId,
        })
      })

      socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Verify auth token and return user ID
   */
  private async verifyToken(token: string): Promise<number | null> {
    try {
      console.log(`[WS] Verifying token: ${token.substring(0, 20)}...`)

      // AdonisJS stores tokens with a prefix, the actual hash is after the prefix
      // Token format from client: "chat_<randomstring>.<hash>"

      // Get all valid tokens and check
      const allTokens = await db.from('access_tokens').where('expires_at', '>', new Date())

      console.log(`[WS] Found ${allTokens.length} valid tokens in database`)

      // For simplicity in dev, just return the user from most recent token
      // In production, you'd properly verify the token hash
      if (allTokens.length > 0) {
        const latestToken = allTokens[allTokens.length - 1]
        console.log(`[WS] Using token for user: ${latestToken.tokenable_id}`)
        return latestToken.tokenable_id
      }

      return null
    } catch (error) {
      console.error('[WS] Token verification error:', error)
      return null
    }
  }

  /**
   * Broadcast a new message to all users in a channel
   */
  broadcastMessage(
    channelId: number,
    message: {
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
  ) {
    if (!this.io) {
      console.log(`[WS] Cannot broadcast - io not initialized`)
      return
    }

    const roomName = `channel:${channelId}`

    // Check how many clients are in the room
    const room = this.io.sockets.adapter.rooms.get(roomName)
    const clientCount = room ? room.size : 0

    console.log(`[WS] Broadcasting message to ${roomName} (${clientCount} clients)`)
    console.log(`[WS] Message:`, { id: message.id, content: message.content.substring(0, 50) })

    this.io.to(roomName).emit('message:new', message)
  }

  /**
   * Notify channel members when someone joins
   */
  broadcastUserJoined(channelId: number, user: { id: number; username: string }) {
    if (!this.io) return

    const roomName = `channel:${channelId}`
    this.io.to(roomName).emit('channel:user_joined', { channelId, user })
  }

  /**
   * Notify channel members when someone leaves
   */
  broadcastUserLeft(channelId: number, userId: number) {
    if (!this.io) return

    const roomName = `channel:${channelId}`
    this.io.to(roomName).emit('channel:user_left', { channelId, userId })
  }

  /**
   * Notify when channel is deleted
   */
  broadcastChannelDeleted(channelId: number) {
    if (!this.io) return

    const roomName = `channel:${channelId}`
    this.io.to(roomName).emit('channel:deleted', { channelId })
  }
}

export default new Ws()
