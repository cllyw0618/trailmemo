<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isImmersive = computed(() => route.name === 'map' || route.name === 'loading' || route.name === 'auth')

const navItems = [
  { label: '\u63a2\u7d22', icon: '\u{1F30E}', to: '/map' },
  { label: '\u65e5\u8bb0', icon: '\u{1F4D6}', to: '/journal/new' },
  { label: '\u6210\u957f', icon: '\u{1F331}', to: '/growth' },
  { label: '\u80cc\u5305', icon: '\u{1F392}', to: '/memory' },
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
