<template>
  <div class="message-input-wrapper">
    <!-- Command autocomplete -->
    <div
      v-if="filteredCommands.length > 0"
      class="command-suggestions bg-dark q-pa-sm rounded-borders q-mb-xs"
    >
      <div class="text-caption text-grey-6 q-mb-xs">Commands:</div>
      <div
        v-for="cmd in filteredCommands"
        :key="cmd.command"
        class="command-item q-pa-xs cursor-pointer"
        :class="{ 'bg-primary': selectedIndex === filteredCommands.indexOf(cmd) }"
        @click="selectCommand(cmd)"
      >
        <span class="text-bold text-primary">/{{ cmd.command }}</span>
        <span v-for="arg in cmd.args" :key="arg" class="text-grey-5 q-ml-xs">
          [{{ arg }}]
        </span>
        <span class="text-grey-6 q-ml-sm">- {{ cmd.description }}</span>
      </div>
    </div>

    <!-- Input form -->
    <q-form @submit.prevent="onSubmit">
      <q-input
        ref="inputField"
        v-model="message"
        autogrow
        standout
        type="textarea"
        :placeholder="props.placeholder"
        @keydown.enter.exact.prevent="onSubmit"
        @keydown.tab.prevent="onTab"
        @keydown.up.prevent="onArrowUp"
        @keydown.down.prevent="onArrowDown"
        @keydown.escape="clearSuggestions"
      >
        <template v-slot:append>
          <q-btn
            @click.prevent="onSubmit"
            dense
            flat
            icon="send"
            type="submit"
            :disable="!message.trim()"
          />
        </template>
      </q-input>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { QInput } from 'quasar'
import { useCommandsStore } from 'src/stores/commands'
import { wsService } from 'src/services/websocket'

const props = withDefaults(defineProps<{
  placeholder?: string
  channelId?: number | null
}>(), {
  placeholder: 'Type a message or /command...',
  channelId: null
})

const emit = defineEmits<{
  (e: 'submit', message: string): void
}>()

const commandsStore = useCommandsStore()

const message = ref('')
const inputField = ref<QInput>()
const selectedIndex = ref(0)
let typingTimeout: ReturnType<typeof setTimeout> | null = null
let isTyping = false

// Get filtered commands based on input
const filteredCommands = computed(() => {
  return commandsStore.filterCommands(message.value)
})

// Reset selection when commands change
watch(filteredCommands, () => {
  selectedIndex.value = 0
})

// Watch for message changes to send typing indicator with content
watch(message, (newValue) => {
  if (!props.channelId) return

  // Don't send typing for commands
  if (newValue.startsWith('/')) {
    if (isTyping) {
      wsService.stopTyping(props.channelId)
      isTyping = false
    }
    return
  }

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  if (newValue.length > 0) {
    // Send typing update with content
    wsService.updateTyping(props.channelId, newValue)
    isTyping = true

    // Stop typing after 3 seconds of inactivity
    typingTimeout = setTimeout(() => {
      if (props.channelId && isTyping) {
        wsService.stopTyping(props.channelId)
        isTyping = false
      }
    }, 3000)
  } else {
    // Message cleared
    if (isTyping && props.channelId) {
      wsService.stopTyping(props.channelId)
      isTyping = false
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
  if (isTyping && props.channelId) {
    wsService.stopTyping(props.channelId)
  }
})

// Select command from suggestions
function selectCommand(cmd: { command: string; args: string[] }) {
  message.value = `/${cmd.command} `
  inputField.value?.focus()
}

// Handle Tab key for autocomplete
function onTab() {
  if (filteredCommands.value.length > 0) {
    selectCommand(filteredCommands.value[selectedIndex.value])
  }
}

// Navigate suggestions with arrow keys
function onArrowUp() {
  if (filteredCommands.value.length > 0) {
    selectedIndex.value = Math.max(0, selectedIndex.value - 1)
  }
}

function onArrowDown() {
  if (filteredCommands.value.length > 0) {
    selectedIndex.value = Math.min(filteredCommands.value.length - 1, selectedIndex.value + 1)
  }
}

function clearSuggestions() {
  if (message.value.startsWith('/') && message.value.length <= 1) {
    message.value = ''
  }
}

// Submit message
function onSubmit() {
  const trimmed = message.value.trim()
  if (!trimmed) return

  // If showing suggestions and user presses Enter, select the highlighted command
  if (filteredCommands.value.length > 0 && !trimmed.includes(' ')) {
    selectCommand(filteredCommands.value[selectedIndex.value])
    return
  }

  // Stop typing indicator
  if (isTyping && props.channelId) {
    wsService.stopTyping(props.channelId)
    isTyping = false
  }

  emit('submit', trimmed)
  message.value = ''
}
</script>

<style scoped>
.message-input-wrapper {
  position: relative;
}

.command-suggestions {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.command-item {
  border-radius: 4px;
  transition: background-color 0.2s;
}

.command-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
