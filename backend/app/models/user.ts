import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare first_name: string | null

  @column()
  declare last_name: string | null

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ columnName: 'password_hash', serializeAs: null })
  declare password: string

  @manyToMany(() => Channel, {
    pivotTable: 'channel_users',
    pivotColumns: ['is_admin', 'alerts'],
    pivotTimestamps: true,
  })
  declare channels: ManyToMany<typeof Channel>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
