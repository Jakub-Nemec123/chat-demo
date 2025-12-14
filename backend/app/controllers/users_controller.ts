import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { createUserValidator, updateUserValidator } from '#validators/user'

export default class UsersController {
  async store({ request, response }: HttpContext) {
    // TODO: convert into factory
    const payload = await createUserValidator.validate(request.all())
    const user: User = await User.create({
      email: payload.email,
      firstName: payload.name.first,
      lastName: payload.name.last,
      password: payload.password,
      username: payload.username,
    })

    const token: AccessToken = await User.accessTokens.create(user)

    return response.created({
      token: token.toJSON().token,
      expiresAt: token.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
  }
  async update({ auth, request, response }: HttpContext) {
    const user: User = auth.getUserOrFail()
    const payload = await updateUserValidator.validate(request.all())
    const newUser: User = await user.fill(payload).save()

    return response.ok(newUser)
  }
}
