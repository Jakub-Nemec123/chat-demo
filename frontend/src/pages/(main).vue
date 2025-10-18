<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Quasar App</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-drawer no-swipe-open persistent show-if-above side="left">
      <router-view name="sidebar" />
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
definePage({
  meta: {
    requiresAuth: true,
  },
});
</script>
