import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      const now = this.raw('CURRENT_TIMESTAMP')

      table.increments('id')
      table.string('slug').notNullable()
      table.enu('privacy', ['PRIVATE', 'PUBLIC'], {
        enumName: 'channel_privacy',
        existingType: false,
        useNative: true,
      })
      table.timestamp('created_at').notNullable().defaultTo(now)
      table.timestamp('updated_at').notNullable().defaultTo(now)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
