<template>
  <q-page class="column">
    <!-- Messages area -->
    <div class="col-grow column reverse q-px-md scroll-vertical">
      <q-infinite-scroll
        reverse
        :offset="200"
        :disable="!hasMore"
        @load="onLoadMore"
      >
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner color="primary" name="dots" size="40px" />
          </div>
        </template>

        <div v-if="messagesStore.isLoading && messages.length === 0" class="text-center q-pa-xl">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-md text-grey-6">Loading messages...</div>
        </div>

        <div v-else-if="messages.length === 0" class="text-center q-pa-xl text-grey-6">
          No messages yet. Start the conversation!
        </div>

        <div v-else>
          <channel-message
            v-for="message in messages"
            :key="message.id"
            :message="transformMessage(message)"
            :class="{ 'mention': isMention(message) }"
          />
        </div>
      </q-infinite-scroll>
    </div>

    <!-- Command result notification -->
    <div v-if="commandResult" class="q-px-md q-py-sm bg-dark">
      <q-banner
        :class="commandResult.success ? 'bg-positive' : 'bg-negative'"
        dense
        rounded
      >
        <template v-slot:avatar>
          <q-icon :name="commandResult.success ? 'check' : 'error'" />
        </template>
        {{ commandResult.message }}
        <template v-slot:action>
          <q-btn flat dense icon="close" @click="commandResult = null" />
        </template>
      </q-banner>
    </div>

    <!-- Typing indicator -->
    <div v-if="typingUsers.length > 0" class="q-px-md q-py-xs">
      <q-expansion-item
        dense
        dense-toggle
        switch-toggle-side
        :label="typingHeaderText"
        header-class="text-grey-6 text-caption"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-spinner-dots size="1em" />
          </q-item-section>
          <q-item-section class="text-grey-6 text-caption">
            {{ typingHeaderText }}
          </q-item-section>
        </template>

        <q-card class="bg-dark">
          <q-card-section class="q-py-sm">
            <div
              v-for="user in typingUsers"
              :key="user.userId"
              class="q-mb-xs"
            >
              <span class="text-bold text-primary">@{{ getUserName(user.userId) }}:</span>
              <span class="text-grey-4 q-ml-sm" style="font-style: italic;">
                {{ user.content || '...' }}
              </span>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>

    <!-- Message input -->
    <div class="col-shrink q-pa-md">
      <message-input :channel-id="channelId" @submit="onSubmit" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChannelsStore } from 'src/stores/channels'
import { useMessagesStore, type Message } from 'src/stores/messages'
import { useCommandsStore, type CommandResult } from 'src/stores/commands'
import { useInterface } from 'src/stores/interface'
import { useAuth } from 'src/composables/useAuth'
import ChannelMessage from 'components/ChannelMessage.vue'
import MessageInput from 'components/MessageInput.vue'
import { UserStates } from 'src/models'
import { Notify } from 'quasar'
import { wsService, type WsMessage } from 'src/services/websocket'

definePage({
  path: ':channel',
})

const route = useRoute()
const channelsStore = useChannelsStore()
const messagesStore = useMessagesStore()
const commandsStore = useCommandsStore()
const interfaceStore = useInterface()
const auth = useAuth()

const commandResult = ref<CommandResult | null>(null)

// Get current channel ID from route
const channelId = computed(() => {
  const channelName = route.params.channel as string
  const channel = channelsStore.findChannelByName(channelName)
  return channel?.id || null
})

// Get messages for current channel
const messages = computed(() => {
  if (!channelId.value) return []
  return messagesStore.getMessages(channelId.value)
})

// Check if there are more messages to load
const hasMore = computed(() => {
  if (!channelId.value) return false
  return messagesStore.hasMoreMessages(channelId.value)
})

// Get typing users for current channel
const typingUsers = computed(() => {
  if (!channelId.value) return []

  const allTyping = wsService.getTypingUsers(channelId.value)
  // Filter out current user
  return allTyping.filter(u => u.userId !== auth.state.currentUser?.id)
})

// Get typing header text
const typingHeaderText = computed(() => {
  const count = typingUsers.value.length
  if (count === 0) return ''

  const names = typingUsers.value.map(u => getUserName(u.userId))

  if (count === 1) {
    return `${names[0]} is typing...`
  } else if (count === 2) {
    return `${names[0]} and ${names[1]} are typing...`
  } else {
    return `${count} people are typing...`
  }
})

// Get username by userId
function getUserName(userId: number): string {
  const member = channelsStore.members.find(m => m.id === userId)
  return member?.username || `User ${userId}`
}

