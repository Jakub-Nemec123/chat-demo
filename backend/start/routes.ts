import router from '@adonisjs/core/services/router'
const SessionsController = () => import('#controllers/sessions_controller')
const UsersController = () => import('#controllers/users_controller')

router.resource('users', UsersController).only(['store'])
router.resource('sessions', SessionsController).only(['store'])
