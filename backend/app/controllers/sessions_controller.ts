import User from '#models/user'
import { createSessionValidator } from '#validators/session'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async store({ request }: HttpContext) {
    const payload = await createSessionValidator.validate(request.all())
    const user = await User.verifyCredentials(payload.email, payload.password)
    const token = await User.accessTokens.create(user)

    return {
      type: 'bearer',
      value: token.value!.release(),
    }
  }
}
