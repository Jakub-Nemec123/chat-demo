import { UserFactory } from '#database/factories/user_factory'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static environment: string[] = ['development', 'testing']

  async run() {
    await UserFactory.createMany(5)
    await UserFactory.merge({
      email: 'test@exmaple.org',
      password: 'test_passw0rd!123',
      username: 'example_test',
    }).create()
  }
}
