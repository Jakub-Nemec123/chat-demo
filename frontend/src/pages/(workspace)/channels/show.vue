<template>
  <q-page class="column">
    <!-- Messages area -->
    <div class="col-grow column reverse q-px-md scroll-vertical">
      <q-infinite-scroll
        reverse
        :offset="500"
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

    <!-- Message input -->
    <div class="col-shrink q-pa-md">
      <message-input @submit="onSubmit" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
  return msg.content.includes(`@${currentUsername}`)
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
  if (!channelId.value || !hasMore.value) {
    done()
    return
  }

  try {
    await messagesStore.loadMoreMessages(channelId.value)
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
      commandResult.value = result

      // Handle special command results
      if (result.data?.showInSidebar) {
        interfaceStore.openRightSidebar()
      }

      // Auto-hide success messages after 3 seconds
      if (result.success) {
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

// Watch for channel changes
watch(channelId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadMessages()
    channelsStore.setActiveChannel(newId)
  }
}, { immediate: true })

// Initial load
onMounted(() => {
  if (channelId.value) {
    loadMessages()
  }
})
</script>

<style scoped>
.mention {
  background-color: rgba(156, 39, 176, 0.3);
  border-left: 3px solid #9c27b0;
}
</style>
