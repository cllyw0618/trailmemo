<script setup>
</script>

<template>
  <main class="loading-view scene-panel">
    <div class="floating-dot dot-a"></div>
    <div class="floating-dot dot-b"></div>
    <div class="floating-dot dot-c"></div>

    <section class="loading-card">
      <p class="eyebrow">TrailMemo</p>
      <h1>Loading trail memories...</h1>
      <p class="subtitle">旋转星球，准备唤醒你的山野记忆。</p>
      <div class="progress-track" aria-hidden="true">
        <span></span>
      </div>
      <RouterLink class="primary-action" to="/auth">唤醒山野记忆</RouterLink>
    </section>
  </main>
</template>
