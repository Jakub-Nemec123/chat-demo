import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import db from '@adonisjs/lucid/services/db'

export default class ChannelsController {
  async index({ auth, response }: HttpContext) {
    // const userId = params.userId
    const userId = auth.getUserOrFail().id

    // Get all PUBLIC channels
    const publicChannels = await Channel.query().where('privacy', 'PUBLIC')

    // Get PRIVATE channels where user is a member
    const privateChannelIds = await db
      .from('channel_users')
      .select('channel_id')
      .where('user_id', userId)

    const privateChannels = await Channel.query()
      .where('privacy', 'PRIVATE')
      .whereIn(
        'id',
        privateChannelIds.map((row) => row.channel_id)
      )

    // Combine and return all channels
    const allChannels = [...publicChannels, ...privateChannels]

    return response.ok(allChannels)
  }

  async show({ auth, params, response }: HttpContext) {
    // const userId = params.userId
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    // Get channel with basic info
    const channel = await Channel.findOrFail(channelId)

    if (channel.privacy === 'PRIVATE') {
      const isMember = await db
        .from('channel_users')
        .where('channel_id', channelId)
        .where('user_id', userId)
        .first()

      if (!isMember) {
        return response.forbidden({ message: 'You are not a member of this private channel' })
      }
    }

    // Get member count
    const memberCount = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .count('* as total')
      .first()

    // Check if current user is admin
    const userMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    return response.ok({
      id: channel.id,
      slug: channel.slug,
      privacy: channel.privacy,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      memberCount: memberCount?.total || 0,
      isAdmin: userMembership?.is_admin || false,
      isMember: !!userMembership,
    })
  }
}
