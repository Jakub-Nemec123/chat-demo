import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'
import { createChannelValidator } from '#validators/channel'
import { ChannelAlerts } from '#contracts/channel_alerts'

export default class ChannelsController {
  /**
   * GET /channels
   * Returns all channels where the user is a member
   * Includes membership info (isAdmin, alerts) and last activity
   */
  async index({ auth, response }: HttpContext) {
    const userId = auth.getUserOrFail().id

    // Get all channels where user is a member with pivot data
    const channels = await Channel.query()
      .whereHas('users', (query) => {
        query.where('users.id', userId)
      })
      .preload('users', (query) => {
        query.where('users.id', userId).pivotColumns(['is_admin', 'alerts', 'created_at'])
      })
      .orderBy('updated_at', 'desc')

    // Get last message date for each channel to check activity
    const channelIds = channels.map((c) => c.id)
    const lastMessages = await Message.query()
      .whereIn('channel_id', channelIds)
      .select('channel_id')
      .max('created_at as last_message_at')
      .groupBy('channel_id')

    const lastMessageMap = new Map(
      lastMessages.map((m) => [m.channelId, m.$extras.last_message_at])
    )

    // Format response with membership info
    const result = channels.map((channel) => {
      const membership = channel.users[0]?.$extras.pivot_is_admin
      const alerts = channel.users[0]?.$extras.pivot_alerts
      const joinedAt = channel.users[0]?.$extras.pivot_created_at

      return {
        id: channel.id,
        slug: channel.slug,
        privacy: channel.privacy,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        lastActivityAt: lastMessageMap.get(channel.id) || channel.createdAt,
        isAdmin: membership || false,
        alerts: alerts || ChannelAlerts.ALL,
        joinedAt: joinedAt,
      }
    })

    return response.ok(result)
  }

  /**
   * GET /channels/:channelId
   * Returns channel details if user is a member
   */
  async show({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    // Get channel
    const channel = await Channel.findOrFail(channelId)

    // Check membership
    const userMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    // For private channels, user must be a member
    if (channel.privacy === 'PRIVATE' && !userMembership) {
      return response.forbidden({ message: 'You are not a member of this private channel' })
    }

    // Get member count
    const memberCount = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .count('* as total')
      .first()

    // Get last activity (last message date)
    const lastMessage = await Message.query()
      .where('channel_id', channelId)
      .orderBy('created_at', 'desc')
      .first()

    return response.ok({
      id: channel.id,
      slug: channel.slug,
      privacy: channel.privacy,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      lastActivityAt: lastMessage?.createdAt || channel.createdAt,
      memberCount: Number(memberCount?.total) || 0,
      isAdmin: userMembership?.is_admin || false,
      isMember: !!userMembership,
      alerts: userMembership?.alerts || null,
    })
  }

  /**
   * POST /channels
   * Creates a new channel - creator becomes admin
   */
  async store({ auth, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const payload = await request.validateUsing(createChannelValidator)

    // Check if channel name (slug) already exists
    const existingChannel = await Channel.findBy('slug', payload.name)
    if (existingChannel) {
      return response.conflict({ message: 'Channel with this name already exists' })
    }

    // Create channel
    const channel = await Channel.create({
      slug: payload.name,
      privacy: payload.privacy,
    })

    // Add creator as admin member
    await db.table('channel_users').insert({
      channel_id: channel.id,
      user_id: userId,
      is_admin: true,
      alerts: ChannelAlerts.ALL,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return response.created({
      id: channel.id,
      slug: channel.slug,
      privacy: channel.privacy,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      isAdmin: true,
      isMember: true,
    })
  }

  /**
   * DELETE /channels/:channelId
   * Deletes a channel - only admin can delete
   */
  async destroy({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    // Get channel
    const channel = await Channel.findOrFail(channelId)

    // Check if user is admin
    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership || !membership.is_admin) {
      return response.forbidden({ message: 'Only channel admin can delete the channel' })
    }

    // Delete channel (cascade will handle messages and channel_users)
    await channel.delete()

    return response.ok({ message: 'Channel deleted successfully' })
  }

  /**
   * POST /channels/:channelId/leave
   * Leave a channel
   * If admin leaves and there are other members, transfer admin to oldest member
   */
  async leave({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    // Get channel
    const channel = await Channel.findOrFail(channelId)

    // Check if user is a member
    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership) {
      return response.badRequest({ message: 'You are not a member of this channel' })
    }

    // Get member count
    const memberCount = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .count('* as total')
      .first()

    const totalMembers = Number(memberCount?.total) || 0

    // If user is the only member, delete the channel
    if (totalMembers === 1) {
      await channel.delete()
      return response.ok({ message: 'Channel deleted as you were the last member' })
    }

    // If user is admin, transfer admin to the oldest member
    if (membership.is_admin) {
      const oldestMember = await db
        .from('channel_users')
        .where('channel_id', channelId)
        .whereNot('user_id', userId)
        .orderBy('created_at', 'asc')
        .first()

      if (oldestMember) {
        await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', oldestMember.user_id)
          .update({ is_admin: true, updated_at: new Date() })
      }
    }

    // Remove user from channel
    await db.from('channel_users').where('channel_id', channelId).where('user_id', userId).delete()
    return response.ok({ message: 'Successfully left the channel' })
  }

  /**
   * POST /channels/:channelId/join
   * Join a public channel
   */
  async join({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    // Get channel
    const channel = await Channel.findOrFail(channelId)

    // Check if channel is public
    if (channel.privacy === 'PRIVATE') {
      return response.forbidden({ message: 'Cannot join a private channel without invitation' })
    }

    // Check if already a member
    const existingMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (existingMembership) {
      return response.badRequest({ message: 'You are already a member of this channel' })
    }

    // Add user to channel
    await db.table('channel_users').insert({
      channel_id: channelId,
      user_id: userId,
      is_admin: false,
      alerts: ChannelAlerts.ALL,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return response.ok({ message: 'Successfully joined the channel' })
  }
}
