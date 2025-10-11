<template>
  <q-page class="dashboard-grid">
    <!-- kanaly -->
    <aside class="channels q-pa-md">
    <div class="channel-list">
      <button
        v-for="ch in channels"
        :key="ch.id"
        class="channel-btn"
        :class="{ active: ch.id === currentChannelId }"
        @click="selectChannel(ch.id)"
      >
        # {{ ch.name }}
      </button>
    </div>

    <div class="userbar" v-if="auth.state.currentUser">
        <div class="userbar-left">
          <div class="avatar-skeleton"></div>
          <div class="userbar-info">
            <div class="name">{{ auth.state.currentUser.name }}</div>
            <div class="tag">{{ auth.state.currentUser.username }}</div>
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

  <!-- chat -->
    <aside class="chat">
      <div class="q-pa-md text-h6">
        Aktuálny kanál: {{ currentChannelName }}
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Channel } from 'src/components/models'
import { useRouter } from 'vue-router'
import { useAuth } from 'src/composables/useAuth'


const channels = ref<Channel[]>([
  { id: 1, name: 'general', type: 'public' },
  { id: 2, name: 'lobby', type: 'public' }
])

const currentChannelId = ref<number | null>(channels.value[0]?.id ?? null)

function selectChannel(id: number) {
  currentChannelId.value = id
}

const currentChannelName = computed(
  () => channels.value.find(c => c.id === currentChannelId.value)?.name ?? ''
)

const router = useRouter()
const auth = useAuth()

async function handleSettings(){
  await router.push({name: 'dashboard'})
}

async function handleLogout(){
  auth.logout()
  await router.replace({name: 'signin'})
}
</script>

<style>


.dashboard-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;
}

/*kanaly*/
.channels {
  background-color: #0d0e12;
  border-right: 1px solid #222;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 0;
}

.channel-list{
  flex: 1 1 auto;
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}


.channel-btn {
  width: 100%;
  height: 40px;
  border: none;
  background: transparent;
  color: #b0b0b0;
  font-size: 15px;
  text-align: left;
  padding: 0 14px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s ease;
}

.channel-btn:hover {
  background-color: rgb(33, 31, 33);
  color: #ffffff;
}

.channel-btn.active {
  background-color: rgb(59, 55, 58);
  color: white;
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
 