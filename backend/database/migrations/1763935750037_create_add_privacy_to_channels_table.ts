import { BaseSchema } from '@adonisjs/lucid/schema'
import { ChannelPrivacy } from '#contracts/channel_privacy'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    // First create the enum type if it doesn't exist
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE channel_privacy AS ENUM ('PRIVATE', 'PUBLIC');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Then add the column
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enu('privacy', Object.values(ChannelPrivacy), {
          useNative: true,
          existingType: true,
          enumName: 'channel_privacy',
        })
        .notNullable()
        .defaultTo('PUBLIC')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('privacy')
    })
  }
}