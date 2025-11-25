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
import { AppVisibility } from 'quasar';
import { Notify } from 'quasar';
import { useRoute } from 'vue-router';
import { useInterface } from 'src/stores/interface';

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

function Notification(){
  if (!AppVisibility.appVisible){
    Notify.create("Test notif")
  }
}

Notification()

const appInterface = useInterface();
const route: RouteLocation = useRoute();

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
