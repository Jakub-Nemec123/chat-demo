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

    <!-- Typing indicator -->
    <div v-if="typingUsers.length > 0" class="q-px-md q-py-xs text-grey-6 text-caption">
      <q-spinner-dots size="1em" class="q-mr-xs" />
      {{ typingText }}
    </div>

    <div class="col-shrink q-pa-md">
      <message-input
        @submit="onSubmit"
        @typing="onTyping"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import type { Message } from 'src/models';
import { UserStates } from 'src/models';

import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useInterface } from 'src/stores/interface';
import ChannelMessage from 'components/ChannelMessage.vue';
import MessageInput from 'components/MessageInput.vue';
import { messagesService, type MessageResponse } from 'src/services/messages';
import { channelsService } from 'src/services/channels';
import { wsService, type WsMessage } from 'src/services/websocket';

definePage({
  path: ':channel',
});

const appInterface = useInterface();
const route = useRoute();

const messages: Ref<Message[]> = ref<Message[]>([]);
const hasMore = ref(true);
const currentPage = ref(1);
const isLoading = ref(false);
const channelId = ref<number | null>(null);
const typingUsers = ref<number[]>([]);

const channelSlug = computed(() => String((route.params as any).channel));

const typingText = computed(() => {
  if (typingUsers.value.length === 0) return ''
  if (typingUsers.value.length === 1) return 'Someone is typing...'
  return `${typingUsers.value.length} people are typing...`
})

// Fetch channel ID from API based on slug
async function fetchChannelId() {
  try {
    const channels = await channelsService.getChannels();
    const channel = channels.find(c => c.slug === channelSlug.value);
    if (channel) {
      channelId.value = channel.id;
    } else {
      console.error('Channel not found:', channelSlug.value);
      channelId.value = null;
    }
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    channelId.value = null;
  }
}

function transformMessage(msg: MessageResponse): Message {
  return {
    id: String(msg.id),
    author: {
      id: String(msg.user.id),
      email: '',
      name: `${msg.user.first_name || ''} ${msg.user.last_name || ''}`.trim() || msg.user.username,
      username: msg.user.username,
      currentState: UserStates.online,
    },
    message: msg.content,
  };
}

function transformWsMessage(msg: WsMessage): Message {
  return {
    id: String(msg.id),
    author: {
      id: String(msg.user.id),
      email: '',
      name: `${msg.user.first_name || ''} ${msg.user.last_name || ''}`.trim() || msg.user.username,
      username: msg.user.username,
      currentState: UserStates.online,
    },
    message: msg.content,
  };
}

async function loadMessages(page: number) {
  if (isLoading.value || !channelId.value) return;

  isLoading.value = true;
  try {
    const response = await messagesService.getMessages(channelId.value, page);

    const transformedMessages = response.data.map(transformMessage);

    if (page === 1) {
      messages.value = transformedMessages.reverse();
    } else {
      messages.value.unshift(...transformedMessages.reverse());
    }

    hasMore.value = response.meta.current_page < response.meta.last_page;
    currentPage.value = response.meta.current_page;
  } catch (error) {
    console.error('Failed to load messages:', error);
    hasMore.value = false;
  } finally {
    isLoading.value = false;
  }
}

// Setup WebSocket
function setupWebSocket() {
  // Connect if not connected
  wsService.connect();

  // Handle new messages
  wsService.onMessage((wsMessage: WsMessage) => {
    // Only add if it's for current channel and not already in list
    if (wsMessage.channelId === channelId.value) {
      const exists = messages.value.find(m => m.id === String(wsMessage.id));
      if (!exists) {
        messages.value.push(transformWsMessage(wsMessage));
      }
    }
  });
}

// Join channel room when channelId changes
watch(channelId, (newId, oldId) => {
  if (oldId) {
    wsService.leaveChannel(oldId);
  }
  if (newId) {
    wsService.joinChannel(newId);
  }
});

// Watch for channel changes and reload
watch(channelSlug, async () => {
  messages.value = [];
  hasMore.value = true;
  currentPage.value = 1;
  channelId.value = null;
  typingUsers.value = [];
  await fetchChannelId();
  if (channelId.value) {
    await loadMessages(1);
  }
}, { immediate: false });

onMounted(async () => {
  setupWebSocket();
  await fetchChannelId();
  if (channelId.value) {
    await loadMessages(1);
    wsService.joinChannel(channelId.value);
  }
});

onUnmounted(() => {
  if (channelId.value) {
    wsService.leaveChannel(channelId.value);
  }
});

function onLoad(index: number, done: () => void) {
  if (!hasMore.value || !channelId.value) {
    done();
    return;
  }

  void loadMessages(currentPage.value + 1).then(() => {
    done();
  });
}

// Typing indicator handling
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

function onTyping() {
  if (!channelId.value) return;

  wsService.startTyping(channelId.value);

  // Clear previous timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // Stop typing after 2 seconds of no input
  typingTimeout = setTimeout(() => {
    if (channelId.value) {
      wsService.stopTyping(channelId.value);
    }
  }, 2000);
}

async function onSubmit(message: string): Promise<void> {
  console.log('submitted');

  // Stop typing indicator
  if (channelId.value) {
    wsService.stopTyping(channelId.value);
  }
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  if (message === '/list') {
    console.log('list requested');
    appInterface.toggleSidebar('right');
    return;
  }

  if (!channelId.value) {
    console.error('No channel ID');
    return;
  }

  // Submit message to API
  // Note: The message will be added via WebSocket broadcast
  try {
    await messagesService.createMessage(channelId.value, message);
    // Message will be added via WebSocket event
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
