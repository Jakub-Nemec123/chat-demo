<template>
    <q-page class="hero-bg flex flex-center">
        <q-card class="q-pa-lg" style="max-width: 430px; width: 100%;">
            <div class="text-h5 text-center q-mb-md">
                <div>Register</div>

                &nbsp;

                <q-input filled v-model="fullname" label="Full name" type="text" class="q-mb-md" @keyup.enter="onRegister">
                </q-input>
                
                <q-input filled v-model="nickname" label="Nickname" type="text" class="q-mb-md" @keyup.enter="onRegister">
                </q-input>

                &nbsp;

                <q-input filled v-model="email" label="Email" type="email" class="q-mb-md" @keyup.enter="onRegister">
                </q-input>

                <q-input filled v-model="password" label="Password" type="password" class="q-mb-md" @keyup.enter="onRegister">
                </q-input>

                <q-input filled v-model="confirmPassword" label="Confirm Password" type="password" class="q-mb-md" @keyup.enter="onRegister">
                </q-input>

                <q-btn label="Register" color="primary" class="full-width q-mt-md" :disable="!email || !password || !confirmPassword || !fullname || !nickname" @click="onRegister">
                </q-btn>

                <div class="text-center q-mt-md">
                    Máte už účet?
                    <div class="sep"></div>
                    <q-btn flat color="primary" label="Prihláste sa" :to="{path: '/'}"></q-btn>
                </div>

            </div>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('')
const password = ref('')
const fullname = ref('')
const nickname = ref('')
const confirmPassword = ref('')

const router = useRouter()

async function onRegister (){
    if (!email.value || !password.value || !confirmPassword.value){console.warn('Chybaju udaje')
        return
    }
    await router.push('/dashboard')

}

</script>

<style>
</style>