import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import db from '@adonisjs/lucid/services/db'
import { createHash } from 'node:crypto'

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

      // Handle typing indicators with content preview
      socket.on('typing:update', (data: { channelId: number; content: string }) => {
        const roomName = `channel:${data.channelId}`
        socket.to(roomName).emit('user:typing', {
          userId: socket.data.userId,
          username: socket.data.username,
          channelId: data.channelId,
          content: data.content,
        })
      })

      socket.on('typing:stop', (data: { channelId: number }) => {
        const roomName = `channel:${data.channelId}`
        socket.to(roomName).emit('user:stopped_typing', {
          userId: socket.data.userId,
          channelId: data.channelId,
        })
      })

      // Join user-specific room for direct notifications
      socket.on('auth:user', async (data: { token: string }) => {
        try {
          const userId = await this.verifyToken(data.token)
          if (!userId) {
            socket.emit('error', { message: 'Invalid token' })
            return
          }

          // Get username from database
          const user = await db.from('users').where('id', userId).select('username').first()

          const userRoom = `user:${userId}`
          await socket.join(userRoom)
          socket.data.userId = userId
          socket.data.username = user?.username || `User ${userId}`
          console.log(`[WS] User ${userId} (${socket.data.username}) joined personal room ${userRoom}`)
          socket.emit('auth:success', { userId })
        } catch (error) {
          console.error('[WS] Error authenticating user:', error)
          socket.emit('error', { message: 'Authentication failed' })
        }
      })

      socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Verify auth token and return user ID
   * AdonisJS access tokens format: "prefix_base64(id).secret"
   * The hash stored in DB is SHA256 of the secret
   */
  private async verifyToken(token: string): Promise<number | null> {
    try {
      console.log(`[WS] Verifying token: ${token.substring(0, 30)}...`)

      // AdonisJS token format: "chat_<base64_encoded_id>.<secret>"
      if (!token.startsWith('chat_')) {
        console.log('[WS] Token does not have correct prefix')
        return null
      }

      // Remove prefix and split by dot
      const tokenWithoutPrefix = token.slice(5) // Remove "chat_"
      const dotIndex = tokenWithoutPrefix.indexOf('.')

      if (dotIndex === -1) {
        console.log('[WS] Invalid token format - no dot separator')
        return null
      }

      const encodedId = tokenWithoutPrefix.substring(0, dotIndex)
      const secret = tokenWithoutPrefix.substring(dotIndex + 1)

      if (!encodedId || !secret) {
        console.log('[WS] Invalid token format - missing parts')
        return null
      }

      // Decode the base64 ID
      let tokenId: number
      try {
        const decodedId = Buffer.from(encodedId, 'base64').toString('utf-8')
        tokenId = parseInt(decodedId, 10)
        if (isNaN(tokenId)) {
          console.log('[WS] Invalid token ID - not a number')
          return null
        }
      } catch {
        console.log('[WS] Failed to decode token ID')
        return null
      }

      console.log(`[WS] Looking for token with ID: ${tokenId}`)

      // Find the token in database
      const dbToken = await db
        .from('access_tokens')
        .where('id', tokenId)
        .where('expires_at', '>', new Date())
        .first()

      if (!dbToken) {
        console.log('[WS] Token not found or expired')
        return null
      }

      // AdonisJS stores SHA256 hash of the decoded secret (secret is base64 encoded)
      const decodedSecret = Buffer.from(secret, 'base64').toString('utf-8')
      const secretHash = createHash('sha256').update(decodedSecret).digest('hex')

      console.log(`[WS] Comparing hashes:`)
      console.log(`[WS]   DB hash: ${dbToken.hash}`)
      console.log(`[WS]   Computed: ${secretHash}`)

      if (secretHash !== dbToken.hash) {
        console.log('[WS] Token hash mismatch')
        return null
      }

      console.log(`[WS] Token verified for user: ${dbToken.tokenable_id}`)
      return dbToken.tokenable_id
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

  /**
   * Notify user when they are invited to a channel
   */
  broadcastChannelInvite(
    userId: number,
    channel: {
      id: number
      name: string
      privacy: string
      invitedBy: {
        id: number
        username: string
      }
    }
  ) {
    if (!this.io) return

    const userRoom = `user:${userId}`
    console.log(`[WS] Broadcasting channel invite to ${userRoom}`, channel)
    this.io.to(userRoom).emit('channel:invited', {
      channel: {
        id: channel.id,
        name: channel.name,
        privacy: channel.privacy,
      },
      invitedBy: channel.invitedBy,
    })
  }

  /**
   * Notify user when they are kicked/removed from a channel
   */
  broadcastChannelKicked(userId: number, channelId: number, channelName: string) {
    if (!this.io) return

    const userRoom = `user:${userId}`
    console.log(`[WS] Broadcasting channel kick to ${userRoom}`)
    this.io.to(userRoom).emit('channel:kicked', { channelId, channelName })
  }
}

export default new Ws()
