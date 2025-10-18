<template>
  <div class="q-my-md">
    <p class="q-my-none text-bold">@username</p>
    <p
      class="q-my-none"
      :style="{ whiteSpace: 'pre-wrap' }"
      v-text="text"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const text = ref<string>(`ExampleExampleExampleExample\n\nExample`);
</script>
