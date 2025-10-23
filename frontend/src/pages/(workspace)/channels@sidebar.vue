<template>
  <aside class="bg-black column full-height">
    <div
      class="
        col-grow
        column
        q-px-md
        q-py-lg
        q-gutter-sm
        scroll-vertical
      "
    >
      <router-link
        custom
        :key="channel.id"
        v-for="channel in channels"
        v-slot="{ href, isActive }"
        :to="{
          name: 'channels.[channel]',
          params: {
            channel: channel.name,
          },
        }"
      >
        <q-btn
          align="left"
          :color="isActive ? 'primary' : 'none'"
          :label="'# ' + channel.name"
          no-caps
          :to="href"
          unelevated
        />
      </router-link>
    </div>
    <div class="userbar" v-if="auth.state.currentUser">
      <div class="userbar-left">
        <div class="userbar-info">
          <div class="name">{{ auth.state.currentUser.username }}</div>
          <div class="tag">{{ auth.state.currentUser.name }}</div>
        </div>
      </div>
      <div class="q-gutter-x-sm">
        <q-btn
          dense flat icon="settings"
          @click="handleSettings"
          aria-label="Nastavenia"
        />
        <q-btn
          dense flat icon="logout"
          @click="handleLogout"
          aria-label="Logout"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Channel } from 'src/models';
import { ChannelPrivacy } from 'src/models';
import { useRouter } from 'vue-router';
import { useAuth } from 'src/composables/useAuth';


const channels = ref<Channel[]>([
  { id: 1, name: 'general', type: ChannelPrivacy.public },
  { id: 2, name: 'lobby', type: ChannelPrivacy.public },
  { id: 3, name: 'general2', type: ChannelPrivacy.public },
  { id: 4, name: 'lobby2', type: ChannelPrivacy.public },
  { id: 5, name: 'general3', type: ChannelPrivacy.public },
  { id: 6, name: 'lobby3', type: ChannelPrivacy.public },
  { id: 7, name: 'general4', type: ChannelPrivacy.public },
  { id: 8, name: 'lobby4', type: ChannelPrivacy.public },
])

const router = useRouter()
const auth = useAuth()

async function handleSettings(){
  await router.push({ name: 'settings.index' })
}

async function handleLogout(){
  auth.logout()
  await router.replace({name: 'sign.in'})
}
</script>

<style>

.userbar{
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #222;
  background: #0a0b0f;
}

.userbar-left{
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar-skeleton {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2a2d34;
}

.userbar-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}

.userbar .name {
  font-size: 14px;
  color: #fff;
}

.userbar .tag {
  font-size: 12px;
  color: #9aa0a6;
}

.settings-btn {
  border: none;
  background: transparent;
  color: #c9c9c9;
  font-size: 18px;
  cursor: pointer;
}
.settings-btn:hover {
  color: #ffffff;
}

/* chat */
.chat {
  background-color: #14151b;
  color: white;
}
</style>
