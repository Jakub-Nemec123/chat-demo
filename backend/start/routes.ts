import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const SessionsController = () => import('#controllers/sessions_controller')
const UsersController = () => import('#controllers/users_controller')
const MessagesController = () => import('#controllers/messages_controller')
const ChannelsController = () => import('#controllers/channels_controller')

// routes for inactive login
router.group(() => {
  router.resource('users', UsersController).only(['store'])
  router.resource('sessions', SessionsController).only(['store'])
})

// routes for active login
router
  .group(() => {
    // Channels
    router.get('channels', [ChannelsController, 'index'])
    router.post('channels', [ChannelsController, 'store'])
    router.get('channels/:channelId', [ChannelsController, 'show'])
    router.delete('channels/:channelId', [ChannelsController, 'destroy'])
    router.post('channels/:channelId/join', [ChannelsController, 'join'])
    router.post('channels/:channelId/leave', [ChannelsController, 'leave'])

    // Messages
    router.get('channels/:channelId/messages', [MessagesController, 'index'])
    router.post('channels/:channelId/messages', [MessagesController, 'store'])
  })
  .use(middleware.auth())
