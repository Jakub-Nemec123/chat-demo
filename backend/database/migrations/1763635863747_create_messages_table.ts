import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').references('users.id').onUpdate('CASCADE').onDelete('RESTRICT')
      // when channel is deleted, delete all the messages as well
      table.integer('channel_id').references('channels.id').onUpdate('CASCADE').onDelete('CASCADE')
      table.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP')
      table.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
