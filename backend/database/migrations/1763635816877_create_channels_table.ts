import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('slug').notNullable()
      table.enu('privacy', ['PRIVATE', 'PUBLIC'], {
        enumName: 'channel_privacy',
        existingType: false,
        useNative: true,
      })
      table.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP')
      table.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
