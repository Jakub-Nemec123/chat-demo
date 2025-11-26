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
      <!-- Admins -->
      <template v-if="admins.length > 0">
        <q-item-label class="q-px-none q-py-sm text-bold text-uppercase text-amber" header>
          Admins ({{ admins.length }})
        </q-item-label>
        <q-item
          v-for="user in admins"
          :key="user.id"
          class="q-px-none"
        >
          <q-item-section side>
            <q-icon name="star" color="amber" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>@{{ user.username }}</q-item-label>
            <q-item-label caption v-if="user.first_name || user.last_name">
              {{ user.first_name }} {{ user.last_name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- Regular members -->
      <template v-if="regularMembers.length > 0">
        <q-item-label class="q-px-none q-py-sm text-bold text-uppercase" header>
          Members ({{ regularMembers.length }})
        </q-item-label>
        <q-item
          v-for="user in regularMembers"
          :key="user.id"
          class="q-px-none"
        >
          <q-item-section side>
            <q-icon name="person" color="grey-6" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>@{{ user.username }}</q-item-label>
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
import { useRoute } from 'vue-router'
import { useChannelsStore, type ChannelMember } from 'src/stores/channels'

const route = useRoute()
const channelsStore = useChannelsStore()
const isLoading = ref(false)

// Get members from store
const members = computed(() => channelsStore.members)

// Split into admins and regular members
const admins = computed(() => members.value.filter(m => m.is_admin))
const regularMembers = computed(() => members.value.filter(m => !m.is_admin))

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
