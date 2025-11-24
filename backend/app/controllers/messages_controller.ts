import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import Channel from '#models/channel'
import { createMessageValidator } from '#validators/message'

export default class MessagesController {
  async index({ params, response }: HttpContext) {
    const userId = params.userId
    const channelId = params.channelId
    const page = params.page || 1

    // Check if user is a member
    const channel = await Channel.query()
      .where('id', channelId)
      .preload('users' as any, (query: any) => {
        query.where('users.id', userId)
      })
      .firstOrFail()

    // If user is not a member, deny access
    if ((channel as any).users.length === 0) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    // Get paginated messages
    const messages = await Message.query()
      .where('channel_id', channelId)
      .preload('user', (query) => {
        query.select('id', 'username', 'first_name', 'last_name')
      })
      .orderBy('created_at', 'desc')
      .paginate(page, 30)

    return response.ok(messages)
  }

  async store({ params, request, response }: HttpContext) {
    const userId = params.userId
    const channelId = params.channelId
    const payload = await createMessageValidator.validate(request.all())

    // Check if user is a member
    const channel = await Channel.query()
      .where('id', channelId)
      .preload('users' as any, (query: any) => {
        query.where('users.id', userId)
      })
      .firstOrFail()

    // If user is not a member, deny access
    if ((channel as any).users.length === 0) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    // Create the message
    const message = await Message.create({
      userId: userId,
      channelId: channelId,
      content: payload.content,
    })

    await message.load('user', (query) => {
      query.select('id', 'username', 'first_name', 'last_name')
    })

    return response.created(message)
  }
}
