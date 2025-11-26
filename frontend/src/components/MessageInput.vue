<template>
  <div class="typing-preview q-mb-xs" v-if="showTyping">
    <span class="typing-username">Username</span>
    <span>&nbsp;is typing:&nbsp;</span>
    <span class="typing-text">{{ typedPreview }}</span>
  </div>
  <q-form
    class="column contain-layout reverse"
    @submit.prevent="onSubmit"
  >
    <q-input
      autogrow
      @keydown.enter.exact.prevent="onSubmit"
      @update:model-value="onInput"
      ref="inputField"
      standout
      type="textarea"
      v-model="message"
    >
      <template v-slot:append>
        <q-btn
          @click.prevent="onSubmit"
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
  </q-form>
</template>

<script setup lang="ts">
import type { Command } from 'src/models';
import type { ComputedRef, Ref } from 'vue';
import type { UseElementBoundingReturn } from '@vueuse/core';

import { QInput } from 'quasar';
import { computed, ref } from 'vue';
import { useElementBounding } from '@vueuse/core';

const emit = defineEmits<{
  (e: 'submit', message: string): void
  (e: 'typing'): void
}>()

const message: Ref<string> = ref<string>('');

const inputField: Ref<QInput | undefined> = ref<QInput | undefined>();

const inputBound: UseElementBoundingReturn
  = useElementBounding(inputField);

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

const inputHeight: ComputedRef<number> = computed<number>(() => {
  // if input field not loaded, do not add margin
  if (!inputField.value) return 0;

  // if input field is loaded, get the height reactively
  return inputBound.height.value;
});



const showTyping: ComputedRef<boolean> = computed<boolean>(() => {
  return !!message.value.trim();
})

const typedPreview = computed(() => {
  const s = message.value.replace(/\n/g, ' ↵ ')
  return s.length > 40 ? s.slice(0, 40) + '…' : s
})


function onInput(): void {
  // Emit typing event when user types
  if (message.value.trim()) {
    emit('typing')
  }
}

function onSubmit(): void {
  // submit the message above
  emit('submit', message.value);
  // clear the submitted message
  message.value = '';
}
</script>

<style scoped>
.typing-preview{
  background-color: var(--q-primary);
  width: 500px;
}

</style>
