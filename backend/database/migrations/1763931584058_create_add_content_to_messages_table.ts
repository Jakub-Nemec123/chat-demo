import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected columnName = 'content'
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text(this.columnName).notNullable().defaultTo('')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn(this.columnName)
    })
  }
}
