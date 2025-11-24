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

import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useInterface } from 'src/stores/interface';
import ChannelMessage from 'components/ChannelMessage.vue';
import MessageInput from 'components/MessageInput.vue';
import { messagesService, type MessageResponse } from 'src/services/messages';

definePage({
  path: ':channel',
});

const appInterface = useInterface();
const route = useRoute();

// Hardcoded user ID for testing
const CURRENT_USER_ID = 1;

const messages: Ref<Message[]> = ref<Message[]>([]);
const hasMore = ref(true);
const currentPage = ref(1);
const isLoading = ref(false);

//Temporary
const channelNameToId: Record<string, number> = {
  'general': 1,
  'random': 2,
  'tech-talk': 3,
};

const channelId = computed(() => {
  const channelName = String((route.params as any).channel);
  return channelNameToId[channelName] || 1;
});


function transformMessage(msg: MessageResponse): Message {
  return {
    id: String(msg.id),
    author: {
      id: String(msg.user.id),
      email: '',
      name: `${msg.user.first_name} ${msg.user.last_name}`,
      username: msg.user.username,
      currentState: UserStates.online,
    },
    message: msg.content,
  };
}

async function loadMessages(page: number) {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const response = await messagesService.getMessages(CURRENT_USER_ID, channelId.value, page);

    const transformedMessages = response.data.map(transformMessage);

    messages.value.unshift(...transformedMessages.reverse());

    hasMore.value = response.meta.current_page < response.meta.last_page;
    currentPage.value = response.meta.current_page;
  } catch (error) {
    console.error('Failed to load messages:', error);
    hasMore.value = false;
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await loadMessages(1);
});

function onLoad(index: number, done: () => void) {
  if (!hasMore.value) {
    done();
    return;
  }

  void loadMessages(currentPage.value + 1).then(() => {
    done();
  });
}

async function onSubmit(message: string): Promise<void> {
  console.log('submitted');


  if (message === '/list') {
    console.log('list requested');
    appInterface.toggleRightSidebar();
    return;
  }

  // Submit message to API
  try {
    const response = await messagesService.createMessage(CURRENT_USER_ID, channelId.value, message);

    // Add new message to the list
    const newMessage = transformMessage(response);
    messages.value.push(newMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}
</script>

<style scoped >
.mention{
  background-color: rgb(143, 49, 172);
}
</style>
