import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import User from '#models/user'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'
import { createChannelValidator, inviteUserValidator } from '#validators/channel'
import { ChannelAlerts } from '#contracts/channel_alerts'
import { ChannelPrivacy } from '#contracts/channel_privacy'
import Ws from '#services/ws'
import { DateTime } from 'luxon'

export default class ChannelsController {
  /**
   * Clean up channels inactive for more than 30 days
   */
  private async cleanupInactiveChannels() {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQL()

    // Find channels with no messages in 30 days
    const inactiveChannels = await Channel.query()
      .whereNotExists((query) => {
        query
          .from('messages')
          .whereRaw('messages.channel_id = channels.id')
          .where('messages.created_at', '>', thirtyDaysAgo!)
      })
      .where('created_at', '<', thirtyDaysAgo!)

    for (const channel of inactiveChannels) {
      console.log(`[Cleanup] Deleting inactive channel: ${channel.slug} (id: ${channel.id})`)

      // Delete messages
      await Message.query().where('channel_id', channel.id).delete()

      // Delete memberships
      await db.from('channel_users').where('channel_id', channel.id).delete()

      // Delete kicks
      await db.from('channel_kicks').where('channel_id', channel.id).delete()

      // Delete channel
      await channel.delete()
    }

    if (inactiveChannels.length > 0) {
      console.log(`[Cleanup] Deleted ${inactiveChannels.length} inactive channels`)
    }
  }

  /**
   * GET /channels
   * Returns all channels where the user is a member
   */
  async index({ auth, response }: HttpContext) {
    // Run cleanup periodically (simple approach - on every fetch)
    // In production, use a proper scheduler
    await this.cleanupInactiveChannels()

    const userId = auth.getUserOrFail().id

    const channels = await Channel.query()
      .whereHas('users', (query) => {
        query.where('users.id', userId)
      })
      .preload('users', (query) => {
        query.where('users.id', userId).pivotColumns(['is_admin', 'alerts', 'created_at'])
      })
      .orderBy('updated_at', 'desc')

    const channelIds = channels.map((c) => c.id)
    const lastMessages = await Message.query()
      .whereIn('channel_id', channelIds)
      .select('channel_id')
      .max('created_at as last_message_at')
      .groupBy('channel_id')

    const lastMessageMap = new Map(
      lastMessages.map((m) => [m.channelId, m.$extras.last_message_at])
    )

    const result = channels.map((channel) => {
      const pivot = channel.users[0]?.$extras
      return {
        id: channel.id,
        name: channel.slug,
        privacy: channel.privacy,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        lastActivityAt: lastMessageMap.get(channel.id) || channel.createdAt,
        isAdmin: pivot?.pivot_is_admin || false,
        alerts: pivot?.pivot_alerts || ChannelAlerts.ALL,
        joinedAt: pivot?.pivot_created_at,
      }
    })

    return response.ok(result)
  }

