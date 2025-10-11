<template>
  <q-page class="hero-bg flex flex-center">
    <q-card class="q-pa-lg" style="max-width: 430px; width: 100%;">
        <div class="text-h5 text-center">Login</div>

        &nbsp;

        <form @submit.prevent="onLogin">
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
        @keyup.enter="onLogin"
        />

        <q-btn 
        label="Login" 
        color="primary" 
        class="full-width q-mt-md" 
        :disable="!email || !password"
        type="submit"
        @click="onLogin"
        />
        </form>
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
import { useAuth } from 'src/composables/useAuth';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';


const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()
const route = useRoute()
const auth = useAuth()

async function onLogin(){
  loading.value = true
  error.value = ''
   try {
    auth.loginWithCredentials(email.value, password.value)
    const redirect = (route.query.redirect as string) || { name: 'dashboard' }
    await router.replace(redirect)
  } catch  {
    error.value = 'Prihlásenie zlyhalo'
  } finally {
    loading.value = false
  }
}
</script>

<style>
.hero-bg {
background: #5908c9;
background: linear-gradient(05deg, rgb(12, 4, 31) 0%, rgb(89, 32, 122) 60%, rgb(120, 0, 194) 100%);}


</style>d