<template>
  <div class="login-page">
    <div class="login-container">
      <div class="logo-area">
        <div class="logo-mark">
          <img src="/muninn-icon.png" alt="muninn" />
        </div>
        <h1 class="wordmark">muninn</h1>
        <p class="tagline">TRAVEL TOGETHER</p>
      </div>

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
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ isSignUp ? 'Sign Up' : 'Sign In' }}
        </button>
        <p class="toggle-text">
          {{ isSignUp ? 'Already have an account?' : 'No account?' }}
          <button type="button" class="toggle-link" @click="isSignUp = !isSignUp">
            {{ isSignUp ? 'Sign in' : 'Sign up' }}
          </button>
        </p>
      </form>
    </div>
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
.login-page {
  min-height: 100svh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  padding-top: calc(env(safe-area-inset-top, 0px) + 2rem);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);
}

.login-container {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.logo-mark {
  width: 64px;
  height: 64px;
  background: var(--dark);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wordmark {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.tagline {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--text-muted);
  text-transform: uppercase;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

input {
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--surface);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}

input::placeholder {
  color: var(--text-muted);
}

input:focus {
  border-color: var(--dark);
}

.btn-primary {
  padding: 0.875rem;
  background: var(--dark);
  color: var(--surface);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 0.25rem;
}

.btn-primary:disabled {
  opacity: 0.5;
}

.toggle-text {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.toggle-link {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
