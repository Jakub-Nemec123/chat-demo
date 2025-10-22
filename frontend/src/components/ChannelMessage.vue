<template>
  <div class="q-my-md">
    <p class="q-my-none text-bold">@{{ message.author.username }}</p>
    <p
      class="q-my-none"
      :style="{ whiteSpace: 'pre-wrap' }"
      v-text="message.message"
    />
  </div>
</template>

<script setup lang="ts">
import type { Message } from 'src/models';

defineProps<{
  message: Message
}>()
</script>
