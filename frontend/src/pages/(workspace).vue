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
import { AppVisibility } from 'quasar';
import { Notify } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useInterface } from 'src/stores/interface';
import { useChannelsStore } from 'src/stores/channels';
import { wsService } from 'src/services/websocket';

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
const route: RouteLocation = useRoute();
const router = useRouter();

// Initialize WebSocket and register channel event handlers
onMounted(() => {
  console.log('[Workspace] Initializing WebSocket connection')
  wsService.connect()

  // Handle channel invite
  wsService.onChannelInvited((data) => {
    console.log('[Workspace] Received channel invite:', data)
    channelsStore.handleChannelInvite(data)

    // Show notification
    Notify.create({
      type: 'info',
      message: `${data.invitedBy.username} invited you to #${data.channel.name}`,
      actions: [
        {
          label: 'Open',
          color: 'white',
          handler: () => {
            router.push(`/channels/${data.channel.name}`)
          }
        }
      ],
      timeout: 5000,
    })
  })

  // Handle channel kicked
  wsService.onChannelKicked((data) => {
    console.log('[Workspace] Kicked from channel:', data)
    channelsStore.handleChannelKicked(data)

    Notify.create({
      type: 'warning',
      message: `You have been removed from #${data.channelName}`,
      timeout: 5000,
    })

    // If currently viewing that channel, redirect
    if (route.params.channel === data.channelName) {
      router.push('/channels')
    }
  })

  // Handle channel deleted
  wsService.onChannelDeleted((data) => {
    console.log('[Workspace] Channel deleted:', data)
    channelsStore.removeChannel(data.channelId)

    Notify.create({
      type: 'warning',
      message: 'Channel has been deleted',
      timeout: 3000,
    })
  })
})

onUnmounted(() => {
  console.log('[Workspace] Disconnecting WebSocket')
  wsService.disconnect()
})

function Notification(){
  if (!AppVisibility.appVisible){
    Notify.create("Test notif")
  }
}

Notification()

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
