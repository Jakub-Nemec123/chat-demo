<template>
  <q-page class="column">
    <div
      class="col-grow column reverse q-px-md scroll-vertical"
    >
      <channel-message
        :key="message.id"
        :message="message"
        v-for="message in messages"
      />
    </div>
    <div class="col-shrink q-pa-md">
      <message-input />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import type { Message } from 'src/models';

import { ref } from 'vue';
import ChannelMessage from 'components/ChannelMessage.vue';
import MessageInput from 'components/MessageInput.vue';

// IMPORTANT WARNING:
// first message is considered the latest (is rendered as last)
const messages: Ref<Message[]> = ref<Message[]>([
  {
    id: 'message_456',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
    },
    message: 'This is a better message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
    },
    message: 'This is a message\n\nTest multi-line',
  },
]);
</script>
