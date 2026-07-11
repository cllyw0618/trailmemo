<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const displayName = computed(() => auth.profile?.username || auth.user?.username || '山野旅人')
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

      <p class="visitor-badge">
        {{ auth.isAnonymous ? '游客模式' : displayName }}
      </p>

      <RouterLink class="primary-action" to="/map">唤醒山野记忆</RouterLink>
      <RouterLink v-if="auth.isAnonymous" class="secondary-action" to="/auth">绑定账号保存进度</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.visitor-badge {
  width: fit-content;
  margin: 14px auto 10px;
  padding: 7px 14px;
  border: 1px solid rgba(39, 103, 73, 0.18);
  border-radius: 999px;
  color: #276749;
  background: rgba(255, 255, 255, 0.56);
  font-size: 0.86rem;
  font-weight: 900;
}

.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  margin-top: 10px;
  padding: 0 18px;
  border: 1px solid rgba(39, 103, 73, 0.2);
  border-radius: 999px;
  color: #276749;
  background: rgba(255, 255, 255, 0.68);
  font-size: 0.92rem;
  font-weight: 900;
  text-decoration: none;
}
</style>
