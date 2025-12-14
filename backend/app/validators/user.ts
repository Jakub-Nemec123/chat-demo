import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    name: vine.object({
      first: vine.string().trim(),
      last: vine.string().trim().optional(),
    }),
    password: vine.string().trim().confirmed({
      confirmationField: 'passwordRepeat',
    }),
    username: vine
      .string()
      .alphaNumeric({
        allowDashes: true,
        allowSpaces: false,
        allowUnderscores: true,
      })
      .regex(/^[a-zA-Z]/)
      .trim(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().optional(),
    name: vine
      .object({
        first: vine.string().trim(),
        last: vine.string().trim().optional(),
      })
      .optional(),
    password: vine
      .string()
      .trim()
      .confirmed({
        confirmationField: 'passwordRepeat',
      })
      .optional(),
    username: vine
      .string()
      .alphaNumeric({
        allowDashes: true,
        allowSpaces: false,
        allowUnderscores: true,
      })
      .regex(/^[a-zA-Z]/)
      .trim()
      .optional(),
  })
)
