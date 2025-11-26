import { BaseSchema } from '@adonisjs/lucid/schema'
import { StatusIndicator } from '#contracts/status_indicator'

export default class extends BaseSchema {
  protected tableName = 'user_statuses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      table.integer('user_id').references('users.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.text('message').notNullable()
      table
        .enu('state', Object.values(StatusIndicator), {
          enumName: 'status_indicator',
          existingType: false,
          useNative: true,
        })
        .notNullable()
      table.timestamp('created_at').notNullable().defaultTo(now)
      table.timestamp('updated_at').notNullable().defaultTo(now)
      table.timestamp('expires_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE status_indicator')
  }
}
