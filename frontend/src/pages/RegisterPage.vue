<template>
  <q-page class="hero-bg flex flex-center">
    <q-card class="q-pa-lg" style="max-width: 430px; width: 100%;">
      <div class="text-center q-mb-md">
        <h1 class="text-h5">Create an account</h1>
        <q-form ref="form" @submit="onRegister">
          <q-input
            class="q-mb-sm"
            filled
            label="Full name"
            name="fullName"
            required
            :rules="[
              (val) => !!val || 'Name is required',
            ]"
            type="text"
            v-model="formData.fullName"
          />
          <q-input
            class="q-mb-sm"
            filled
            label="Username"
            name="username"
            required
            :rules="[
              (val) => !!val || 'Username is required',
            ]"
            type="text"
            v-model="formData.username"
          />
          <q-input
            class="q-mb-sm"
            filled
            label="Email"
            lazy-rules
            name="email"
            required
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => val.indexOf('@') !== -1 || 'Email is not valid',
            ]"
            type="email"
            v-model="formData.email"
          />
          <q-input
            class="q-mb-sm"
            filled
            label="Password"
            name="password"
            required
            :rules="[
              (val) => !!val || 'Password is required',
            ]"
            type="password"
            v-model="formData.password"
          />
          <q-input
            class="q-mb-sm"
            filled
            label="Password (again)"
            lazy-rules
            name="passwordRepeat"
            required
            :rules="[
              (val) => (
                (!!val && val === formData.password)
                || 'Passwords don’t match'
              ),
            ]"
            type="password"
            v-model="formData.passwordRepeat"
          />
          <q-btn
            color="primary"
            class="full-width q-mt-md"
            label="Create account"
            type="submit"
          />
        </q-form>
        <hr />
        <p>
          Already have an account?
          <q-btn
            color="primary"
            flat
            label="Sign in"
            :to="{ name: 'login' }"
          />
        </p>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { QForm } from 'quasar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

type FormData = {
  email: string;
  fullName: string;
  username: string;
  password: string;
  passwordRepeat: string;
};

const form = ref<QForm>();
const formData = ref<FormData>({
  email: '',
  fullName: '',
  username: '',
  password: '',
  passwordRepeat: '',
});

const router = useRouter();
async function onRegister() {
  await router.push({ name: 'dashboard' });
}
</script>
