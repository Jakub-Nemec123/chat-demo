import router from '@adonisjs/core/services/router'
const UsersController = () => import('#controllers/users_controller')

router.get('/', async () => 'It works!')
router.resource('users', UsersController).only(['store'])
