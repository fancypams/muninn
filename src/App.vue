<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { registerPushNotifications } from '@/lib/pushNotifications'

const auth = useAuthStore()
auth.init().then(() => {
  if (auth.isAuthenticated) registerPushNotifications()
})

auth.$subscribe(() => {
  if (auth.isAuthenticated) registerPushNotifications()
})
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
  background: #fff;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}
</style>
