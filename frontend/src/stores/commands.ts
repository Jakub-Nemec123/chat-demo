import { defineStore, acceptHMRUpdate } from 'pinia'
import { useChannelsStore } from './channels'
import { useMessagesStore } from './messages'
import { Notify } from 'quasar'

export interface CommandResult {
  success: boolean
  message: string
  data?: any
}

export interface ParsedCommand {
  command: string
  args: string[]
  raw: string
}

export const useCommandsStore = defineStore('commands', () => {
  const channelsStore = useChannelsStore()
  const messagesStore = useMessagesStore()

  /**
   * Parse input string to check if it's a command
   */
  function parseInput(input: string): ParsedCommand | null {
    const trimmed = input.trim()

    if (!trimmed.startsWith('/')) {
      return null
    }

    const parts = trimmed.slice(1).split(/\s+/)
    const command = parts[0]?.toLowerCase() || ''
    const args = parts.slice(1)

    return {
      command,
      args,
      raw: trimmed,
    }
  }

  /**
   * Execute a command
   */
  async function executeCommand(input: string, currentChannelId: number | null): Promise<CommandResult> {
    const parsed = parseInput(input)

    if (!parsed) {
      return { success: false, message: 'Not a command' }
    }

    try {
      switch (parsed.command) {
        case 'join':
          return await handleJoin(parsed.args)

        case 'cancel':
          return await handleCancel(currentChannelId)

        case 'quit':
          return await handleQuit(currentChannelId)

        case 'invite':
          return await handleInvite(parsed.args, currentChannelId)

        case 'kick':
          return await handleKick(parsed.args, currentChannelId)

        case 'revoke':
          return await handleRevoke(parsed.args, currentChannelId)

        case 'list':
          return await handleList(currentChannelId)

        default:
          return { success: false, message: `Unknown command: /${parsed.command}` }
      }
    } catch (e: any) {
      return {
        success: false,
        message: e.response?.data?.message || e.message || 'Command failed'
      }
    }
  }

  /**
   * /join channelName [private]
   */
  async function handleJoin(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return { success: false, message: 'Usage: /join channelName [private]' }
    }

    const channelName = args[0].toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const isPrivate = args[1]?.toLowerCase() === 'private'
    const privacy = isPrivate ? 'PRIVATE' : 'PUBLIC'

    const result = await channelsStore.joinOrCreateChannel(channelName, privacy)

    if (result.created) {
      return {
        success: true,
        message: `Created and joined #${channelName}`,
        data: result
      }
    } else if (result.joined) {
      return {
        success: true,
        message: `Joined #${channelName}`,
        data: result
      }
    } else {
      return {
        success: true,
        message: `Already a member of #${channelName}`,
        data: result
      }
    }
  }

  /**
   * /cancel - leave current channel
   */
  async function handleCancel(channelId: number | null): Promise<CommandResult> {
    if (!channelId) {
      return { success: false, message: 'No active channel to leave' }
    }

    const channel = channelsStore.activeChannel
    const result = await channelsStore.leaveChannel(channelId)

    if (result.deleted) {
      return { success: true, message: `Channel deleted (you were the last member)` }
    }

    return { success: true, message: `Left #${channel?.name}` }
  }

  /**
   * /quit - delete channel (admin only)
   */
  async function handleQuit(channelId: number | null): Promise<CommandResult> {
    if (!channelId) {
      return { success: false, message: 'No active channel' }
    }

    if (!channelsStore.isActiveChannelAdmin) {
      return { success: false, message: 'Only admin can delete the channel' }
    }

    const channel = channelsStore.activeChannel
    await channelsStore.deleteChannel(channelId)

    return { success: true, message: `Channel #${channel?.name} deleted` }
  }

  /**
   * /invite nickName
   */
  async function handleInvite(args: string[], channelId: number | null): Promise<CommandResult> {
    if (!channelId) {
      return { success: false, message: 'No active channel' }
    }

    if (args.length === 0) {
      return { success: false, message: 'Usage: /invite nickName' }
    }

    const username = args[0]
    const result = await channelsStore.inviteUser(channelId, username)

    return { success: true, message: result.message, data: result }
  }

  /**
   * /kick nickName
   */
  async function handleKick(args: string[], channelId: number | null): Promise<CommandResult> {
    if (!channelId) {
      return { success: false, message: 'No active channel' }
    }

    if (args.length === 0) {
      return { success: false, message: 'Usage: /kick nickName' }
    }

    const username = args[0]
    const result = await channelsStore.kickUser(channelId, username)

    return { success: true, message: result.message, data: result }
  }

  /**
   * /revoke nickName
   */
  async function handleRevoke(args: string[], channelId: number | null): Promise<CommandResult> {
    if (!channelId) {
      return { success: false, message: 'No active channel' }
    }

    if (args.length === 0) {
      return { success: false, message: 'Usage: /revoke nickName' }
    }

    const username = args[0]
    const result = await channelsStore.revokeUser(channelId, username)

    return { success: true, message: result.message, data: result }
  }

  /**
   * /list - show channel members
   */
  async function handleList(channelId: number | null): Promise<CommandResult> {
    if (!channelId) {
      return { success: false, message: 'No active channel' }
    }

    const members = await channelsStore.fetchMembers(channelId)

    const memberList = members.map((m: any) => {
      const name = `${m.first_name || ''} ${m.last_name || ''}`.trim()
      const admin = m.is_admin ? ' (admin)' : ''
      return `@${m.username}${name ? ` - ${name}` : ''}${admin}`
    }).join('\n')

    return {
      success: true,
      message: `Channel members:\n${memberList}`,
      data: { members, showInSidebar: true }
    }
  }

  /**
   * Check if input is a command
   */
  function isCommand(input: string): boolean {
    return input.trim().startsWith('/')
  }

  /**
   * Get available commands for autocomplete
   */
  function getAvailableCommands() {
    return [
      { command: 'join', args: ['channelName', '[private]'], description: 'Join or create a channel' },
      { command: 'cancel', args: [], description: 'Leave current channel' },
      { command: 'quit', args: [], description: 'Delete channel (admin only)' },
      { command: 'invite', args: ['nickName'], description: 'Invite user to channel' },
      { command: 'kick', args: ['nickName'], description: 'Kick user from channel' },
      { command: 'revoke', args: ['nickName'], description: 'Revoke user access (admin only)' },
      { command: 'list', args: [], description: 'Show channel members' },
    ]
  }

  /**
   * Filter commands for autocomplete based on input
   */
  function filterCommands(input: string) {
    if (!input.startsWith('/')) return []

    const search = input.slice(1).toLowerCase()
    return getAvailableCommands().filter(cmd =>
      cmd.command.startsWith(search)
    )
  }

  return {
    parseInput,
    executeCommand,
    isCommand,
    getAvailableCommands,
    filterCommands,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommandsStore, import.meta.hot))
}
