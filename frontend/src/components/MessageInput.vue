<template>
  <div :style="{ contain: 'layout' }">
    <!-- TODO: render on client only -->
    <!-- TODO: separate into a component -->
    <div
      class="absolute bg-black q-pa-md"
      :style="testProperty"
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
import type { ComputedRef, Ref } from 'vue';
import type { Command } from 'src/models';
import { computed, ref } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

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
