import vine from '@vinejs/vine'
import { StatusIndicator } from '#contracts/status_indicator'

export const updateStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(Object.values(StatusIndicator)),
    message: vine.string().trim().maxLength(100).optional(),
  })
)
