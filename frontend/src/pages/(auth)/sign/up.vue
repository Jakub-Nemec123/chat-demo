<template>
  <q-page>
    <q-card
      class="full-width q-pa-lg text-center"
      :style="{ maxWidth: '30rem' }"
    >
      <h1 class="text-h5 q-mb-lg">Create an account</h1>
      <q-form ref="form" @submit.prevent="onSubmit">
        <div class="q-gutter-sm row">
          <q-input
            class="col q-mb-sm"
            filled
            label="First name"
            name="name[first]"
            required
            :rules="[
              (val) => !!val || 'Name is required',
            ]"
            type="text"
            v-model="formData.name.first"
          />
          <q-input
            class="col q-mb-sm"
            filled
            label="Last name"
            name="name[last]"
            :style="{ paddingBottom: '20px' }"
            type="text"
            v-model="formData.name.last"
          />
        </div>
        <q-input
          class="q-mb-sm"
          filled
          label="Username"
          name="username"
          prefix="@"
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
          class="full-width"
          label="Create account"
          type="submit"
        />
      </q-form>
      <p class="q-mt-md">
        Already have an account?
        <q-btn
          color="primary"
          flat
          label="Sign in"
          :to="{ name: 'sign.in' }"
        />
      </p>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QForm } from 'quasar';
import { useRouter } from 'vue-router';
import type { Router } from 'vue-router';
import type { NewUserData } from 'src/models/auth';
import { useAuth } from 'src/composables/useAuth';

const form = ref<QForm>();
const formData = ref<NewUserData>({
  email: '',
  name: {
    first: '',
    last: '',
  },
  username: '',
  password: '',
  passwordRepeat: '',
});

const auth = useAuth();
const router: Router = useRouter();

async function onSubmit() {
  await auth.createNewUser(formData.value);
  await router.push({ name: 'channels.index' });
}
</script>
