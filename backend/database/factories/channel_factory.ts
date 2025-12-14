import factory from '@adonisjs/lucid/factories'
import Channel from '#models/channel'

export const ChannelFactory = factory
  .define(Channel, async ({ faker }) => {
    return {
      slug: faker.helpers.arrayElement([
        'general',
        'random',
        'tech-talk',
        'announcements',
        'help',
        'off-topic',
      ]),
      privacy: faker.helpers.arrayElement(['PUBLIC', 'PRIVATE']),
    }
  })
  .build()