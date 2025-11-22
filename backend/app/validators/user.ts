import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    name: vine.object({
      first: vine.string().trim().optional(),
      last: vine.string().trim().optional(),
    }),
    password: vine.string().trim(),
    username: vine.string().trim(),
  })
)
