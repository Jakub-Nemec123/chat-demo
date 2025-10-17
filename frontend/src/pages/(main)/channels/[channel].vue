<template>
  <q-page>
    <div class="q-pa-md text-h6" v-if="'channel' in $route.params">
      Aktuálny kanál: {{ $route.params.channel }}
    </div>
  </q-page>
</template>

<script setup lang="ts"></script>
