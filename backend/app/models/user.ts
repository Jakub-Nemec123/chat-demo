import hash from '@adonisjs/core/services/hash'
import Channel from '#models/channel'
import UserStatus from '#models/user_status'
import { compose } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { BaseModel, column, manyToMany, hasOne } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasOne } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('argon'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
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

  @hasOne(() => UserStatus)
  declare status: HasOne<typeof UserStatus>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  currentAccessToken?: AccessToken

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    type: 'auth_token',
    table: 'access_tokens',
    prefix: 'chat_',
    expiresIn: '14 days',
    tokenSecretLength: 20,
  })
}
