<template>
  <div class="q-my-md">
    <p class="q-my-none text-bold">@{{ message.author.username }}</p>
    <p
      class="q-my-none message-content"
      :style="{ whiteSpace: 'pre-wrap' }"
      v-html="formattedMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from 'src/models';

const props = defineProps<{
  message: Message
}>()

// Format message with highlighted mentions
const formattedMessage = computed(() => {
  // Escape HTML first to prevent XSS
  const escaped = props.message.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Highlight @mentions
  return escaped.replace(
    /@(\w+)/g,
    '<span class="mention-highlight">@$1</span>'
  )
})
</script>

<style scoped>
.message-content :deep(.mention-highlight) {
  background-color: rgba(156, 39, 176, 0.3);
  padding: 0 2px;
  border-radius: 3px;
  font-weight: 500;
}
</style>
