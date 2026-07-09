<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  window.setTimeout(() => router.push('/auth'), 1200)
})
</script>

<template>
  <main class="loading-view scene-panel">
    <div class="floating-dot dot-a"></div>
    <div class="floating-dot dot-b"></div>
    <div class="floating-dot dot-c"></div>

    <section class="loading-card">
      <p class="eyebrow">TrailMemo</p>
      <h1>Loading trail memories...</h1>
      <p class="subtitle">正在唤醒山野记忆</p>
      <div class="progress-track" aria-hidden="true">
        <span></span>
      </div>
      <RouterLink class="primary-action" to="/auth">开始探索</RouterLink>
    </section>
  </main>
</template>
