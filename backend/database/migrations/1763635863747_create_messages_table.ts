import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      // when channel is deleted, delete all the messages as well
      table.integer('user_id').references('users.id').onUpdate('CASCADE').onDelete('RESTRICT')
      table.integer('channel_id').references('channels.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.text('content').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(now)
      table.timestamp('updated_at').notNullable().defaultTo(now)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
