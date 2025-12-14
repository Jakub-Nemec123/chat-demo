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
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        email: 'jane@example.com',
        password: 'password123',
        username: 'janesmith',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      {
        email: 'bob@example.com',
        password: 'password123',
        username: 'bobwilson',
        firstName: 'Bob',
        lastName: 'Wilson',
      },
      {
        email: 'alice@example.com',
        password: 'password123',
        username: 'alicej',
        firstName: 'Alice',
        lastName: 'Johnson',
      },
      {
        email: 'charlie@example.com',
        password: 'password123',
        username: 'charlieb',
        firstName: 'Charlie',
        lastName: 'Brown',
      },
      {
        email: 'diana@example.com',
        password: 'password123',
        username: 'dianap',
        firstName: 'Diana',
        lastName: 'Prince',
      },
      {
        email: 'test@example.org',
        password: 'test_passw0rd!123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
    ])

    console.log('✅ Created 7 users')
    console.log('📧 Test login: test@example.org / test_passw0rd!123')
    console.log('📧 Other logins: [name]@example.com / password123')
  }
}
