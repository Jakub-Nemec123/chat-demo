import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const SessionsController = () => import('#controllers/sessions_controller')
const UsersController = () => import('#controllers/users_controller')
const MessagesController = () => import('#controllers/messages_controller')
const ChannelsController = () => import('#controllers/channels_controller')

router.resource('users', UsersController).only(['store'])
router.resource('sessions', SessionsController).only(['store'])

// Channel routes
router.get('/users/:userId/channels', [ChannelsController, 'index'])
router.get('/users/:userId/channels/:channelId', [ChannelsController, 'show'])

// Message routes
router.get('/users/:userId/channels/:channelId/messages', [MessagesController, 'index'])
router.post('/users/:userId/channels/:channelId/messages', [MessagesController, 'store'])
