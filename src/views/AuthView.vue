<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useTravelerStore } from '../stores/travelerStore'
import PixelTraveler from '../components/PixelTraveler.vue'

const router = useRouter()
const auth = useAuthStore()
const traveler = useTravelerStore()

const isLogin = ref(false)
const username = ref('')
const password = ref('')
const gender = ref('')
const birthday = ref('')
const error = ref('')
const loading = ref(false)

// 旅人创建
const showTravelerSetup = ref(false)
const travelerGender = ref('male')
const travelerIdentity = ref('forest')

const identityOptions = [
  { id: 'forest', name: '森林新人', desc: '来自密林的探索者，与树木和溪流为伴', icon: '🌲' },
  { id: 'coast', name: '海岸旅人', desc: '追逐海浪的旅人，收藏着每一片贝壳', icon: '🌊' },
  { id: 'mountain', name: '山峰探索者', desc: '向往高峰的攀登者，云层之上是归宿', icon: '🏔️' },
]

const selectedIdentity = computed(() => identityOptions.find((o) => o.id === travelerIdentity.value))

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  showTravelerSetup.value = false
}

function toggleTravelerGender() {
  travelerGender.value = travelerGender.value === 'male' ? 'female' : 'male'
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (isLogin.value) {
      await auth.login(username.value, password.value)
      router.push('/map')
    } else {
      if (!showTravelerSetup.value) {
        // 第一步：填写基本信息，然后进入旅人创建
        showTravelerSetup.value = true
        loading.value = false
        return
      }
      // 第二步：注册 + 创建旅人
      await auth.register(username.value, password.value, gender.value, birthday.value)
      traveler.createTraveler(travelerGender.value, travelerIdentity.value)
      router.push('/map')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-pad auth-view">
    <div class="auth-card">
      <p class="eyebrow">TrailMemo</p>
      <h1>{{ isLogin ? '登录' : showTravelerSetup ? '创建你的像素旅人' : '注册' }}</h1>
      <p class="subtitle">
        {{ isLogin ? '欢迎回来，继续你的山野之旅'
        : showTravelerSetup ? '选择一位陪伴你探索山野的旅人'
        : '创建一个账号，记录你的山野足迹' }}
      </p>

      <!-- 旅人创建界面 -->
      <div v-if="showTravelerSetup" class="traveler-setup">
        <div class="traveler-preview">
          <PixelTraveler
            :gender="travelerGender"
            :identity="travelerIdentity"
            :level="0"
            :size="120"
          />
        </div>

        <div class="traveler-gender-select">
          <button
            type="button"
            :class="['gender-btn', { active: travelerGender === 'male' }]"
            @click="travelerGender = 'male'"
          >
            <span>🧑</span> 男性角色
          </button>
          <button
            type="button"
            :class="['gender-btn', { active: travelerGender === 'female' }]"
            @click="travelerGender = 'female'"
          >
            <span>👩</span> 女性角色
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
            <strong>{{ opt.name }}</strong>
            <small>{{ opt.desc }}</small>
          </button>
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button class="primary-action" type="submit" :disabled="loading" @click="submit">
          {{ loading ? '创建中...' : '✦ 开始山野之旅' }}
        </button>
      </div>

      <!-- 登录/注册表单 -->
      <form v-else class="auth-form" @submit.prevent="submit">
        <label>
          用户名
          <input v-model="username" type="text" placeholder="你的昵称" required maxlength="20" />
        </label>

        <label>
          密码
          <input v-model="password" type="password" placeholder="至少6位密码" required minlength="6" />
        </label>

        <template v-if="!isLogin">
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
            <label>
              生日
              <input v-model="birthday" type="date" />
            </label>
          </div>
        </template>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button class="primary-action" type="submit" :disabled="loading">
          {{ loading ? '处理中...' : isLogin ? '登录 ✦' : '下一步 ✦' }}
        </button>
      </form>

      <p class="auth-toggle">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <button type="button" class="link-btn" @click="toggleMode">
          {{ isLogin ? '去注册' : '去登录' }}
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
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
</style>