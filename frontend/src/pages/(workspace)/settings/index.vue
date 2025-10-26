<template>
  <q-page class="settings-page q-pa-md">

    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Settings</div>
      <q-btn
        outline
        icon="space_dashboard"
        label="Go back"
        :to="{ name: 'channels.index' }"
      />
    </div>

    <!-- Profile -->
    <q-card flat bordered class="card-surface">

      <q-card-section>
        <div class="text-subtitle1">Profile</div>
        <div class="text-caption text-grey-7">Edit your information</div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <q-form @submit.prevent="onSaveProfile" ref="profileForm" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.name"
                label="Name"
                :rules="[req]"
                autocomplete="name"
                dense
                filled
                rounded
                clearable
                class="pretty-input"
                stack-label
              >
                <template #prepend><q-icon name="person" /></template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.username"
                label="username"
                :rules="[req, min3]"
                autocomplete="username"
                dense
                filled
                rounded
                clearable
                class="pretty-input"
                stack-label
              >
                <template #prepend><q-icon name="alternate_email" /></template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.email"
                label="Email"
                :rules="[req, emailRule]"
                autocomplete="email"
                dense
                filled
                rounded
                clearable
                class="pretty-input"
                stack-label
              >
                <template #prepend><q-icon name="mail" /></template>
              </q-input>
            </div>
          </div>

          <div class="row items-center q-gutter-sm q-mt-sm">
            <q-btn
              label="Save"
              type="submit"
              color="primary"
              :disable="!isDirty || savingProfile"
              :loading="savingProfile"
              icon="save"
            />

            <q-btn
              flat
              label="Reset"
              @click="resetProfile"
              :disable="!isDirty || savingProfile"
              icon="restart_alt"
            />

            <q-space/>
            <q-badge v-if="!isDirty" outline color="grey" label="No chnages"/>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!--Password-->
    <q-card>
      <q-card-section>
        <div class="text-subtitle1">Change password</div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <q-form @submit.prevent="onChangePassword" ref="passwordForm" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="pwd.current"
                type="password"
                label="Current password"
                :rules="[req]"
                autocomplete="current-password"
                dense
                filled
                rounded
                class="pretty-input"
                stack-label
              >
                <template #prepend><q-icon name="lock" /></template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="pwd.next"
                type="password"
                label="New password"
                :rules="[req, min6]"
                autocomplete="new-password"
                dense
                filled
                rounded
                class="pretty-input"
                stack-label
              >
                <template #prepend><q-icon name="vpn_key" /></template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="pwd.confirm"
                type="password"
                label="Confirm new password"
                :rules="[() => pwd.confirm === pwd.next || 'Passwords dont match']"
                autocomplete="new-password"
                dense
                filled
                rounded
                class="pretty-input"
                stack-label
              >
                <template #prepend><q-icon name="verified_user" /></template>
              </q-input>
            </div>
          </div>

          <div class="q-mt-sm">
            <q-btn
              label="Change Password"
              type="submit"
              color="primary"
              :loading="savingPassword"
              :disable="savingPassword || !pwd.current || !pwd.next || pwd.next !== pwd.confirm"
              icon="key"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

   <div class="prefs-grid q-mt-md">
      <!-- Presence -->
      <q-card flat bordered class="card-surface">
        <q-card-section>
          <div class="text-subtitle1">Presence</div>
          <div class="text-caption text-grey-7">Set your availability</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-btn-group rounded class="w-full">
            <q-btn
              label="Online"
              :color="presenceModel === UserStates.online ? 'positive' : 'grey-8'"
              :flat="presenceModel !== UserStates.online"
              dense unelevated
              @click="presenceModel = UserStates.online"
              icon="circle"
            />
            <q-btn
              label="DND"
              :color="presenceModel === UserStates.DND ? 'negative' : 'grey-8'"
              :flat="presenceModel !== UserStates.DND"
              dense unelevated
              @click="presenceModel = UserStates.DND"
              icon="block"
            />
            <q-btn
              label="Offline"
              :color="presenceModel === UserStates.offline ? 'grey-6' : 'grey-8'"
              :flat="presenceModel !== UserStates.offline"
              dense unelevated
              @click="presenceModel = UserStates.offline"
              icon="radio_button_unchecked"
            />
          </q-btn-group>
        </q-card-section>
      </q-card>

      <!-- Notifications -->
      <q-card flat bordered class="card-surface">
        <q-card-section>
          <div class="text-subtitle1">Notifications</div>
          <div class="text-caption text-grey-7">Message alerts</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-sm">
          <q-btn-toggle
            v-model="notifModel"
            :options="notifOptions"
            toggle-color="primary"
            dense rounded unelevated
          />
          <div class="text-caption text-grey-6">Current: {{ notifLabel }}</div>
        </q-card-section>
      </q-card>
    </div>

  </q-page>
