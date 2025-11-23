import vine from '@vinejs/vine'

export const createSessionValidator = vine.compile(
  vine.object({
    // do not enforce usual user validation when logging in
    // in case of user has created an account in the past
    // and the rules have been changed in the meantime
    email: vine.string().trim(),
    password: vine.string().trim(),
  })
)
