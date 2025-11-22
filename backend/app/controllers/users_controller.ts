import { HttpContext } from '@adonisjs/core/http'
import { createUserValidator } from '#validators/user'
import User from '#models/user'

export default class UsersController {
  // TODO: adjust return
  async store({ request }: HttpContext): Promise<User> {
    const payload = await createUserValidator.validate(request.all())

    const user = await User.create({
      email: payload.email,
      first_name: payload.name.last,
      last_name: payload.name.last,
      password: payload.password,
      username: payload.username,
    })

    // TODO: adjust return
    return user
  }
}
