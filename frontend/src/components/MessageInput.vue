<template>
  <div class="typing-preview q-mb-xs" v-if="showTyping">
    <span class="typing-username">Username</span>
    <span>&nbsp;is typing:&nbsp;</span>
    <span class="typing-text">{{ typedPreview }}</span>
  </div>

  <form class="column contain-layout reverse">
    <q-input
      autogrow
      ref="inputField"
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
    <!-- todo: separate into component -->
    <div
      class="absolute bg-black full-width q-pa-md"
      :style="{ marginBottom: `${inputHeight}px` }"
      v-if="availableCommands.length > 0"
    >
      <p class="text-bold">Commands:</p>
      <p
        :key="command.callable"
        v-for="command in availableCommands"
      >
        <span class="text-bold">
          /{{ command.callable }}
        </span>
        <span
          :key="argument.name"
          v-for="argument in command.arguments"
        >
          [{{ argument.name }}]
        </span>
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Command } from 'src/models';
import type { ComputedRef, Ref } from 'vue';

import { QInput } from 'quasar';
import { computed, ref } from 'vue';
import { useElementBounding } from '@vueuse/core';

const message: Ref<string> = ref<string>('');

const availableCommands: ComputedRef<Command[]> =
  computed<Command[]>(() => {
    if (!message.value.startsWith('/')) return [];

    // todo: put the list somewhere else
    return [
      {
        arguments: [
          { name: 'username', required: true },
        ],
        callable: 'invite',
      } as Command,
      {
        callable: 'list',
      } as Command,
      {
        arguments: [
          { name: 'channel_name', required: true },
          { name: 'private', required: false },
        ],
        callable: 'join',
      } as Command,
      {
        arguments: [
          { name: 'username', required: true },
        ],
        callable: 'kick',
      } as Command,
      {
        callable: 'quit',
      } as Command,
      {
        arguments: [
          { name: 'username', required: true },
        ],
        callable: 'revoke',
      } as Command,
    ].filter((command: Command) => {
      // if regex isn’t matching `/[command]`, return false
      const test: RegExpMatchArray | null
        = message.value.match(/\/(\w+)*/);
      if (test === null) return false;

      // get the first group of the callable
      // if not found, return false
      const callable = test[1] || '';
      return command.callable.startsWith(callable);
    });
  });

const inputField: Ref<QInput | undefined> = ref<QInput | undefined>();
const inputHeight: ComputedRef<number> = computed<number>(() => {
  // if input field not loaded, do not add margin
  if (!inputField.value) return 0;

  // if input field is loaded, get the height reactively
  return useElementBounding(inputField).height.value;
});



const showTyping: boolean = computed<boolean>(() => {
  return !!message.value.trim();
})

const typedPreview = computed(() => {
  const s = message.value.replace(/\n/g, ' ↵ ')
  return s.length > 40 ? s.slice(0, 40) + '…' : s
})


</script>

<style scoped>
.typing-preview{
  background-color: var(--q-primary);
  width: 500px;
}

</style>
