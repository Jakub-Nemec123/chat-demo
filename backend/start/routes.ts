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
    router.get('channels', [ChannelsController, 'index'])
    router.get('channels/:channelId', [ChannelsController, 'show'])
    router.get('channels/:channelId/messages', [MessagesController, 'index'])
    router.post('channels/:channelId/messages', [MessagesController, 'store'])
  })
  .use(middleware.auth())
