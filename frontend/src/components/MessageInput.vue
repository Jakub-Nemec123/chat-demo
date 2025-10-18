<template>
  <form>
    <q-input
      standout
      v-model="message"
    >
      <template v-slot:append>
        <q-btn
          dense
          flat
          icon="send"
          type="submit"
        />
      </template>
    </q-input>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';

const message: Ref<string> = ref<string>('');
</script>
