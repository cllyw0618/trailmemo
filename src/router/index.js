import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '../views/LoadingView.vue'
import AuthView from '../views/AuthView.vue'
import MapView from '../views/MapView.vue'
import JournalEditorView from '../views/JournalEditorView.vue'
import MemoryView from '../views/MemoryView.vue'
import GrowthView from '../views/GrowthView.vue'
import CommunityView from '../views/CommunityView.vue'

const routes = [
  { path: '/', name: 'loading', component: LoadingView },
  { path: '/auth', name: 'auth', component: AuthView },
  { path: '/map', name: 'map', component: MapView },
  { path: '/journal/new', name: 'journal-new', component: JournalEditorView },
  { path: '/growth', name: 'growth', component: GrowthView },
  { path: '/memory', name: 'memory', component: MemoryView },
  { path: '/community', name: 'community', component: CommunityView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router