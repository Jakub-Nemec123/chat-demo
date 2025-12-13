<template>
  <q-layout view="hHh LpR lfr">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          @click="appInterface.toggleSidebar('left')"
          dense
          flat
          icon="menu"
          round
          v-if="has('left')"
        />
        <q-toolbar-title>Quasar App</q-toolbar-title>
        <q-btn
          @click="appInterface.toggleSidebar('right')"
          dense
          flat
          icon="group"
          round
          v-if="has('right')"
        />
      </q-toolbar>
    </q-header>
    <q-drawer
      :model-value="appInterface.sidebar.left"
      no-swipe-open
      persistent
      show-if-above
      side="left"
      v-if="has('left')"
    >
      <component :is="get('left')" />
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
    <q-drawer
      :model-value="appInterface.sidebar.right"
      no-swipe-open
      persistent
      side="right"
      v-if="has('right')"
    >
      <component :is="get('right')" />
    </q-drawer>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { AppVisibility, Notify } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useInterface } from 'src/stores/interface';
import { useChannelsStore } from 'src/stores/channels';
import { useUserStore } from 'src/stores/user';
import { useMessagesStore } from 'src/stores/messages';
import { useAuth } from 'src/composables/useAuth';
import { wsService, type WsMessage } from 'src/services/websocket';

import type {
  RouteComponent,
  RouteLocation,
  RouteLocationMatched
} from 'vue-router';

definePage({
  meta: {
    requiresAuth: true,
  },
  name: false,
});

const appInterface = useInterface();
const channelsStore = useChannelsStore();
const userStore = useUserStore();
const messagesStore = useMessagesStore();
const auth = useAuth();
const route: RouteLocation = useRoute();
const router = useRouter();

// Request browser notification permission on mount
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// Check if message mentions current user
function isMentioned(content: string): boolean {
  const username = auth.state.currentUser?.username;
  if (!username) return false;
  const mentionRegex = new RegExp(`@${username}\\b`, 'i');
  return mentionRegex.test(content);
}

// Show browser notification for new message
function showMessageNotification(message: WsMessage) {
  console.log('[Notification] Checking notification for message:', {
    messageId: message.id,
    appVisible: AppVisibility.appVisible,
    userStatus: userStore.currentStatus,
    notificationPermission: 'Notification' in window ? Notification.permission : 'not supported',
    fromUserId: message.userId,
    currentUserId: auth.state.currentUser?.id,
    channelsCount: channelsStore.channels.length,
  });

  // Don't notify if app is visible
  if (AppVisibility.appVisible) {
    console.log('[Notification] Skipping - app is visible');
    return;
  }

  // Don't notify if user is DND
  if (!userStore.shouldReceiveNotifications()) {
    console.log('[Notification] Skipping - user is DND');
    return;
  }

  // Don't notify for own messages
  if (message.userId === auth.state.currentUser?.id) {
    console.log('[Notification] Skipping - own message');
    return;
  }

  // Get channel to check alert settings
  const channel = channelsStore.channels.find(c => c.id === message.channelId);

  // If channel not in store yet, show notification anyway (default behavior)
  const channelName = channel?.name || `channel-${message.channelId}`;
  const channelAlerts = channel?.alerts || 'ALL';

  // Check channel alert settings
  if (channelAlerts === 'NONE') {
    console.log('[Notification] Skipping - channel alerts set to NONE');
    return;
  }
  if (channelAlerts === 'MENTIONS' && !isMentioned(message.content)) {
    console.log('[Notification] Skipping - channel alerts set to MENTIONS but not mentioned');
    return;
  }

  console.log('[Notification] Showing notification!');

  // Check browser notification permission
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('[Notification] Using Quasar fallback');
    // Fallback to Quasar notify
    Notify.create({
      message: `${message.user.username}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      caption: `#${channelName}`,
      type: 'info',
      timeout: 5000,
      actions: [
        {
          label: 'Open',
          color: 'white',
          handler: () => router.push(`/channels/${channelName}`)
        }
      ]
    });
    return;
  }

  console.log('[Notification] Using browser notification');
  // Show browser notification
  const notification = new Notification(`${message.user.username} in #${channelName}`, {
    body: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
    icon: '/icons/favicon-96x96.png',
    tag: `message-${message.id}`,
  });

  notification.onclick = () => {
    window.focus();
    router.push(`/channels/${channelName}`);
    notification.close();
  };

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
}

// Handle incoming messages for notifications
function handleNewMessage(message: WsMessage) {
  console.log('[Workspace] New message received:', message);

  // Add to store
  messagesStore.addMessage({
    id: message.id,
    userId: message.userId,
    channelId: message.channelId,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    user: {
      id: message.user.id,
      username: message.user.username,
      firstName: message.user.first_name,
      lastName: message.user.last_name,
    }
  });

  // Show notification
  showMessageNotification(message);
}

// Initialize WebSocket and register channel event handlers
onMounted(async () => {
  console.log('[Workspace] Initializing WebSocket connection');

  // Request notification permission
  await requestNotificationPermission();

  wsService.connect();

  // Handle new messages
  wsService.onMessage(handleNewMessage);

  // Handle channel invite
  wsService.onChannelInvited((data) => {
    console.log('[Workspace] Received channel invite:', data);
    channelsStore.handleChannelInvite(data);

    // Show notification
    Notify.create({
      type: 'info',
      message: `${data.invitedBy.username} invited you to #${data.channel.name}`,
      actions: [
        {
          label: 'Open',
          color: 'white',
          handler: () => {
            router.push(`/channels/${data.channel.name}`);
          }
        }
      ],
      timeout: 5000,
    });
  });

  // Handle channel kicked
  wsService.onChannelKicked((data) => {
    console.log('[Workspace] Kicked from channel:', data);
    channelsStore.handleChannelKicked(data);

    Notify.create({
      type: 'warning',
      message: `You have been removed from #${data.channelName}`,
      timeout: 5000,
    });

    // If currently viewing that channel, redirect
    if (route.params.channel === data.channelName) {
      router.push('/channels');
    }
  });

  // Handle channel deleted
  wsService.onChannelDeleted((data) => {
    console.log('[Workspace] Channel deleted:', data);
    channelsStore.removeChannel(data.channelId);

    Notify.create({
      type: 'warning',
      message: 'Channel has been deleted',
      timeout: 3000,
    });
  });
});

onUnmounted(() => {
  console.log('[Workspace] Disconnecting WebSocket');
  wsService.disconnect();
});

function get(view: string): RouteComponent | undefined {
  if (!view) return undefined;

  // matches the latest route with a defined template
  return route.matched.findLast(
    (route: RouteLocationMatched): boolean => {
      if (!route.components) return false;
      return view in route.components;
    }
  )?.components?.[view];
}

function has(view: string): boolean {
  return !!get(view);
}
</script>
