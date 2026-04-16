<template>
  <div class="home-container">
    <header>
      <h1>Home</h1>
      <button @click="handleSignOut">Sign Out</button>
    </header>
    <main>
      <p>Signed in as {{ auth.user?.email }}</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

async function handleSignOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.home-container {
  padding: 1.5rem;
  padding-top: env(safe-area-inset-top, 1.5rem);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
