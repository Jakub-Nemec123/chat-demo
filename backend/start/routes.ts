import router from '@adonisjs/core/services/router'
const UsersController = () => import('#controllers/users_controller')

router.resource('users', UsersController).only(['store'])
