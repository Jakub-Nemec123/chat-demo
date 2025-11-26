import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { createUserValidator } from '#validators/user'

export default class UsersController {
  async store({ request }: HttpContext): Promise<AccessToken> {
    // TODO: convert into factory
    const payload = await createUserValidator.validate(request.all())
    const user: User = await User.create({
      email: payload.email,
      first_name: payload.name.first,
      last_name: payload.name.last,
      password: payload.password,
      username: payload.username,
    })

    const token: AccessToken = await User.accessTokens.create(user)
    return token
  }
}
