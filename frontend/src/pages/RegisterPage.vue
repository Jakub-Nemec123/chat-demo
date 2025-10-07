<template>
    <q-page class="hero-bg flex flex-center">
        <q-card class="q-pa-lg" style="max-width: 430px; width: 100%;">
            <div class="text-h5 text-center q-mb-md">
                <div>Register</div>

                &nbsp;
                <form @submit.prevent="onRegister">
                <q-input 
                filled v-model="RegForm.fullname" 
                label="Full name" 
                type="text" 
                class="q-mb-md">
                </q-input>
                
                <q-input 
                filled v-model="RegForm.nickname" 
                label="Nickname" 
                type="text" 
                class="q-mb-md">
                </q-input>

                &nbsp;

                <q-input 
                filled v-model="RegForm.email" 
                label="Email" 
                type="email" 
                class="q-mb-md">
                </q-input>

                <q-input 
                filled v-model="RegForm.password" 
                label="Password" 
                type="password" 
                class="q-mb-md">
                </q-input>

                <q-input 
                filled v-model="RegForm.confpassword" 
                label="Confirm Password" 
                type="password" 
                class="q-mb-md">
                </q-input>

                <q-btn 
                label="Register" 
                color="primary" 
                class="full-width q-mt-md" 
                :disable="!isFormValid" 
                type="submit">
                </q-btn>

                <div class="text-center q-mt-md">
                    Máte už účet?
                    <div class="sep"></div>
                    <q-btn 
                    flat color="primary" 
                    label="Prihláste sa" 
                    :to="{path: '/'}"/>
                </div>

                </form>
            </div>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const RegForm = ref({
    fullname: '',
    nickname: '',
    email: '',
    password: '',
    confpassword: '',
})

const isFormValid = computed(() =>{
    const values = Object.values(RegForm.value)
    const allFilled = values.every(v => v.trim() !== '')
    const passwordsMatch = RegForm.value.password === RegForm.value.confpassword
    return allFilled && passwordsMatch
})

const router = useRouter()

async function onRegister (){
    await router.push('/dashboard')
}

</script>

<style>
</style>