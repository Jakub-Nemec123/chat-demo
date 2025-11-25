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
          name: 'channels.show',
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


     <!-- ADD CHANNEL (+) -->
    <q-separator />
    <div class="q-pa-sm">
      <q-btn
        outline
        icon="add"
        label="Add channel"
        class="full-width"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- ACTIONS FOR ACTIVE CHANNEL (leave / delete) -->
    <div v-if="activeChannel" class="q-pa-sm q-gutter-sm">
      <q-separator class="q-mb-sm" />
      <q-btn
        v-if="isOwner"
        outline
        color="negative"
        icon="delete"
        label="Delete channel"
        class="full-width"
      />

      <q-btn
        v-else
        outline
        color="negative"
        icon="logout"
        label="Leave channel"
        class="full-width"
      />
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


    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 360px">
        <q-card-section class="text-h6">Create channel</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="createForm.name" label="Channel name" dense filled />
          <q-select
            v-model="createForm.type"
            :options="privacyOptions"
            label="Visibility"
            dense
            filled
            emit-value
            map-options
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="resetCreateForm" />
          <q-btn unelevated color="primary" label="Create" @click="submitCreate" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </aside>
</template>

<script setup lang="ts">
import type { Channel } from 'src/models';
import { ChannelPrivacy } from 'src/models';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from 'src/composables/useAuth';
import { UserStates } from 'src/models';
import { computed, ref, onMounted } from 'vue';
import { channelsService, type ChannelResponse } from 'src/services/channels';

// Hardcoded user ID for testing
const CURRENT_USER_ID = 1;

const channels = ref<Channel[]>([])

function transformChannel(ch: ChannelResponse): Channel {
  return {
    id: ch.id,
    name: ch.slug,
    type: ch.privacy === 'PUBLIC' ? ChannelPrivacy.public : ChannelPrivacy.private
  }
}

// Load channels from API
async function loadChannels() {
  try {
    const response = await channelsService.getChannels()
    channels.value = response.map(transformChannel)
  } catch (error) {
    console.error('Failed to load channels:', error)
  }
}

onMounted(async () => {
  await loadChannels()
})

const router = useRouter();
const route = useRoute();
const auth = useAuth();

//very simple solution
//We need to find out how we will determine if user visited new channel
//I guess we dont really want to store seen attribute in database
const isNew = (ch: Channel): boolean =>{
  return Number(ch.id) === 1
}

// TODO: refactor to take advantage of vue-router features
const activeChannel = computed(() =>
  route.name === 'channels.show'
    ? channels.value.find(c => c.name === String((route.params as any).channel)) ?? null
    : null
)

const isOwner = computed(() =>
  !!activeChannel.value && activeChannel.value.id === 2
)

async function handleSettings(){
  await router.push({ name: 'settings.index' });
}

async function handleLogout(){
  auth.logout();
  await router.replace({ name: 'sign.in' });
}

import { onUnmounted } from 'vue'
import { AppVisibility } from 'quasar'
import { Notify } from 'quasar';

let timer: number | null = null

function tick() {
  if (!AppVisibility.appVisible) {
      Notify.create("Test notif")
  }
}

onMounted(() => {
  timer = window.setInterval(tick, 3_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  timer = null
})


import { reactive } from 'vue';
const showCreateDialog = ref(false)
const createForm = reactive<{ name: string; type: ChannelPrivacy }>({
  name: '',
  type: ChannelPrivacy.public
})
const privacyOptions = [
  { label: 'Public',  value: ChannelPrivacy.public },
  { label: 'Private', value: ChannelPrivacy.private }
]

function resetCreateForm () {
  createForm.name = ''
  createForm.type = ChannelPrivacy.public
}
function submitCreate () {
  showCreateDialog.value = false
  resetCreateForm()
}


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
