import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { useAuthStore } from './stores/authStore'
import { useMemoryStore } from './stores/memoryStore'
import { useTravelerStore } from './stores/travelerStore'

async function bootstrap() {
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia).use(router)

  const auth = useAuthStore(pinia)
  const memory = useMemoryStore(pinia)
  const traveler = useTravelerStore(pinia)

  try {
    await auth.initAuth()
    if (auth.user) {
      traveler.createTraveler(auth.user.travelerGender || 'female', auth.user.travelerIdentity || 'forest')
      await memory.loadUserData()
    }
  } catch (error) {
    console.error('[TrailMemo] auth bootstrap failed:', error)
  }

  app.mount('#app')
}

bootstrap()
