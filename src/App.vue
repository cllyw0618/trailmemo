<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isImmersive = computed(() => route.name === 'map' || route.name === 'loading' || route.name === 'auth')

const navItems = [
  { label: '探索', icon: '🌎', to: '/map' },
  { label: '日记', icon: '📖', to: '/journal/new' },
  { label: '背包', icon: '🎒', to: '/memory' },
]
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--immersive': isImmersive }">
    <RouterView />

    <!-- 游戏底部导航 -->
    <nav v-if="!isImmersive" class="game-nav" aria-label="冒险导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="game-nav-item"
      >
        <span class="game-nav-icon">{{ item.icon }}</span>
        <span class="game-nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
