<template>
  <q-page>
    <q-card
      class="full-width q-pa-lg text-center"
      :style="{ maxWidth: '30rem' }"
    >
      <h1 class="text-h5 q-mb-lg">Sign in</h1>
      <q-form @submit.prevent="onSubmit">
        <q-input
          class="q-my-md"
          filled
          label="Email"
          required
          type="email"
          v-model="formData.email"
        />
        <q-input
          class="q-my-md"
          filled
          label="Password"
          required
          type="password"
          v-model="formData.password"
        />
        <q-btn
          color="primary"
          class="full-width"
          label="Sign in"
          type="submit"
        />
      </q-form>
      <p class="q-mt-md">
        Don’t have an account yet?
        <q-btn
          color="primary"
          flat
          label="Sign up"
          :to="{ name: 'sign.up' }"
        />
      </p>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useAuth } from 'src/composables/useAuth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const formData = ref<{
  email: string;
  password: string;
}>({
  email: '',
  password: '',
});

const loading = ref(false)
const error = ref('')

const router = useRouter()
// const route = useRoute()
const auth = useAuth()

async function onSubmit() {
  loading.value = true
  error.value = ''
   try {
    await auth.loginWithCredentials(formData.value.email, formData.value.password)
    await router.replace({ name: 'channels.index' })
  } finally {
    loading.value = false
  }
}
</script>
