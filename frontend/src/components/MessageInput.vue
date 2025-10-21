<template>
  <div :style="{ contain: 'layout' }">
    <!-- TODO: render on client only -->
    <div
      class="absolute bg-black q-pa-md"
      :style="testProperty"
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
// import { reactive, ref } from 'vue';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

const message: Ref<string> = ref<string>('');

const formElement = ref();

const bounding = useElementBounding(formElement);
const size = useWindowSize();
const testProperty = computed(() => ({
  // todo: fix some hacks
  bottom: `${size.height.value - bounding.top.value}px`,
  marginBottom: '-1em',
}));

// TODO: convert into separate component and calculations
// TODO: fix this so it can work (vm.$nextTick, and wait until rendered)
</script>
