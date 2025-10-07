<template>
  <q-page class="hero-bg flex flex-center">
    <q-card class="q-pa-lg" style="max-width: 430px; width: 100%;">
        <div class="text-h5 text-center">Login</div>

        &nbsp;

        <form @submit.prevent="onLogin"></form>
        <q-input 
        filled v-model="email" 
        label="Email" 
        type="email" 
        @keyup.enter="onLogin"
        />

        <q-input 
        filled v-model="password" 
        label="Password" 
        type="password" 
        class="q-mt-md" 
        />

        <q-btn 
        label="Login" 
        color="primary" 
        class="full-width q-mt-md" 
        :disable="!email || !password"
        type="submit"
        />

        <div class="text-center q-mt-md">
              Nemáte ešte účet?
              <div class="sep"></div>
              <q-btn 
              flat color="primary" 
              label="Zaregistrujte sa" 
              :to="{path: 'register'}"/>
        </div>

    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';


const email = ref('')
const password = ref('')

const router = useRouter()

async function onLogin(){
  if (email.value === 'test@test.sk' && password.value === 'test'){
    await router.push('/dashboard')
  }
}
</script>

<style>
.hero-bg {
background: #5908c9;
background: linear-gradient(05deg, rgb(12, 4, 31) 0%, rgb(89, 32, 122) 60%, rgb(120, 0, 194) 100%);}


</style>d