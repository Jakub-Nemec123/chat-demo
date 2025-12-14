import { BaseSchema } from '@adonisjs/lucid/schema'
import { ChannelAlerts } from '#contracts/channel_alerts'

export default class extends BaseSchema {
  protected tableName = 'channel_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      // a deleted user will automatically leave the channel
      // a deleted channel will no longer have any active users
      table.integer('channel_id').references('channels.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.integer('user_id').references('users.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.unique(['channel_id', 'user_id'])
      table.boolean('is_admin').notNullable().defaultTo(false)
      table
        .enu('alerts', Object.values(ChannelAlerts), {
          enumName: 'channel_user_alerts',
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
    this.schema.raw('DROP TYPE IF EXISTS channel_user_alerts CASCADE')
  }
}
