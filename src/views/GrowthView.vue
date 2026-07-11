<script setup>
import { useMemoryStore } from '../stores/memoryStore'
import { useTravelerStore } from '../stores/travelerStore'
import GrowthSystemPanel from '../components/GrowthSystemPanel.vue'

const memory = useMemoryStore()
const traveler = useTravelerStore()
</script>

<template>
  <main class="growth-page">
    <GrowthSystemPanel
      :unlocked-count="memory.unlockedCount"
      :initial-gender="traveler.gender"
      :identity="traveler.identity"
    />
  </main>
</template>

<style scoped>
.growth-page {
  min-height: 100vh;
  padding: clamp(18px, 4vw, 38px) clamp(14px, 3vw, 28px) 112px;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 16% 8%, rgba(246, 226, 173, 0.22), transparent 30%),
    radial-gradient(circle at 84% 10%, rgba(194, 215, 179, 0.22), transparent 28%),
    linear-gradient(180deg, #fffaf0 0%, #f3f8f4 48%, #eff8fb 100%);
}
</style>
