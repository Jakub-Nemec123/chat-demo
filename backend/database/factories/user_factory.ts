import Factory from '@adonisjs/lucid/factories'
import User from '#models/user'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    email: faker.internet.email(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    password: faker.internet.password(),
    username: faker.internet.username(),
  }
}).build()
