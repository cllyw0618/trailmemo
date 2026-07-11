<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useTravelerStore } from '../stores/travelerStore'
import { useMemoryStore } from '../stores/memoryStore'
import PixelTraveler from '../components/PixelTraveler.vue'

const router = useRouter()
const auth = useAuthStore()
const traveler = useTravelerStore()
const memory = useMemoryStore()

const mode = ref('bind')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const displayName = computed(() => auth.profile?.username || auth.user?.username || '山野旅人')
const travelerGender = computed(() => auth.profile?.travelerGender || auth.user?.travelerGender || 'female')
const travelerIdentity = computed(() => auth.profile?.travelerIdentity || auth.user?.travelerIdentity || 'forest')

function switchMode(nextMode) {
  mode.value = nextMode
  error.value = ''
  success.value = ''
}

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    let profile
    if (mode.value === 'bind') {
      if (!auth.isAnonymous) {
        success.value = '当前已经是正式账号，不需要重复绑定。'
        return
      }
      profile = await auth.linkEmailAccount(email.value, password.value)
      success.value = '绑定成功！你的山野进度已经保存到邮箱账号。'
    } else {
      profile = await auth.login(email.value, password.value)
      success.value = '登录成功，正在回到山野星球。'
    }

    traveler.createTraveler(profile?.travelerGender || 'female', profile?.travelerIdentity || 'forest')
    await memory.loadUserData()
    router.push('/map')
  } catch (e) {
    error.value = e.message || (mode.value === 'bind' ? '绑定失败，请稍后再试' : '登录失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-pad auth-view">
    <div class="auth-card">
      <p class="eyebrow">TrailMemo</p>
      <h1>{{ mode === 'bind' ? '绑定账号保存进度' : '邮箱账号登录' }}</h1>
      <p class="subtitle">
        {{ mode === 'bind'
          ? '游客进度会保留在当前身份里，绑定后换设备也能继续记录。'
          : '登录已经绑定过的邮箱账号，找回你的地图和手账。' }}
      </p>

      <div class="traveler-setup compact-setup">
        <div class="traveler-preview">
          <PixelTraveler
            :gender="travelerGender"
            :identity="travelerIdentity"
            :level="auth.profile?.level || 1"
            :size="108"
          />
        </div>
        <p class="setup-label account-status">
          {{ auth.isAnonymous ? '游客模式' : '正式账号' }} · {{ displayName }}
        </p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          邮箱
          <input v-model="email" type="email" placeholder="例如：you@qq.com" autocomplete="email" required />
        </label>

        <label>
          密码
          <input
            v-model="password"
            type="password"
            placeholder="至少 6 位密码"
            :autocomplete="mode === 'bind' ? 'new-password' : 'current-password'"
            required
            minlength="6"
          />
        </label>

        <p v-if="error" class="auth-error">{{ error }}</p>
        <p v-if="success" class="auth-success">{{ success }}</p>

        <button class="primary-action" type="submit" :disabled="loading">
          {{ loading ? '处理中...' : mode === 'bind' ? '绑定邮箱 ✦' : '登录 ✦' }}
        </button>
      </form>

      <p class="auth-toggle">
        {{ mode === 'bind' ? '已经绑定过邮箱？' : '正在使用游客模式？' }}
        <button type="button" class="link-btn" @click="switchMode(mode === 'bind' ? 'login' : 'bind')">
          {{ mode === 'bind' ? '去登录' : '去绑定' }}
        </button>
      </p>
    </div>
  </main>
</template>
<style scoped>
.auth-view {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background:
    radial-gradient(circle at 22% 18%, rgba(191, 237, 218, 0.78), transparent 28%),
    radial-gradient(circle at 82% 12%, rgba(206, 230, 255, 0.78), transparent 26%),
    linear-gradient(135deg, #f2faf5 0%, #edf7fc 42%, #f5f2fa 100%);
}

.auth-card {
  width: min(420px, 92vw);
  padding: 40px 32px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 24px 60px rgba(71, 85, 105, 0.14);
  backdrop-filter: blur(20px);
}

.auth-card h1 {
  font-size: 2rem;
  margin-bottom: 6px;
}

.auth-card .subtitle {
  margin: 0 0 24px;
  color: #64748b;
  font-size: 0.92rem;
}

.auth-form {
  display: grid;
  gap: 14px;
  text-align: left;
}

.auth-form label {
  display: grid;
  gap: 6px;
  color: #475569;
  font-weight: 800;
  font-size: 0.88rem;
}

.auth-form input,
.auth-form select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 12px;
  padding: 11px 14px;
  color: #334155;
  background: rgba(255, 255, 255, 0.8);
}

.auth-form input::placeholder {
  color: #94a3b8;
}

.inline-fields {
  display: grid;
  grid-template-columns: minmax(96px, 0.78fr) minmax(188px, 1.22fr);
  gap: 12px;
}


.birthday-field {
  min-width: 0;
}

.auth-form input[type="date"].birthday-input {
  min-width: 0;
  padding-right: 10px;
  font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0;
}
.auth-error {
  margin: 0;
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 700;
}

.auth-success {
  margin: 0;
  color: #276749;
  font-size: 0.85rem;
  font-weight: 800;
}

.auth-form .primary-action {
  width: 100%;
  margin-top: 4px;
  min-height: 46px;
}

.auth-form .primary-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-toggle {
  margin: 18px 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.link-btn {
  border: 0;
  padding: 0;
  color: #276749;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.link-btn:hover {
  color: #166534;
}

@media (max-width: 420px) {
  .auth-card {
    padding: 28px 20px;
  }
  .inline-fields {
    grid-template-columns: 1fr;
  }
}

/* 旅人创建 */
.traveler-setup {
  text-align: center;
}
.traveler-preview {
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(167, 243, 208, 0.12);
  border: 1px solid rgba(167, 243, 208, 0.2);
}
.traveler-gender-select {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
}
.gender-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.15s;
}
.gender-btn.active {
  color: #276749;
  border-color: #6ee7b7;
  background: rgba(167, 243, 208, 0.18);
}
.setup-label {
  margin: 0 0 10px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 900;
  text-align: left;
}
.identity-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}
.identity-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  text-align: left;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.15s;
}
.identity-btn.active {
  border-color: rgba(110, 231, 183, 0.4);
  background: rgba(167, 243, 208, 0.12);
}
.identity-icon { font-size: 1.5rem; flex-shrink: 0; }
.identity-btn strong {
  display: block;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 950;
}
.identity-btn small {
  display: block;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 800;
}
.identity-btn.active strong { color: #276749; }

.compact-setup {
  margin-bottom: 16px;
}

.account-status {
  text-align: center;
  color: #276749;
}
</style>
