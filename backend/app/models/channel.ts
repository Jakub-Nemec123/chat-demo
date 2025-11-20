import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

enum Privacy {
  PRIVATE,
  PUBLIC,
}

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare privacy: Privacy

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
