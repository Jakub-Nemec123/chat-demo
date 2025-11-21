import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      // nullable in case of data error
      table.string('first_name').nullable()
      table.string('last_name').nullable()
      table.string('email').notNullable()
      table.string('password_hash').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(now)
      table.timestamp('updated_at').notNullable().defaultTo(now)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
