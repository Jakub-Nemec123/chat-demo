<template>
  <div :style="{ contain: 'layout' }">
    <!-- TODO: render on client only -->
    <div
      class="absolute bg-black q-pa-md"
      :style="testProperty"
      v-if="availableCommands.length > 0"
    >
      <p class="text-bold">Commands:</p>
      <pre
        :key="command"
        v-for="command in availableCommands"
        v-text="command"
      />
    </div>
    <form ref="formElement">
      <q-input
        autogrow
        standout
        type="textarea"
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
import type { Ref } from 'vue';
import { computed, ref } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

const message: Ref<string> = ref<string>('');
const commands: Ref<string[]> = ref<string[]>([
  '/join [channelName] [private=true|false]',
  '/invite [username]',
  '/revoke [username]',
  '/join [channelName]',
  '/invite [username]',
  '/kick [username]',
  '/quit – delete channel',
]);

const availableCommands = computed<string[]>(() => {
  if (!message.value) return [];

  return commands.value.filter((command: string) => (
    command.startsWith(message.value)
  ));
});

// TODO: REMOVE these hacks
const formElement = ref();
const bounding = useElementBounding(formElement);
const size = useWindowSize();
const testProperty = computed(() => ({
  // todo: fix some hacks
  bottom: `${size.height.value - bounding.top.value}px`,
  marginBottom: '-1em',
}));
// TODO: REMOVE these hacks
</script>
