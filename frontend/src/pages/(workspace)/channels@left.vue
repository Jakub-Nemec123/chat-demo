<template>
  <aside class="bg-black column full-height">
    <!-- Channel list -->
    <div class="col-grow column q-px-md q-py-lg q-gutter-sm scroll-vertical">
      <div v-if="channelsStore.isLoading" class="text-center q-pa-md">
        <q-spinner color="primary" size="2em" />
      </div>

      <router-link
        v-else
        custom
        :key="channel.id"
        v-for="channel in channelsStore.sortedChannels"
        v-slot="{ href, isActive }"
        :to="{
          name: 'channels.show',
          params: { channel: channel.name },
        }"
      >
        <q-btn
          align="left"
          :color="isActive ? 'primary' : channelsStore.isChannelHighlighted(channel.id) ? 'amber' : 'none'"
          :class="{
            'is-private': channel.privacy === 'PRIVATE',
            'is-admin': channel.isAdmin,
            'is-highlighted': channelsStore.isChannelHighlighted(channel.id)
          }"
          no-caps
          :to="href"
          unelevated
          @click="onChannelClick(channel.id)"
        >
          <q-icon
            :name="channel.privacy === 'PRIVATE' ? 'lock' : 'tag'"
            size="xs"
            class="q-mr-sm"
          />
          {{ channel.name }}
          <q-icon
            v-if="channel.alerts === 'MENTIONS'"
            name="alternate_email"
            size="xs"
            class="q-ml-sm text-grey-5"
          />
          <q-icon
            v-else-if="channel.alerts === 'NONE'"
            name="notifications_off"
            size="xs"
            class="q-ml-sm text-grey-5"
          />
          <q-badge v-if="channel.isAdmin" color="amber" label="admin" class="q-ml-sm" />
          <q-badge v-if="channelsStore.isChannelHighlighted(channel.id)" color="info" label="NEW" class="q-ml-sm" />
          <q-tooltip v-if="channel.invitedBy">
            Invited by @{{ channel.invitedBy }}
          </q-tooltip>

          <!-- Context menu -->
          <q-menu context-menu>
            <q-list dense style="min-width: 180px">
              <q-item-label header>Notifications</q-item-label>
              <q-item
                clickable
                v-close-popup
                @click="setChannelAlerts(channel.id, 'ALL')"
                :active="channel.alerts === 'ALL'"
              >
                <q-item-section side>
                  <q-icon name="notifications_active" size="xs" />
                </q-item-section>
                <q-item-section>All messages</q-item-section>
                <q-item-section side v-if="channel.alerts === 'ALL'">
                  <q-icon name="check" color="positive" size="xs" />
                </q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="setChannelAlerts(channel.id, 'MENTIONS')"
                :active="channel.alerts === 'MENTIONS'"
              >
                <q-item-section side>
                  <q-icon name="alternate_email" size="xs" />
                </q-item-section>
                <q-item-section>Only @mentions</q-item-section>
                <q-item-section side v-if="channel.alerts === 'MENTIONS'">
                  <q-icon name="check" color="positive" size="xs" />
                </q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="setChannelAlerts(channel.id, 'NONE')"
                :active="channel.alerts === 'NONE'"
              >
                <q-item-section side>
                  <q-icon name="notifications_off" size="xs" />
                </q-item-section>
                <q-item-section>Muted</q-item-section>
                <q-item-section side v-if="channel.alerts === 'NONE'">
                  <q-icon name="check" color="positive" size="xs" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </router-link>

      <div v-if="!channelsStore.isLoading && channelsStore.channels.length === 0" class="text-grey-6 text-center q-pa-md">
        No channels yet. Create one!
      </div>
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
    <div v-if="channelsStore.activeChannel" class="q-pa-sm q-gutter-sm">
      <q-separator class="q-mb-sm" />
      <q-btn
        v-if="channelsStore.isActiveChannelAdmin"
        outline
        color="negative"
        icon="delete"
        label="Delete channel"
        class="full-width"
        :loading="isDeleting"
        @click="confirmDeleteChannel"
      />
      <q-btn
        v-else
        outline
        color="warning"
        icon="logout"
        label="Leave channel"
        class="full-width"
        :loading="isLeaving"
        @click="confirmLeaveChannel"
      />
    </div>

    <!-- User bar -->
    <div class="userbar" v-if="auth.state.currentUser">
      <div class="userbar-left">
        <div class="userbar-info">
          <div class="name">{{ auth.state.currentUser.username }}</div>
          <div class="tag">{{ auth.state.currentUser.name }}</div>
        </div>

        <!-- Status indicator with menu -->
        <q-btn flat dense round size="sm" class="q-ml-sm">
          <span
            class="presence-dot"
            :class="{
              'presence--online': userStore.isOnline,
              'presence--DND': userStore.isDND,
              'presence--offline': userStore.isOffline
            }"
          />
          <q-menu>
            <q-list dense style="min-width: 150px">
              <q-item-label header>Set Status</q-item-label>
              <q-item
                clickable
                v-close-popup
                @click="setStatus('ONLINE')"
                :active="userStore.isOnline"
              >
                <q-item-section side>
                  <span class="presence-dot presence--online" />
                </q-item-section>
                <q-item-section>Online</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="setStatus('DO_NOT_DISTURB')"
                :active="userStore.isDND"
              >
                <q-item-section side>
                  <span class="presence-dot presence--DND" />
                </q-item-section>
                <q-item-section>Do Not Disturb</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="setStatus('OFFLINE')"
                :active="userStore.isOffline"
              >
                <q-item-section side>
                  <span class="presence-dot presence--offline" />
                </q-item-section>
                <q-item-section>Offline</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <q-tooltip>{{ userStore.statusLabel }}</q-tooltip>
        </q-btn>
      </div>
      <div class="q-gutter-x-sm">
        <q-btn dense flat icon="settings" @click="handleSettings" aria-label="Nastavenia" />
        <q-btn dense flat icon="logout" @click="handleLogout" aria-label="Logout" />
      </div>
    </div>

    <!-- CREATE CHANNEL DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 360px">
        <q-card-section class="text-h6">Create channel</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="createForm.name"
            label="Channel name"
            dense
            filled
            hint="Use lowercase letters, numbers and hyphens only"
            :rules="[
              val => !!val || 'Channel name is required',
              val => /^[a-z0-9-]+$/.test(val) || 'Only lowercase letters, numbers and hyphens allowed'
            ]"
          />
          <q-select
            v-model="createForm.privacy"
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
          <q-btn
            unelevated
            color="primary"
            label="Create"
            :loading="isCreating"
            :disable="!isCreateFormValid"
            @click="submitCreate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- CONFIRM DELETE DIALOG -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">Delete channel?</q-card-section>
        <q-card-section>
          Are you sure you want to delete <strong>#{{ channelsStore.activeChannel?.name }}</strong>?
          This will remove all messages and cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="negative" label="Delete" :loading="isDeleting" @click="deleteChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- CONFIRM LEAVE DIALOG -->
    <q-dialog v-model="showLeaveDialog">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">Leave channel?</q-card-section>
        <q-card-section>
          Are you sure you want to leave <strong>#{{ channelsStore.activeChannel?.name }}</strong>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="warning" label="Leave" :loading="isLeaving" @click="leaveChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </aside>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from 'src/composables/useAuth'
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { useChannelsStore } from 'src/stores/channels'
import { useUserStore, type UserStatus } from 'src/stores/user'
import { Notify } from 'quasar'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const channelsStore = useChannelsStore()
const userStore = useUserStore()

