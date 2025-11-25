import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Channel from '#models/channel'
import User from '#models/user'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  static environment: string[] = ['development', 'testing']

  async run() {
    // Get all existing users
    const users = await User.all()

    if (users.length === 0) {
      console.log('No users found. Please run user seeder first.')
      return
    }

    // Create channels
    const generalChannel = await Channel.create({
      slug: 'general',
      privacy: 'PUBLIC',
    })

    const randomChannel = await Channel.create({
      slug: 'random',
      privacy: 'PUBLIC',
    })

    const techChannel = await Channel.create({
      slug: 'tech-talk',
      privacy: 'PRIVATE',
    })

    // Add users to channels using pivot table
    // General channel - all users
    for (const user of users) {
      await db.table('channel_users').insert({
        channel_id: generalChannel.id,
        user_id: user.id,
        is_admin: user.id === 1, // First user is admin
        alerts: 'ALL',
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    // Random channel - first 4 users
    for (let i = 0; i < Math.min(4, users.length); i++) {
      await db.table('channel_users').insert({
        channel_id: randomChannel.id,
        user_id: users[i].id,
        is_admin: i === 0,
        alerts: 'MENTIONS',
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    // Tech channel - last 3 users
    const techUsers = users.slice(-3)
    for (let i = 0; i < techUsers.length; i++) {
      await db.table('channel_users').insert({
        channel_id: techChannel.id,
        user_id: techUsers[i].id,
        is_admin: i === 0,
        alerts: 'ALL',
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    // Create some messages in general channel
    const generalMessages = [
      'Welcome to the general channel!',
      'Hello everyone!',
      'How is everyone doing today?',
      'This is a great place to chat!',
      'Looking forward to collaborating with you all.',
    ]

    for (let i = 0; i < generalMessages.length; i++) {
      await Message.create({
        userId: users[i % users.length].id,
        channelId: generalChannel.id,
        content: generalMessages[i],
      })
    }

    // Create some messages in random channel
    const randomMessages = [
      'Random thought of the day...',
      'Did you see that new movie?',
      'Coffee break time!',
    ]

    for (let i = 0; i < randomMessages.length; i++) {
      await Message.create({
        userId: users[i % Math.min(4, users.length)].id,
        channelId: randomChannel.id,
        content: randomMessages[i],
      })
    }

    // Create tech messages
    const techMessages = ['Anyone working with TypeScript?', 'New framework looks promising!']

    for (let i = 0; i < techMessages.length; i++) {
      await Message.create({
        userId: techUsers[i % techUsers.length].id,
        channelId: techChannel.id,
        content: techMessages[i],
      })
    }

    console.log('✅ Created 3 channels')
    console.log('✅ Added users to channels')
    console.log('✅ Created sample messages')
  }
}
