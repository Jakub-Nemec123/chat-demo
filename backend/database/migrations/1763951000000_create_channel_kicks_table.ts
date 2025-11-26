import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_kicks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      table.integer('channel_id').references('channels.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.integer('user_id').references('users.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.integer('kicked_by').references('users.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamp('created_at').notNullable().defaultTo(now)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