  /**
   * GET /channels/:channelId
   */
  async show({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    const channel = await Channel.findOrFail(channelId)

    const userMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (channel.privacy === ChannelPrivacy.PRIVATE && !userMembership) {
      return response.forbidden({ message: 'You are not a member of this private channel' })
    }

    const memberCount = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .count('* as total')
      .first()

    const lastMessage = await Message.query()
      .where('channel_id', channelId)
      .orderBy('created_at', 'desc')
      .first()

    return response.ok({
      id: channel.id,
      name: channel.slug,
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
   * Create channel or join existing (for /join command)
   */
  async store({ auth, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const payload = await request.validateUsing(createChannelValidator)
    const privacy = payload.privacy || ChannelPrivacy.PUBLIC

    // Check if channel exists
    let channel = await Channel.findBy('slug', payload.name)

    if (channel) {
      // Channel exists - try to join
      if (channel.privacy === ChannelPrivacy.PRIVATE) {
        return response.forbidden({ message: 'Cannot join private channel without invitation' })
      }

      // Check if already member
      const existing = await db
        .from('channel_users')
        .where('channel_id', channel.id)
        .where('user_id', userId)
        .first()

      if (existing) {
        return response.ok({
          id: channel.id,
          name: channel.slug,
          privacy: channel.privacy,
          isAdmin: existing.is_admin,
          isMember: true,
          joined: false,
          message: 'Already a member',
        })
      }

      // Check for ban
      const banCount = await db
        .from('channel_kicks')
        .where('channel_id', channel.id)
        .where('user_id', userId)
        .count('* as total')
        .first()

      if (Number(banCount?.total) >= 3) {
        return response.forbidden({ message: 'You are banned from this channel' })
      }

      // Join channel
      await db.table('channel_users').insert({
        channel_id: channel.id,
        user_id: userId,
        is_admin: false,
        alerts: ChannelAlerts.ALL,
        created_at: new Date(),
        updated_at: new Date(),
      })

      return response.ok({
        id: channel.id,
        name: channel.slug,
        privacy: channel.privacy,
        isAdmin: false,
        isMember: true,
        joined: true,
        message: 'Joined channel',
      })
    }

    // Create new channel
    channel = await Channel.create({
      slug: payload.name,
      privacy: privacy,
    })

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
      name: channel.slug,
      privacy: channel.privacy,
      isAdmin: true,
      isMember: true,
      created: true,
    })
  }

  /**
   * DELETE /channels/:channelId
   * /quit command - admin deletes channel
   */
  async destroy({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    const channel = await Channel.findOrFail(channelId)

    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership || !membership.is_admin) {
      return response.forbidden({ message: 'Only channel admin can delete the channel' })
    }

    await channel.delete()
    return response.ok({ message: 'Channel deleted' })
  }

  /**
   * POST /channels/:channelId/leave
   * /cancel command
   */
  async leave({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    const channel = await Channel.findOrFail(channelId)

    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership) {
      return response.badRequest({ message: 'You are not a member of this channel' })
    }

    const memberCount = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .count('* as total')
      .first()

    // If admin leaves and is only member, delete channel
    if (membership.is_admin && Number(memberCount?.total) === 1) {
      await channel.delete()
      return response.ok({ message: 'Channel deleted (you were the last admin)', deleted: true })
    }

    // If admin leaves, transfer to oldest member
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

    await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .delete()

    return response.ok({ message: 'Left channel', deleted: false })
  }

  /**
   * POST /channels/:channelId/invite
   * /invite nickName command
   */
  async invite({ auth, params, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId
    const payload = await request.validateUsing(inviteUserValidator)

    const channel = await Channel.findOrFail(channelId)

    // Check if inviter is member
    const inviterMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!inviterMembership) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    // For private channels, only admin can invite
    if (channel.privacy === ChannelPrivacy.PRIVATE && !inviterMembership.is_admin) {
      return response.forbidden({ message: 'Only admin can invite to private channel' })
    }

    // Find user to invite
    const userToInvite = await User.findBy('username', payload.username)
    if (!userToInvite) {
      return response.notFound({ message: 'User not found' })
    }

    // Check if already member
    const existingMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userToInvite.id)
      .first()

    if (existingMembership) {
      return response.ok({ message: 'User is already a member' })
    }

    // Clear any kicks (admin inviting restores access)
    if (inviterMembership.is_admin) {
      await db
        .from('channel_kicks')
        .where('channel_id', channelId)
        .where('user_id', userToInvite.id)
        .delete()
    }

    // Add user to channel
    await db.table('channel_users').insert({
      channel_id: channelId,
      user_id: userToInvite.id,
      is_admin: false,
      alerts: ChannelAlerts.ALL,
      created_at: new Date(),
      updated_at: new Date(),
    })

    // Get inviter info for notification
    const inviter = await User.findOrFail(userId)

    // Notify invited user via WebSocket
    Ws.broadcastChannelInvite(userToInvite.id, {
      id: channel.id,
      name: channel.slug,
      privacy: channel.privacy,
      invitedBy: {
        id: inviter.id,
        username: inviter.username,
      },
    })

    return response.ok({
      message: `${payload.username} has been invited`,
      userId: userToInvite.id,
      username: userToInvite.username,
    })
  }

  /**
   * POST /channels/:channelId/kick
   * /kick nickName command
   */
  async kick({ auth, params, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId
    const payload = await request.validateUsing(inviteUserValidator)

    const channel = await Channel.findOrFail(channelId)

    const kickerMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!kickerMembership) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    const userToKick = await User.findBy('username', payload.username)
    if (!userToKick) {
      return response.notFound({ message: 'User not found' })
    }

    const targetMembership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userToKick.id)
      .first()

    if (!targetMembership) {
      return response.badRequest({ message: 'User is not a member of this channel' })
    }

    // Admin kick = permanent ban
    if (kickerMembership.is_admin) {
      // Remove from channel
      await db
        .from('channel_users')
        .where('channel_id', channelId)
        .where('user_id', userToKick.id)
        .delete()

      // Add 3 kicks to ensure ban
      for (let i = 0; i < 3; i++) {
        await db.table('channel_kicks').insert({
          channel_id: channelId,
          user_id: userToKick.id,
          kicked_by: userId,
          created_at: new Date(),
        })
      }

      // Notify kicked user via WebSocket
      Ws.broadcastChannelKicked(userToKick.id, channelId, channel.slug)

      return response.ok({
        message: `${payload.username} has been permanently kicked`,
        permanent: true,
      })
    }

    // Regular member kick - add one kick vote
    // Check if already kicked by this user
    const existingKick = await db
      .from('channel_kicks')
      .where('channel_id', channelId)
      .where('user_id', userToKick.id)
      .where('kicked_by', userId)
      .first()

    if (existingKick) {
      return response.badRequest({ message: 'You already voted to kick this user' })
    }

    await db.table('channel_kicks').insert({
      channel_id: channelId,
      user_id: userToKick.id,
      kicked_by: userId,
      created_at: new Date(),
    })

    // Count kicks
    const kickCount = await db
      .from('channel_kicks')
      .where('channel_id', channelId)
      .where('user_id', userToKick.id)
      .count('* as total')
      .first()

    const totalKicks = Number(kickCount?.total) || 0

    if (totalKicks >= 3) {
      // Remove from channel
      await db
        .from('channel_users')
        .where('channel_id', channelId)
        .where('user_id', userToKick.id)
        .delete()

      // Notify kicked user via WebSocket
      Ws.broadcastChannelKicked(userToKick.id, channelId, channel.slug)

      return response.ok({
        message: `${payload.username} has been kicked (3 votes reached)`,
        permanent: true,
        kickCount: totalKicks,
      })
    }

    return response.ok({
      message: `Vote recorded (${totalKicks}/3)`,
      permanent: false,
      kickCount: totalKicks,
    })
  }

  /**
   * POST /channels/:channelId/revoke
   * /revoke nickName command (admin only, private channels)
   */
  async revoke({ auth, params, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId
    const payload = await request.validateUsing(inviteUserValidator)

    const channel = await Channel.findOrFail(channelId)

    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership || !membership.is_admin) {
      return response.forbidden({ message: 'Only admin can revoke access' })
    }

    const userToRevoke = await User.findBy('username', payload.username)
    if (!userToRevoke) {
      return response.notFound({ message: 'User not found' })
    }

    // Remove from channel
    await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userToRevoke.id)
      .delete()

    return response.ok({ message: `${payload.username} access revoked` })
  }

