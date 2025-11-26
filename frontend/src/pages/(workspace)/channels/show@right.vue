<template>
  <aside class="bg-black full-height q-pa-md">
    <div class="text-h6 q-mb-md">
      Channel Members
      <q-badge color="primary" :label="members.length" class="q-ml-sm" />
    </div>

    <div v-if="isLoading" class="text-center q-pa-md">
      <q-spinner color="primary" size="2em" />
    </div>

    <q-list v-else dense>
      <!-- Online members -->
      <template v-if="onlineMembers.length > 0">
        <q-item-label class="q-px-none q-py-sm text-bold text-uppercase text-positive" header>
          Online ({{ onlineMembers.length }})
        </q-item-label>
        <q-item
          v-for="user in onlineMembers"
          :key="user.id"
          class="q-px-none"
        >
          <q-item-section side>
            <span class="presence-dot presence--online" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              @{{ user.username }}
              <q-icon v-if="user.is_admin" name="star" color="amber" size="xs" class="q-ml-xs" />
            </q-item-label>
            <q-item-label caption v-if="user.first_name || user.last_name">
              {{ user.first_name }} {{ user.last_name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- DND members -->
      <template v-if="dndMembers.length > 0">
        <q-item-label class="q-px-none q-py-sm text-bold text-uppercase text-negative" header>
          Do Not Disturb ({{ dndMembers.length }})
        </q-item-label>
        <q-item
          v-for="user in dndMembers"
          :key="user.id"
          class="q-px-none"
        >
          <q-item-section side>
            <span class="presence-dot presence--DND" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              @{{ user.username }}
              <q-icon v-if="user.is_admin" name="star" color="amber" size="xs" class="q-ml-xs" />
            </q-item-label>
            <q-item-label caption v-if="user.first_name || user.last_name">
              {{ user.first_name }} {{ user.last_name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- Offline members -->
      <template v-if="offlineMembers.length > 0">
        <q-item-label class="q-px-none q-py-sm text-bold text-uppercase text-grey-6" header>
          Offline ({{ offlineMembers.length }})
        </q-item-label>
        <q-item
          v-for="user in offlineMembers"
          :key="user.id"
          class="q-px-none"
        >
          <q-item-section side>
            <span class="presence-dot presence--offline" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-grey-6">
              @{{ user.username }}
              <q-icon v-if="user.is_admin" name="star" color="amber" size="xs" class="q-ml-xs" />
            </q-item-label>
            <q-item-label caption v-if="user.first_name || user.last_name">
              {{ user.first_name }} {{ user.last_name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- No members -->
      <div v-if="members.length === 0" class="text-grey-6 text-center q-pa-md">
        No members found
      </div>
    </q-list>
  </aside>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useChannelsStore } from 'src/stores/channels'

const channelsStore = useChannelsStore()
const isLoading = ref(false)

// Get members from store
const members = computed(() => channelsStore.members)

// Split by status
const onlineMembers = computed(() =>
  members.value.filter(m => m.status === 'ONLINE')
)
const dndMembers = computed(() =>
  members.value.filter(m => m.status === 'DO_NOT_DISTURB')
)
const offlineMembers = computed(() =>
  members.value.filter(m => m.status === 'OFFLINE')
)

// Load members when channel changes
watch(
  () => channelsStore.activeChannelId,
  async (channelId) => {
    if (channelId) {
      isLoading.value = true
      try {
        await channelsStore.fetchMembers(channelId)
      } catch (error) {
        console.error('Failed to fetch members:', error)
      } finally {
        isLoading.value = false
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.presence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.presence--online {
  background: #43a047;
}
.presence--DND {
  background: #e53935;
}
.presence--offline {
  background: #757575;
}
</style>
