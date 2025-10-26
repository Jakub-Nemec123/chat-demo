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
          :class="{'is-new' : isNew(channel)}"
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

        <span
          class="presence-dot q-mr-sm"
          :class="{
            //find out why it isnt showing colors
            'presence--online': auth.state.currentUser?.currentState === UserStates.online,
            'presence--DND':    auth.state.currentUser?.currentState === UserStates.DND,
            'presence--offline':auth.state.currentUser?.currentState === UserStates.offline
          }"
        />
        <p>{{ auth.state.currentUser.currentState }}</p>
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
import { UserStates } from 'src/models';


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

//very simple solution
//We need to find out how we will determine if user visited new channel
//I guess we dont really want to store seen attribute in database
const isNew = (ch: Channel): boolean =>{
  return Number(ch.id) === 1
}


async function handleSettings(){
  await router.push({ name: 'settings.index' })
}

async function handleLogout(){
  auth.logout()
  await router.replace({name: 'sign.in'})
}

import { onMounted, onUnmounted } from 'vue'
import { AppVisibility } from 'quasar'
import { Notify } from 'quasar';

let timer: number | null = null

function tick() {
  if (!AppVisibility.appVisible) {
      Notify.create("Test notif")
  }
}

onMounted(() => {
  timer = window.setInterval(tick, 30_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  timer = null
})

</script>

<style>

.is-new{
   border: 2px solid var(--q-primary);
}

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

.presence-dot{
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .25);
}
.body--dark .presence-dot{
  box-shadow: 0 0 0 2px rgba(255,255,255,.12);
}

.presence-dot.presence-online { background: green;}
.presence-DND { background: var(--q-negative);}
.presence-offline { background: var(--q-grey-6);}

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