  /**
   * GET /channels/:channelId/members
   * /list command
   */
  async members({ auth, params, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId

    // Check if user is member
    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    const members = await db
      .from('channel_users')
      .join('users', 'channel_users.user_id', 'users.id')
      .leftJoin('user_statuses', 'users.id', 'user_statuses.user_id')
      .where('channel_users.channel_id', channelId)
      .select(
        'users.id',
        'users.username',
        'users.first_name',
        'users.last_name',
        'channel_users.is_admin',
        'channel_users.created_at as joined_at',
        'user_statuses.state as status',
        'user_statuses.message as status_message'
      )
      .orderBy('channel_users.created_at', 'asc')

    // Default status to ONLINE if not set
    const membersWithStatus = members.map((m) => ({
      ...m,
      status: m.status || 'ONLINE',
      status_message: m.status_message || '',
    }))

    return response.ok(membersWithStatus)
  }

  /**
   * PUT /channels/:channelId/alerts
   * Update notification settings for a channel
   */
  async updateAlerts({ auth, params, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const channelId = params.channelId
    const { alerts } = request.only(['alerts'])

    // Validate alerts value
    if (!['ALL', 'MENTIONS', 'NONE'].includes(alerts)) {
      return response.badRequest({ message: 'Invalid alerts value. Must be ALL, MENTIONS, or NONE' })
    }

    // Check if user is member
    const membership = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()

    if (!membership) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    // Update alerts setting
    await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .update({ alerts, updated_at: new Date() })

    return response.ok({ message: 'Notification settings updated', alerts })
  }
}
