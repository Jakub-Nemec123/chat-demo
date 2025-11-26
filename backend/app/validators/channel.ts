import vine from '@vinejs/vine'
import { ChannelPrivacy } from '#contracts/channel_privacy'

export const createChannelValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .regex(/^[a-z0-9-]+$/), // slug format: lowercase, numbers, hyphens only
    privacy: vine.enum(Object.values(ChannelPrivacy)),
  })
)

export const updateChannelValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    privacy: vine.enum(Object.values(ChannelPrivacy)).optional(),
  })
)
