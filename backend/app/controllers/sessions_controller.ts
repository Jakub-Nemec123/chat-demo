import User from '#models/user'
import { createSessionValidator } from '#validators/session'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async store({ request }: HttpContext): Promise<AccessToken> {
    const payload = await createSessionValidator.validate(request.all())
    const user = await User.verifyCredentials(payload.email, payload.password)
    const token: AccessToken = await User.accessTokens.create(user)

    return token
  }
}
