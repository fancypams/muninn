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
:root {
  --bg: #F5F0E8;
  --surface: #FFFFFF;
  --dark: #1A1A1A;
  --gold: #C9940A;
  --green: #2A9B48;
  --text: #1A1A1A;
  --text-muted: #888888;
  --border: #DDD6CA;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 100px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
</style>
