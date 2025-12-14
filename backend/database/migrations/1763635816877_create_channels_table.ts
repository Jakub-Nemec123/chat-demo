import { BaseSchema } from '@adonisjs/lucid/schema'
import { ChannelPrivacy } from '#contracts/channel_privacy'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      table.string('slug').notNullable().unique()
      table
        .enu('privacy', Object.values(ChannelPrivacy), {
          enumName: 'channel_privacy',
          existingType: false,
          useNative: true,
        })
        .notNullable()
      table.timestamp('created_at').notNullable().defaultTo(now)
      table.timestamp('updated_at').notNullable().defaultTo(now)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS channel_privacy CASCADE')
  }
}
