import vine from '@vinejs/vine'
import { ChannelPrivacy } from '#contracts/channel_privacy'

export const createChannelValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .regex(/^[a-z0-9-]+$/),
    privacy: vine.enum(Object.values(ChannelPrivacy)).optional(),
  })
)

export const inviteUserValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(1),
  })
)
