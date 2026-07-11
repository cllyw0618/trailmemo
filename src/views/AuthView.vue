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

const mode = ref('register')
const email = ref('')
const password = ref('')
const username = ref('')
const gender = ref('')
const birthday = ref('')
const error = ref('')
const loading = ref(false)

const travelerGender = ref('female')
const travelerIdentity = ref('forest')

const identityOptions = [
  { id: 'forest', name: '森林新人', desc: '从柔软草甸出发，慢慢收集第一束山风', icon: '🌿' },
  { id: 'coast', name: '海岸旅人', desc: '把潮声、贝壳和海边日落装进口袋', icon: '🌊' },
  { id: 'mountain', name: '山峰探索者', desc: '向往高峰的攀登者，云层之上是归宿', icon: '⛰️' },
]

const title = computed(() => {
  if (mode.value === 'login') return '登录山野手账'
  if (mode.value === 'guest') return '游客访问'
  return '注册山野账号'
})

const subtitle = computed(() => {
  if (mode.value === 'login') return '用已绑定的邮箱找回你的地图、手账和点亮记录。'
  if (mode.value === 'guest') return '不填邮箱密码，先以游客身份进入；之后仍可绑定邮箱保存进度。'
  return '创建正式账号，也可以先游客访问，慢慢记录你的山野故事。'
})

function switchMode(nextMode) {
  mode.value = nextMode
  error.value = ''
}

async function enterApp(profile) {
  traveler.createTraveler(profile?.travelerGender || travelerGender.value, profile?.travelerIdentity || travelerIdentity.value)
  await memory.loadUserData()
  router.push('/map')
}

async function submit() {
  error.value = ''
  loading.value = true

  try {
    if (mode.value === 'guest') {
      const profile = await auth.anonymousLogin()
      await enterApp(profile)
      return
    }

    if (mode.value === 'login') {
      const profile = await auth.login(email.value, password.value)
      await enterApp(profile)
      return
    }

    const profile = await auth.register(email.value, password.value, {
      username: username.value,
      gender: gender.value,
      birthday: birthday.value,
      travelerGender: travelerGender.value,
      travelerIdentity: travelerIdentity.value,
    })
    await enterApp(profile)
  } catch (e) {
    error.value = e.message || '操作失败，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-pad auth-view">
    <div class="auth-card">
      <p class="eyebrow">TrailMemo</p>
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>

      <div class="auth-tabs" role="tablist" aria-label="认证方式">
        <button type="button" :class="['auth-tab', { active: mode === 'register' }]" @click="switchMode('register')">注册</button>
        <button type="button" :class="['auth-tab', { active: mode === 'login' }]" @click="switchMode('login')">登录</button>
        <button type="button" :class="['auth-tab', { active: mode === 'guest' }]" @click="switchMode('guest')">游客访问</button>
      </div>

      <div v-if="mode !== 'login'" class="traveler-setup compact-setup">
        <div class="traveler-preview">
          <PixelTraveler
            :gender="travelerGender"
            :identity="travelerIdentity"
            :level="1"
            :size="108"
          />
        </div>

        <template v-if="mode === 'register'">
          <div class="traveler-gender-select">
            <button
              type="button"
              :class="['gender-btn', { active: travelerGender === 'male' }]"
              @click="travelerGender = 'male'"
            >
              <span>♂</span> 男生形象
            </button>
            <button
              type="button"
              :class="['gender-btn', { active: travelerGender === 'female' }]"
              @click="travelerGender = 'female'"
            >
              <span>♀</span> 女生形象
            </button>
          </div>

          <p class="setup-label">选择初始身份</p>
          <div class="identity-grid">
            <button
              v-for="opt in identityOptions"
              :key="opt.id"
              type="button"
              :class="['identity-btn', { active: travelerIdentity === opt.id }]"
              @click="travelerIdentity = opt.id"
            >
              <span class="identity-icon">{{ opt.icon }}</span>
              <span>
                <strong>{{ opt.name }}</strong>
                <small>{{ opt.desc }}</small>
              </span>
            </button>
          </div>
        </template>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <template v-if="mode !== 'guest'">
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
              :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              required
              minlength="6"
            />
          </label>

          <template v-if="mode === 'register'">
            <label>
              旅人昵称
              <input v-model="username" type="text" placeholder="比如：远山小记" maxlength="20" />
            </label>

            <div class="inline-fields">
              <label>
                性别
                <select v-model="gender">
                  <option value="">选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="其他">其他</option>
                </select>
              </label>
              <label class="birthday-field">
                生日
                <input v-model="birthday" class="birthday-input" type="date" aria-label="生日" />
              </label>
            </div>
          </template>
        </template>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button class="primary-action" type="submit" :disabled="loading">
          {{ loading ? '处理中...' : mode === 'guest' ? '以游客身份进入 ✦' : mode === 'login' ? '登录 ✦' : '注册并进入 ✦' }}
        </button>
      </form>
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

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 0 0 18px;
  padding: 5px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
}

.auth-tab {
  min-height: 36px;
  border: 0;
  border-radius: 999px;
  color: #64748b;
  background: transparent;
  font-size: 0.86rem;
  font-weight: 900;
  cursor: pointer;
}

.auth-tab.active {
  color: #276749;
  background: rgba(219, 244, 255, 0.84);
  box-shadow: 0 10px 24px rgba(71, 85, 105, 0.08);
}
</style>
