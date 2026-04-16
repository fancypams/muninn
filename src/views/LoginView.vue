<template>
  <div class="login-container">
    <h1>Muninn</h1>
    <form @submit.prevent="handleSubmit">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
        autocomplete="email"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
        autocomplete="current-password"
      />
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <button type="submit" :disabled="loading">
        {{ isSignUp ? 'Sign Up' : 'Sign In' }}
      </button>
      <button type="button" class="toggle" @click="isSignUp = !isSignUp">
        {{ isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const isSignUp = ref(false)

async function handleSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    if (isSignUp.value) {
      await auth.signUp(email.value, password.value)
    } else {
      await auth.signIn(email.value, password.value)
    }
    router.push({ name: 'home' })
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Authentication failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100svh;
  padding: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 360px;
}

input {
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}

button[type='submit'] {
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

button[type='submit']:disabled {
  opacity: 0.6;
}

.toggle {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 0.875rem;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
