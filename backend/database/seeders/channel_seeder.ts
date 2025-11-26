import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Channel from '#models/channel'
import User from '#models/user'
import Message from '#models/message'
import UserStatus from '#models/user_status'
import db from '@adonisjs/lucid/services/db'
import { ChannelPrivacy } from '#contracts/channel_privacy'
import { ChannelAlerts } from '#contracts/channel_alerts'
import { StatusIndicator } from '#contracts/status_indicator'

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
    const channels = await Channel.createMany([
      { slug: 'general', privacy: ChannelPrivacy.PUBLIC },
      { slug: 'random', privacy: ChannelPrivacy.PUBLIC },
      { slug: 'tech-talk', privacy: ChannelPrivacy.PUBLIC },
      { slug: 'gaming', privacy: ChannelPrivacy.PUBLIC },
      { slug: 'music', privacy: ChannelPrivacy.PUBLIC },
      { slug: 'movies', privacy: ChannelPrivacy.PUBLIC },
      { slug: 'secret-club', privacy: ChannelPrivacy.PRIVATE },
      { slug: 'vip-lounge', privacy: ChannelPrivacy.PRIVATE },
    ])

    const [general, random, tech, gaming, music, movies, secret, vip] = channels

    // Helper to add member
    const addMember = async (channelId: number, userId: number, isAdmin: boolean, alerts: string = ChannelAlerts.ALL) => {
      await db.table('channel_users').insert({
        channel_id: channelId,
        user_id: userId,
        is_admin: isAdmin,
        alerts: alerts,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    // General channel - all users
    for (let i = 0; i < users.length; i++) {
      await addMember(general.id, users[i].id, i === 0, i % 3 === 0 ? ChannelAlerts.MENTIONS : ChannelAlerts.ALL)
    }

    // Random channel - 6 users
    const randomUsers = users.slice(0, Math.min(6, users.length))
    for (let i = 0; i < randomUsers.length; i++) {
      await addMember(random.id, randomUsers[i].id, i === 0)
    }

    // Tech channel - 5 users
    const techUsers = users.slice(0, Math.min(5, users.length))
    for (let i = 0; i < techUsers.length; i++) {
      await addMember(tech.id, techUsers[i].id, i === 0)
    }

    // Gaming channel - 4 users
    const gamingUsers = users.slice(1, Math.min(5, users.length))
    for (let i = 0; i < gamingUsers.length; i++) {
      await addMember(gaming.id, gamingUsers[i].id, i === 0)
    }

    // Music channel - 4 users
    const musicUsers = users.slice(2, Math.min(6, users.length))
    for (let i = 0; i < musicUsers.length; i++) {
      await addMember(music.id, musicUsers[i].id, i === 0)
    }

    // Movies channel - 4 users
    const movieUsers = users.slice(0, Math.min(4, users.length))
    for (let i = 0; i < movieUsers.length; i++) {
      await addMember(movies.id, movieUsers[i].id, i === 0)
    }

    // Secret club - 3 users
    const secretUsers = users.slice(0, Math.min(3, users.length))
    for (let i = 0; i < secretUsers.length; i++) {
      await addMember(secret.id, secretUsers[i].id, i === 0)
    }

    // VIP lounge - 2 users
    const vipUsers = users.slice(0, Math.min(2, users.length))
    for (let i = 0; i < vipUsers.length; i++) {
      await addMember(vip.id, vipUsers[i].id, i === 0)
    }

    // User statuses
    const statuses = [
      StatusIndicator.ONLINE,
      StatusIndicator.ONLINE,
      StatusIndicator.DND,
      StatusIndicator.ONLINE,
      StatusIndicator.OFFLINE,
      StatusIndicator.DND,
    ]
    const statusMessages = [
      'Working on new features',
      '',
      'In a meeting',
      'Available for chat',
      '',
      'Focusing on work',
    ]

    for (let i = 0; i < Math.min(users.length, statuses.length); i++) {
      await UserStatus.create({
        userId: users[i].id,
        indicator: statuses[i],
        message: statusMessages[i],
      })
    }

    // Messages for general channel
    const generalMessages = [
      'Welcome to the general channel everyone! 🎉',
      'Thanks for setting this up!',
      'Hey everyone, glad to be here',
      'This chat app looks really nice',
      'Agreed! Love the dark theme',
      '@testuser can you share the project docs?',
      'Sure! I will post them in #tech-talk',
      'Good morning everyone!',
      'Morning! How is everyone doing?',
      'Pretty good, working on some new features',
      'Has anyone tried the new /list command?',
      'Yes! It shows all channel members with their status',
      'Reminder: team meeting tomorrow at 10am',
      'Thanks for the reminder!',
      'Will there be coffee? ☕',
      'Of course! 😄',
      'Anyone up for lunch today?',
      'I am in!',
      'Count me in too',
      'Good morning everyone! Happy Friday! 🎊',
      'TGIF!',
      'Weekend plans anyone?',
      'Just relaxing at home',
      'Going hiking if the weather is nice',
      'Sounds fun! Where?',
    ]

    for (let i = 0; i < generalMessages.length; i++) {
      const userIndex = i % users.length
      await Message.create({
        userId: users[userIndex].id,
        channelId: general.id,
        content: generalMessages[i],
      })
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for random channel
    const randomMessages = [
      'This is the random channel - anything goes!',
      'Did you see that new sci-fi movie?',
      'Which one? There are so many lately',
      'The one with the robots and time travel',
      'Oh I loved that one! The ending was mind-blowing',
      'No spoilers please! I havent seen it yet',
      'Random thought: why do we park in driveways? 🤔',
      'Asking the real questions here 😂',
      'English is weird',
      'Anyone watching the game tonight?',
      'Which game?',
      'The championship final!',
      'Definitely watching. Go team! 🏆',
    ]

    for (let i = 0; i < randomMessages.length; i++) {
      const userIndex = i % randomUsers.length
      await Message.create({
        userId: randomUsers[userIndex].id,
        channelId: random.id,
        content: randomMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for tech channel
    const techMessages = [
      'Welcome to tech-talk! Share your coding adventures here',
      'Has anyone worked with Vue 3 composition API?',
      'Yes! It is much cleaner than the options API',
      'I prefer the setup syntax with script setup',
      'Same here. TypeScript support is also better',
      'What about state management? Vuex or Pinia?',
      'Pinia all the way! It is the official recommendation now',
      'Pinia is so much simpler to use',
      'Anyone using Socket.io for real-time features?',
      'Yes, we use it for our chat application',
      'How do you handle authentication with websockets?',
      'We send the JWT token on connection and verify server-side',
      'That is the standard approach. Works well',
      'New TypeScript 5.3 features look amazing!',
      'The import attributes are nice',
    ]

    for (let i = 0; i < techMessages.length; i++) {
      const userIndex = i % techUsers.length
      await Message.create({
        userId: techUsers[userIndex].id,
        channelId: tech.id,
        content: techMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for gaming channel
    const gamingMessages = [
      'Gamers unite! 🎮',
      'What is everyone playing these days?',
      'Been hooked on that new RPG',
      'I am still grinding in my favorite MMO',
      'Anyone up for some co-op tonight?',
      'I am down! What time?',
      'How about 8pm?',
      'Works for me!',
      'Count me in too',
      'GG everyone, that was fun!',
    ]

    for (let i = 0; i < gamingMessages.length; i++) {
      const userIndex = i % gamingUsers.length
      await Message.create({
        userId: gamingUsers[userIndex].id,
        channelId: gaming.id,
        content: gamingMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for music channel
    const musicMessages = [
      'Music lovers, welcome! 🎵',
      'What genres does everyone like?',
      'Rock and indie mostly',
      'Jazz and classical for me',
      'I produce electronic music',
      'That is cool! Can we hear some?',
      'I will share a link soon!',
      'Anyone going to any concerts soon?',
      'There is a festival next month I want to check out',
    ]

    for (let i = 0; i < musicMessages.length; i++) {
      const userIndex = i % musicUsers.length
      await Message.create({
        userId: musicUsers[userIndex].id,
        channelId: music.id,
        content: musicMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for movies channel
    const movieMessages = [
      'Movie buffs assemble! 🎬',
      'What should we watch this weekend?',
      'I heard that new thriller is really good',
      'I am more in the mood for a comedy',
      'We could do a double feature!',
      'Great idea!',
    ]

    for (let i = 0; i < movieMessages.length; i++) {
      const userIndex = i % movieUsers.length
      await Message.create({
        userId: movieUsers[userIndex].id,
        channelId: movies.id,
        content: movieMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for secret club
    const secretMessages = [
      'Welcome to the secret club 🤫',
      'What happens in secret club stays in secret club',
      'First rule of secret club...',
      'We do not talk about secret club 😄',
      'But seriously, this is for project planning',
      'Got it. What is on the agenda?',
    ]

    for (let i = 0; i < secretMessages.length; i++) {
      const userIndex = i % secretUsers.length
      await Message.create({
        userId: secretUsers[userIndex].id,
        channelId: secret.id,
        content: secretMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Messages for VIP lounge
    const vipMessages = [
      'Welcome to the VIP lounge ✨',
      'Feeling fancy!',
      'This is for special announcements',
      'Looking forward to them!',
    ]

    for (let i = 0; i < vipMessages.length; i++) {
      const userIndex = i % vipUsers.length
      await Message.create({
        userId: vipUsers[userIndex].id,
        channelId: vip.id,
        content: vipMessages[i],
      })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    console.log('✅ Created 8 channels (6 public, 2 private)')
    console.log('✅ Added users to channels with various roles')
    console.log('✅ Set user statuses')
    console.log('✅ Created ~80 sample messages')
  }
}
