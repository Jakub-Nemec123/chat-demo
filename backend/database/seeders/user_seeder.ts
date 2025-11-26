import { UserFactory } from '#database/factories/user_factory'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  static environment: string[] = ['development', 'testing']

  async run() {
    // Create specific test users
    await User.createMany([
      {
        email: 'john@example.com',
        password: 'password123',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
      },
      {
        email: 'jane@example.com',
        password: 'password123',
        username: 'janesmith',
        first_name: 'Jane',
        last_name: 'Smith',
      },
      {
        email: 'bob@example.com',
        password: 'password123',
        username: 'bobwilson',
        first_name: 'Bob',
        last_name: 'Wilson',
      },
      {
        email: 'alice@example.com',
        password: 'password123',
        username: 'alicej',
        first_name: 'Alice',
        last_name: 'Johnson',
      },
      {
        email: 'charlie@example.com',
        password: 'password123',
        username: 'charlieb',
        first_name: 'Charlie',
        last_name: 'Brown',
      },
      {
        email: 'diana@example.com',
        password: 'password123',
        username: 'dianap',
        first_name: 'Diana',
        last_name: 'Prince',
      },
      {
        email: 'test@example.org',
        password: 'test_passw0rd!123',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
      },
    ])

    console.log('✅ Created 7 users')
    console.log('📧 Test login: test@example.org / test_passw0rd!123')
    console.log('📧 Other logins: [name]@example.com / password123')
  }
}
