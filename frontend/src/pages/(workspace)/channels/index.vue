<template>
  <q-page class="column">
    <!-- Empty state content -->
    <div class="col-grow column items-center justify-center">
      <q-icon name="chat_bubble_outline" size="4em" color="grey-6" />
      <div class="text-h6 text-grey-6 q-mt-md">Select a channel</div>
      <div class="text-body2 text-grey-7 q-mt-sm">
        Or use <code>/join channelName</code> to create or join a channel
      </div>
    </div>

    <!-- Command result notification -->
    <div v-if="commandResult" class="q-px-md q-py-sm">
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

    <!-- Message input for commands -->
    <div class="col-shrink q-pa-md">
      <message-input @submit="onSubmit" placeholder="Type /join channelName to get started..." />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChannelsStore } from 'src/stores/channels'
import { useCommandsStore, type CommandResult } from 'src/stores/commands'
import MessageInput from 'components/MessageInput.vue'
import { Notify } from 'quasar'

const router = useRouter()
const channelsStore = useChannelsStore()
const commandsStore = useCommandsStore()

const commandResult = ref<CommandResult | null>(null)

async function onSubmit(input: string) {
  if (!input.trim()) return

  // Only commands work here (no channel selected)
  if (!commandsStore.isCommand(input)) {
    Notify.create({
      type: 'warning',
      message: 'Select a channel first, or use /join channelName'
    })
    return
  }

  commandResult.value = null

  try {
    const result = await commandsStore.executeCommand(input, null)
    commandResult.value = result

    // If join was successful, navigate to the channel
    if (result.success && result.data?.id && result.data?.name) {
      await router.push({ name: 'channels.show', params: { channel: result.data.name } })
    }

    // Auto-hide success messages
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
}
</script>

<style scoped>
code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
