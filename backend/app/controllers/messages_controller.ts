import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import Channel from '#models/channel'
import { createMessageValidator } from '#validators/message'
import db from '@adonisjs/lucid/services/db'

export default class MessagesController {
  /**
   * GET /channels/:channelId/messages
   */
  async index({ auth, params, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId
    const page = request.input('page', 1)

    // Check if user is a member
    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    const messages = await Message.query()
      .where('channel_id', channelId)
      .preload('user', (query) => {
        query.select('id', 'username', 'first_name', 'last_name')
      })
      .orderBy('created_at', 'desc')
      .paginate(page, 30)

    return response.ok(messages)
  }

  /**
   * POST /channels/:channelId/messages
   */
  async store({ auth, params, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId
    const payload = await request.validateUsing(createMessageValidator)

    // Check if user is a member
    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    // Create message
    const message = await Message.create({
      userId: userId,
      channelId: channelId,
      content: payload.content,
    })

    await message.load('user', (query) => {
      query.select('id', 'username', 'first_name', 'last_name')
    })

    // Update channel's updatedAt for activity tracking
    await Channel.query().where('id', channelId).update({ updated_at: new Date() })

    // TODO: WebSocket broadcast here

    return response.created({
      id: message.id,
      userId: message.userId,
      channelId: message.channelId,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      user: {
        id: message.user.id,
        username: message.user.username,
        firstName: message.user.first_name,
        lastName: message.user.last_name,
      },
    })
  }
}