// Transform store message to component format
function transformMessage(msg: Message) {
  return {
    id: String(msg.id),
    author: {
      id: String(msg.userId),
      email: '',
      name: `${msg.user.firstName || ''} ${msg.user.lastName || ''}`.trim() || msg.user.username,
      username: msg.user.username,
      currentState: UserStates.online,
    },
    message: msg.content,
  }
}

// Check if message mentions current user
function isMention(msg: Message): boolean {
  const currentUsername = auth.state.currentUser?.username
  if (!currentUsername) return false

  // Match @username with word boundaries (case insensitive)
  const mentionRegex = new RegExp(`@${currentUsername}\\b`, 'i')
  return mentionRegex.test(msg.content)
}

// Load messages when channel changes
async function loadMessages() {
  if (!channelId.value) return

  try {
    await messagesStore.fetchMessages(channelId.value, 1)
  } catch (error) {
    console.error('Failed to load messages:', error)
    Notify.create({
      type: 'negative',
      message: 'Failed to load messages'
    })
  }
}

// Load more messages (infinite scroll)
async function onLoadMore(index: number, done: () => void) {
  console.log('[InfiniteScroll] onLoadMore triggered', {
    index,
    channelId: channelId.value,
    hasMore: hasMore.value,
    pagination: messagesStore.getPagination(channelId.value || 0)
  })

  if (!channelId.value || !hasMore.value) {
    console.log('[InfiniteScroll] Skipping - no channel or no more messages')
    done()
    return
  }

  try {
    console.log('[InfiniteScroll] Loading more messages...')
    await messagesStore.loadMoreMessages(channelId.value)
    console.log('[InfiniteScroll] Loaded successfully')
  } catch (error) {
    console.error('Failed to load more messages:', error)
  }

  done()
}

// Handle message/command submission
async function onSubmit(input: string) {
  if (!input.trim()) return

  // Check if it's a command
  if (commandsStore.isCommand(input)) {
    commandResult.value = null

    try {
      const result = await commandsStore.executeCommand(input, channelId.value)

      // handle special commands
      if (result.data?.showInSidebar) {
        interfaceStore.toggleSidebar('right')
      }

      // auto-hide successful messages after 3 seconds
      if (result.success && result.data?.showMessage !== false) {
        commandResult.value = result

        setTimeout(() => {
          if (commandResult.value === result) {
            commandResult.value = null
          }
        }, 3000)
      }
    } catch (error: any) {
      commandResult.value = {
        success: false,
        message: error.message || 'Command failed'
      }
    }
    return
  }

  // Regular message
  if (!channelId.value) {
    Notify.create({
      type: 'negative',
      message: 'No channel selected'
    })
    return
  }

  try {
    await messagesStore.sendMessage(channelId.value, input)
    // Update channel activity
    channelsStore.updateChannelActivity(channelId.value)
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to send message'
    })
  }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(wsMessage: WsMessage) {
  console.log('[Channel] Received WebSocket message:', wsMessage)

  // Transform WebSocket message to store format
  const message: Message = {
    id: wsMessage.id,
    userId: wsMessage.userId,
    channelId: wsMessage.channelId,
    content: wsMessage.content,
    createdAt: wsMessage.createdAt,
    updatedAt: wsMessage.updatedAt,
    user: {
      id: wsMessage.user.id,
      username: wsMessage.user.username,
      firstName: wsMessage.user.first_name,
      lastName: wsMessage.user.last_name,
    }
  }

  // Add to messages store
  messagesStore.addMessage(message)
}

// Watch for channel changes
watch(channelId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Leave old channel
    if (oldId) {
      console.log('[Channel] Leaving WebSocket channel:', oldId)
      wsService.leaveChannel(oldId)
    }

    // Load messages for new channel
    loadMessages()
    channelsStore.setActiveChannel(newId)

    // Join new channel via WebSocket
    if (newId) {
      console.log('[Channel] Joining WebSocket channel:', newId)
      wsService.joinChannel(newId)
    }
  }
}, { immediate: true })

// Initial load and WebSocket setup
onMounted(() => {
  console.log('[Channel] Component mounted, initializing WebSocket')

  // Connect to WebSocket
  wsService.connect()

  // Register message handler
  wsService.onMessage(handleWebSocketMessage)

  // Load initial messages
  if (channelId.value) {
    loadMessages()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  console.log('[Channel] Component unmounting, leaving channel')
  if (channelId.value) {
    wsService.leaveChannel(channelId.value)
  }
  // Remove message handler
  wsService.offMessage(handleWebSocketMessage)
})
</script>

<style scoped>
.mention {
  background-color: rgba(156, 39, 176, 0.3);
  border-left: 3px solid #9c27b0;
}
</style>
