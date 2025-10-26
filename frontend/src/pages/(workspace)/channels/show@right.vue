<template>
  <aside class="bg-black full-height q-pa-md">
    <q-list dense>
      <q-item-label
        class="q-px-none q-py-sm text-bold text-uppercase"
        header
      >
        Online
      </q-item-label>
      <q-item
        class="q-px-none"
        :key="user.id"
        v-for="user in users"
      >
        <q-item-section side>
          <q-badge color="teal" label="on" />
        </q-item-section>
        <q-item-section>
          @{{ user.username }}
        </q-item-section>
      </q-item>
      <q-item-label
        class="q-px-none text-bold text-uppercase"
        header
      >
        Offline
      </q-item-label>
      <q-item
        class="q-px-none"
        :key="user.id"
        v-for="user in users"
      >
        <q-item-section side>
          <q-badge color="dark" label="off" />
        </q-item-section>
        <q-item-section>
          @{{ user.username }}
        </q-item-section>
      </q-item>
    </q-list>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { UserStates } from 'src/models';
import type { Ref } from 'vue';
import type { User } from 'src/models';

const users: Ref<User[]> = ref<User[]>([
  {
    id: '123',
    email: 'email@email.com',
    name: 'Name Name',
    username: 'username123',
    currentState: UserStates.offline
  },
  {
    id: '456',
    email: 'email@email.com',
    name: 'Name Name',
    username: 'username456',
    currentState: UserStates.online
  },
  {
    id: '789',
    email: 'email@email.com',
    name: 'Name Name',
    username: 'username789',
    currentState: UserStates.online
  },
]);
</script>
