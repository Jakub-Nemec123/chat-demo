<template>
  <q-page class="column">
    <div
      class="col-grow column reverse q-px-md scroll-vertical"
    >

      <q-infinite-scroll
        reverse
        :offset="500"
        :disable="!hasMore"
        @load="onLoad">
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner color="primary" name="dots" size="40px" />
          </div>
        </template>
        <!-- maybe turn into ordered list? -->
        <div>
          <channel-message
            :key="message.id"
            :message="message"
            :class="{'mention': message.message === '@testuser' }"
            v-for="message in messages"
          />
        </div>
      </q-infinite-scroll>
    </div>
    <div class="col-shrink q-pa-md">
      <message-input
        @submit="onSubmit"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import type { Message } from 'src/models';
import { UserStates } from 'src/models';

import { ref } from 'vue';
import { useInterface } from 'src/stores/interface';
import ChannelMessage from 'components/ChannelMessage.vue';
import MessageInput from 'components/MessageInput.vue';

definePage({
  path: ':channel',
});

const appInterface = useInterface();

const messages: Ref<Message[]> = ref<Message[]>([
  {
    id: 'testm_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'lorem',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a message\n\nTest multi-line',
  },
  {
    id: 'message_123',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: '@testuser',
  },
  {
    id: 'message_456',
    author: {
      id: '123',
      email: 'test@example.com',
      name: 'Full name',
      username: 'username',
      currentState: UserStates.online
    },
    message: 'This is a newer message\n\nTest multi-line',
  },
]);

const hasMore = ref(true)



function onLoad(index: number, done: () => void) {

  setTimeout(() => {

    const older: Message[] = [
      {
        id: 'message_' + Math.random().toString(36).slice(2),
        author: {
          id: '456',
          email: 'other@example.com',
          name: 'Other',
          username: 'other',
          currentState: UserStates.offline
        },
        message: 'Older message #' + (index + 1)
      },
      {
        id: 'message_' + Math.random().toString(36).slice(2),
        author: {
          id: '457',
          email: 'other@example.com',
          name: 'Other',
          username: 'other',
          currentState: UserStates.offline
        },
        message: 'Older message #' + (index + 2)
      },
      {
        id: 'message_' + Math.random().toString(36).slice(2),
        author: {
          id: '458',
          email: 'other@example.com',
          name: 'Other',
          username: 'other',
          currentState: UserStates.offline
        },
        message: 'Older message #' + (index + 3)
      },
    ]


    messages.value.unshift(...older)
    hasMore.value = false

    done()

  }, 2000)
}

function onSubmit(message: string): void {
  console.log('submitted');

  // check if it’s a list command
  // if so, toggle the sidebar
  if (message === '/list') {
    console.log('list requested');
    appInterface.toggleRightSidebar();
  }
}
</script>

<style scoped >
.mention{
  background-color: rgb(143, 49, 172);
}
</style>
