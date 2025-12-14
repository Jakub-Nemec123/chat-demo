import User from '#models/user'
import { createSessionValidator } from '#validators/session'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async store({ request, response }: HttpContext) {
    const payload = await createSessionValidator.validate(request.all())
    const user: User = await User.verifyCredentials(payload.email, payload.password)
    const token: AccessToken = await User.accessTokens.create(user)

    return response.ok({
      token: token.toJSON().token,
      expiresAt: token.toJSON().expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      }
    })
  }
}
