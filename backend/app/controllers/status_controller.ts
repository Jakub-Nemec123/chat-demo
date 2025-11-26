import type { HttpContext } from '@adonisjs/core/http'
import UserStatus from '#models/user_status'
import User from '#models/user'
import { updateStatusValidator } from '#validators/status'
import { StatusIndicator } from '#contracts/status_indicator'

export default class StatusController {
  /**
   * GET /status
   * Get current user's status
   */
  async show({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const status = await UserStatus.query()
      .where('user_id', user.id)
      .first()

    if (!status) {
      return response.ok({
        status: StatusIndicator.ONLINE,
        message: '',
      })
    }

    return response.ok({
      status: status.indicator,
      message: status.message,
    })
  }

  /**
   * PUT /status
   * Update current user's status
   */
  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateStatusValidator)

    let status = await UserStatus.query()
      .where('user_id', user.id)
      .first()

    if (status) {
      status.indicator = payload.status as StatusIndicator
      status.message = payload.message || ''
      await status.save()
    } else {
      status = await UserStatus.create({
        userId: user.id,
        indicator: payload.status as StatusIndicator,
        message: payload.message || '',
      })
    }

    return response.ok({
      status: status.indicator,
      message: status.message,
    })
  }

  /**
   * GET /users/:userId/status
   * Get another user's status
   */
  async showUser({ params, response }: HttpContext) {
    const userId = params.userId

    const user = await User.find(userId)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    const status = await UserStatus.query()
      .where('user_id', userId)
      .first()

    if (!status) {
      return response.ok({
        userId: user.id,
        username: user.username,
        status: StatusIndicator.ONLINE,
        message: '',
      })
    }

    return response.ok({
      userId: user.id,
      username: user.username,
      status: status.indicator,
      message: status.message,
    })
  }
}
