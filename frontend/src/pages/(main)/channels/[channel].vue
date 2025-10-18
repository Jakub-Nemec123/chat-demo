<template>
  <q-page class="column">
    <div class="col-grow q-px-md" v-if="'channel' in $route.params">
      <p>Aktuálny kanál: {{ $route.params.channel }}</p>
      <channel-message />
      <channel-message />
      <channel-message />
      <channel-message />
    </div>
    <div class="col-shrink q-pa-md">
      <message-input />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import ChannelMessage from 'components/ChannelMessage.vue';
import MessageInput from 'components/MessageInput.vue';
</script>
