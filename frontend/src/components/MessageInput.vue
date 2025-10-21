<template>
  <div>
    <!-- TODO: render on client only -->
    <div
      class="absolute bg-black q-pa-md"
      :style="{ bottom: formEdge }"
    >
      <p class="text-bold">Commands:</p>
      <pre>
        /join [channelName] [private=true|false]
        /invite [username]
        /revoke [username]
        /join [channelName]
        /invite [username]
        /kick [username]
        /quit – delete channel
      </pre>
    </div>
    <form ref="formElement">
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
  </div>
</template>

<script setup lang="ts">
import { dom } from 'quasar';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';

const message: Ref<string> = ref<string>('');

const formElement = ref();
// TODO: convert into separate component and calculations
// TODO: fix this so it can work (vm.$nextTick, and wait until rendered)
const formEdge = computed<number | undefined>(() => {
  if (!formElement.value) return 0;
  return window.innerHeight - formElement.value?.offsetTop;
});
</script>
