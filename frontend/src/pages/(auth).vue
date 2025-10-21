<template>
  <q-layout class="full-width" view="hhh lpr fff">
    <q-page-container class="hero-bg">
      <router-view class="flex flex-center" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
definePage({
  name: false,
})
</script>
