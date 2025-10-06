<template>
  <q-page class="dashboard-grid">
    <!-- kanaly -->
    <aside class="channels q-pa-md">
      <button
        v-for="ch in channels"
        :key="ch.id"
        class="channel-btn"
        :class="{ active: ch.id === currentChannelId }"
        @click="selectChannel(ch.id)"
      >
        # {{ ch.name }}
      </button>
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

type Channel = { id: number; name: string; type: 'public' | 'private' }

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

/* chat */
.chat {
  background-color: #14151b;
  color: white;
}
</style>