</template>

<script setup lang="ts">

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar, QForm } from 'quasar'
import { useAuth } from 'src/composables/useAuth'
import { UserStates } from 'src/models'

const $q = useQuasar()
const auth = useAuth()

/*
const tab = ref<'profile' | 'security'>('profile')
*/

// rules
const req = (v: string | null | undefined) => (v && String(v).trim().length > 0) || 'Required'
const min3 = (v: string) => (v?.trim().length >= 3) || 'Minimum of 3 characters'
const min6 = (v: string) => (v?.length >= 6) || 'Minimum of 6 characters'
const emailRule = (v: string) => (/^\S+@\S+\.\S+$/.test(v) || 'Invalid email')

// form
const form = reactive({
  name: '',
  email: '',
  username: ''
})

const original = ref({ ...form })
const savingProfile = ref(false)
const savingPassword = ref(false)

const profileForm = ref<QForm | null>(null)
const passwordForm = ref<QForm | null>(null)

const isDirty = computed(() => {
  return form.name !== original.value.name
    || form.email !== original.value.email
    || form.username !== original.value.username
})

/*
const initials = computed(() => {
  const parts = form.name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  return parts.slice(0, 2).map(p => p[0]!.toUpperCase()).join('')
}) */

function loadFromUser() {
  const u = auth.state.currentUser
  if (!u) return

  form.name = u.name ?? ''
  form.email = u.email ?? ''
  form.username = u.username ?? ''
  original.value = { ...form }
}

onMounted(() => {
  if (!auth.state.currentUser) auth.bootstrapFromStorage()
  loadFromUser()
})

const presenceModel = computed<UserStates>({
  get: () => auth.state.currentUser?.currentState ?? UserStates.offline,
  set: (v) =>{
    auth.setPresence(v)
  }
})


async function onSaveProfile() {
  if (!profileForm.value) return
  const ok = await profileForm.value.validate()
  if (!ok) return

  try {
    savingProfile.value = true
    auth.updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim()
    })
    original.value = { ...form }
    $q.notify({ type: 'positive', message: 'Profile saved' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Profile not saved'
    $q.notify({ type: 'negative', message })
  } finally {
    savingProfile.value = false
  }
}

const pwd = reactive({
  current: '',
  next: '',
  confirm: ''
})

function resetProfile() {
    Object.assign(form, original.value)
}

watch(() => auth.state.currentUser, loadFromUser)

async function onChangePassword() {
  if (!passwordForm.value) return
  const ok = await passwordForm.value.validate()
  if (!ok) return

  try {
    savingPassword.value = true

    await auth.changePassword(pwd.current, pwd.next)
    pwd.current = ''
    pwd.next = ''
    pwd.confirm = ''
    $q.notify({ type: 'positive', message: 'Password changed' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed password change'
    $q.notify({ type: 'negative', message })
  } finally {
    savingPassword.value = false
  }
}

type NotifLevel = 'none' | 'mentions' | 'all'
const notifModel = ref<NotifLevel>('mentions')
const notifOptions = [
  { label: 'None',     value: 'none',     icon: 'notifications_off' },
  { label: 'Mentions', value: 'mentions', icon: 'alternate_email'   },
  { label: 'All',      value: 'all',      icon: 'notifications_active' }
] as const
const notifLabel = computed(() => ({
  none: 'No notifications',
  mentions: 'Only mentions',
  all: 'All messages'
}[notifModel.value]))

</script>

<style scoped>

.settings-page { max-width: 960px; margin: 0 auto; }


.header-bar { padding: 6px 0; }


.card-surface{
  border-radius: 14px;
}


.prefs-grid{
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 900px){
  .prefs-grid{ grid-template-columns: 1fr 1fr; }
}


.pretty-input .q-field_control{
  border-radius: 12px !important;
  transition: box-shadow .18s ease, background-color .18s ease;
}
.pretty-input.q-field--filled .q-field__control:before{
  background: rgba(0, 0, 0, 0.03);
}
.body--dark .pretty-input.q-field--filled .q-field__control:before{
  background: rgba(255, 255, 255, 0.06);
}
.pretty-input.q-field--focused .q-field__control{
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.20) inset;
}
.pretty-input .q-field__native,
.pretty-input .q-field__label{
  font-size: 0.95rem;
}

.w-full { width: 100%; }

</style>
