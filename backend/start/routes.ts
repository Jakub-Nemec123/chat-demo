import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const SessionsController = () => import('#controllers/sessions_controller')
const UsersController = () => import('#controllers/users_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const MessagesController = () => import('#controllers/messages_controller')
const StatusController = () => import('#controllers/status_controller')

// Public routes (no auth)
router.group(() => {
  router.resource('users', UsersController).only(['store'])
  router.resource('sessions', SessionsController).only(['store'])
})

// Protected routes (auth required)
router
  .group(() => {
    // User status
    router.get('status', [StatusController, 'show'])
    router.put('status', [StatusController, 'update'])
    router.get('users/:userId/status', [StatusController, 'showUser'])

    // Channels CRUD
    router.get('channels', [ChannelsController, 'index'])
    router.post('channels', [ChannelsController, 'store'])
    router.get('channels/:channelId', [ChannelsController, 'show'])
    router.delete('channels/:channelId', [ChannelsController, 'destroy'])

    // Channel membership actions
    router.post('channels/:channelId/leave', [ChannelsController, 'leave'])
    router.post('channels/:channelId/invite', [ChannelsController, 'invite'])
    router.post('channels/:channelId/kick', [ChannelsController, 'kick'])
    router.post('channels/:channelId/revoke', [ChannelsController, 'revoke'])
    router.get('channels/:channelId/members', [ChannelsController, 'members'])
    router.put('channels/:channelId/alerts', [ChannelsController, 'updateAlerts'])

    // Messages
    router.get('channels/:channelId/messages', [MessagesController, 'index'])
    router.post('channels/:channelId/messages', [MessagesController, 'store'])
  })
  .use(middleware.auth())