// Load channels and status on mount
onMounted(async () => {
  try {
    await Promise.all([
      channelsStore.fetchChannels(),
      userStore.fetchStatus()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

// Watch route to set active channel
watch(
  () => route.params.channel,
  (channelName) => {
    if (channelName && typeof channelName === 'string') {
      const channel = channelsStore.findChannelByName(channelName)
      if (channel) {
        channelsStore.setActiveChannel(channel.id)
        // Clear highlight when channel is opened
        channelsStore.clearHighlight(channel.id)
      }
    } else {
      channelsStore.setActiveChannel(null)
    }
  },
  { immediate: true }
)

// Clear highlight when clicking on channel
function onChannelClick(channelId: number) {
  channelsStore.clearHighlight(channelId)
}

// ============ CHANNEL ALERTS ============
async function setChannelAlerts(channelId: number, alerts: 'ALL' | 'MENTIONS' | 'NONE') {
  try {
    await channelsStore.updateChannelAlerts(channelId, alerts)
    const alertLabels = {
      'ALL': 'All messages',
      'MENTIONS': 'Only @mentions',
      'NONE': 'Muted'
    }
    Notify.create({
      type: 'positive',
      message: `Notifications: ${alertLabels[alerts]}`
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to update notification settings'
    })
  }
}

// Navigation
async function handleSettings() {
  await router.push({ name: 'settings.index' })
}

async function handleLogout() {
  auth.logout()
  await router.replace({ name: 'sign.in' })
}

// ============ USER STATUS ============
async function setStatus(status: UserStatus) {
  try {
    await userStore.updateStatus(status)
    Notify.create({
      type: 'positive',
      message: `Status changed to ${userStore.statusLabel}`
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to update status'
    })
  }
}

// ============ CREATE CHANNEL ============
const showCreateDialog = ref(false)
const isCreating = ref(false)
const createForm = reactive<{ name: string; privacy: 'PUBLIC' | 'PRIVATE' }>({
  name: '',
  privacy: 'PUBLIC'
})
const privacyOptions = [
  { label: 'Public', value: 'PUBLIC' },
  { label: 'Private', value: 'PRIVATE' }
]

const isCreateFormValid = computed(() => {
  return createForm.name.length > 0 && /^[a-z0-9-]+$/.test(createForm.name)
})

function resetCreateForm() {
  createForm.name = ''
  createForm.privacy = 'PUBLIC'
}

async function submitCreate() {
  if (!isCreateFormValid.value) return

  isCreating.value = true
  try {
    const result = await channelsStore.joinOrCreateChannel(createForm.name, createForm.privacy)
    showCreateDialog.value = false
    resetCreateForm()

    Notify.create({
      type: 'positive',
      message: result.created ? `Channel #${result.name} created` : `Joined #${result.name}`
    })

    // Navigate to new channel
    await router.push({
      name: 'channels.show',
      params: { channel: result.name }
    })
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to create channel'
    })
  } finally {
    isCreating.value = false
  }
}

// ============ DELETE CHANNEL ============
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

function confirmDeleteChannel() {
  showDeleteDialog.value = true
}

async function deleteChannel() {
  if (!channelsStore.activeChannel) return

  isDeleting.value = true
  try {
    const channelName = channelsStore.activeChannel.name
    await channelsStore.deleteChannel(channelsStore.activeChannel.id)
    showDeleteDialog.value = false

    Notify.create({
      type: 'positive',
      message: `Channel #${channelName} deleted`
    })

    // Navigate to first available channel or index
    if (channelsStore.channels.length > 0) {
      await router.push({
        name: 'channels.show',
        params: { channel: channelsStore.channels[0].name }
      })
    } else {
      await router.push({ name: 'channels.index' })
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to delete channel'
    })
  } finally {
    isDeleting.value = false
  }
}

// ============ LEAVE CHANNEL ============
const showLeaveDialog = ref(false)
const isLeaving = ref(false)

function confirmLeaveChannel() {
  showLeaveDialog.value = true
}

async function leaveChannel() {
  if (!channelsStore.activeChannel) return

  isLeaving.value = true
  try {
    const channelName = channelsStore.activeChannel.name
    await channelsStore.leaveChannel(channelsStore.activeChannel.id)
    showLeaveDialog.value = false

    Notify.create({
      type: 'positive',
      message: `Left channel #${channelName}`
    })

    // Navigate to first available channel or index
    if (channelsStore.channels.length > 0) {
      await router.push({
        name: 'channels.show',
        params: { channel: channelsStore.channels[0].name }
      })
    } else {
      await router.push({ name: 'channels.index' })
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to leave channel'
    })
  } finally {
    isLeaving.value = false
  }
}
</script>

<style>
.is-private {
  opacity: 0.9;
}

.is-highlighted {
  animation: pulse-highlight 2s ease-in-out infinite;
}

@keyframes pulse-highlight {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 193, 7, 0);
  }
}

.userbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #222;
  background: #0a0b0f;
}

.userbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
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

.presence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
}

.body--dark .presence-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12);
}

.presence--online {
  background: #43a047;
}
.presence--DND {
  background: var(--q-negative);
}
.presence--offline {
  background: #757575;
}
</style>
