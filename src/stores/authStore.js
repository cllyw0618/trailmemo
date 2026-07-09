import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API = 'http://localhost:3001/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => user.value !== null)

  async function register(username, password, gender, birthday) {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, gender, birthday }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '注册失败')
    user.value = data
    return data
  }

  async function login(username, password) {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '登录失败')
    user.value = data
    return data
  }

  function logout() {
    user.value = null
  }

  return { user, isLoggedIn, register, login, logout }
})