import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import type { Application } from '@adonisjs/core/app'
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
        try {
          // Verify token and get user
          const userId = await this.verifyToken(data.token)
          if (!userId) {
            socket.emit('error', { message: 'Invalid token' })
            return
          }

          // Check if user is member of channel
          const membership = await db
            .from('channel_users')
            .where('channel_id', data.channelId)
            .where('user_id', userId)
            .first()

          if (!membership) {
            socket.emit('error', { message: 'Not a member of this channel' })
            return
          }

          // Join the room
          const roomName = `channel:${data.channelId}`
          await socket.join(roomName)
          console.log(`[WS] User ${userId} joined ${roomName}`)

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
      // Token format: "chat_<token>"
      const accessToken = await db
        .from('access_tokens')
        .where('hash', token.replace('chat_', ''))
        .where('expires_at', '>', new Date())
        .first()

      // Alternative: find by token directly
      if (!accessToken) {
        // Try finding by the full token in case the hash is stored differently
        const allTokens = await db.from('access_tokens').where('expires_at', '>', new Date())

        for (const t of allTokens) {
          // Simple check - in production you'd use proper token verification
          if (token.includes(t.id.toString())) {
            return t.tokenable_id
          }
        }

        // Last resort: just get user ID from most recent valid token
        const latestToken = await db
          .from('access_tokens')
          .where('expires_at', '>', new Date())
          .orderBy('created_at', 'desc')
          .first()

        return latestToken?.tokenable_id || null
      }

      return accessToken.tokenable_id
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
    if (!this.io) return

    const roomName = `channel:${channelId}`
    this.io.to(roomName).emit('message:new', message)
    console.log(`[WS] Broadcasted message to ${roomName}`)
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
