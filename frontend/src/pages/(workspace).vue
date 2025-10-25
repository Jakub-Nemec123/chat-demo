<template>
  <q-layout view="hHh LpR lfr">
    <q-header elevated>
      <q-toolbar>
        <q-btn dense flat icon="menu" round v-if="has('left')" />
        <q-toolbar-title>Quasar App</q-toolbar-title>
        <q-btn dense flat icon="group" round v-if="has('right')" />
      </q-toolbar>
    </q-header>
    <q-drawer
      no-swipe-open
      persistent
      show-if-above
      side="left"
      v-if="has('left')"
    >
      <router-view name="left" />
    </q-drawer>
    <q-drawer
      no-swipe-open
      persistent
      show-if-above
      side="right"
      v-if="has('right')"
    >
      <router-view name="right" />
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { AppVisibility } from 'quasar';
import { Notify } from 'quasar';
import type { RouteLocation, RouteLocationMatched } from 'vue-router';
import { useRoute } from 'vue-router';

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

const route: RouteLocation = useRoute();
function has(view: string): boolean {
  if (!view) return false;

  return !!route.matched.find((route: RouteLocationMatched) => {
    if (!route.components) return false;

    return view in route.components;
  });
}
</script>
