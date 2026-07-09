<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMemoryStore } from '../stores/memoryStore'
import CollageCard from '../components/CollageCard.vue'

const router = useRouter()
const route = useRoute()
const memory = useMemoryStore()

const templates = [
  {
    id: 't1',
    name: '一图日记',
    slots: 1,
    desc: '一张主图 + 标题 + 心情天气 + 长文字',
    style: 'one-photo',
  },
  {
    id: 't2',
    name: '两张瞬间',
    slots: 2,
    desc: '一大一小两张照片，适合主景 + 细节',
    style: 'two-photo',
  },
  {
    id: 't3',
    name: '三格旅页',
    slots: 3,
    desc: '三张照片错落排版，文字穿插其中',
    style: 'three-photo',
  },
  {
    id: 't4',
    name: '四宫拼贴',
    slots: 4,
    desc: '四张照片拼贴，适合完整记录一天',
    style: 'four-photo',
  },
]

const preselectedId = route.query.trailId || memory.trails[0]?.id || ''
const preselectedTrail = computed(() => memory.trails.find((trail) => trail.id === preselectedId))

const form = reactive({
  trailId: preselectedId,
  title: preselectedTrail.value?.name || '',
  mood: '',
  weather: '',
  text: '',
  images: [],
  template: 't4',
})

const selectedTemplate = computed(() => templates.find((template) => template.id === form.template) || templates[0])
const remainingSlots = computed(() => Math.max(selectedTemplate.value.slots - form.images.length, 0))
const selectedTrail = computed(() => memory.trails.find((trail) => trail.id === form.trailId))

// 保存后反馈弹窗
const showFeedback = ref(false)
const feedbackData = ref({})

const previewTitle = computed(() => form.title.trim() || selectedTrail.value?.name || '山野手账')
const previewText = computed(() => form.text.trim() || '写下你走过的路、看见的风景，还有那一刻的心情。')
const previewMeta = computed(() => {
  const mood = form.mood.trim() || '心情'
  const weather = form.weather.trim() || '天气'
  return `${mood} · ${weather}`
})

function addImages() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = () => {
    const files = Array.from(input.files || [])
    const toRead = files.slice(0, remainingSlots.value)

    toRead.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const maxW = 800
          const scale = img.width > maxW ? maxW / img.width : 1
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          form.images.push(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })
  }
  input.click()
}

function removeImage(index) {
  form.images.splice(index, 1)
}

function canAddMore() {
  return remainingSlots.value > 0
}

function chooseTemplate(template) {
  form.template = template.id
  if (form.images.length > template.slots) {
    form.images.splice(template.slots)
  }
}

function saveJournal() {
  if (!form.title.trim()) {
    form.title = selectedTrail.value?.name || '山野记忆'
  }
  const isNew = memory.addJournal({ ...form, images: [...form.images] })
  const trail = selectedTrail.value
  const growth = memory.growthLevel
  const nextGap = Math.max(0, growth.nextTarget - growth.current)
  feedbackData.value = {
    isNewlyUnlocked: isNew,
    trailName: trail?.name || '',
    storyTag: trail?.storyTag || '',
    levelName: growth.levelName,
    nextLevelName: growth.nextLevelName,
    nextGap,
  }
  showFeedback.value = true
}

function closeFeedback() {
  showFeedback.value = false
  router.push('/memory')
}
</script>

<template>
  <main class="page-pad editor-view journal-compose-page">
    <p class="eyebrow">Journey</p>
    <h1>创建新的旅程回忆</h1>
    <p class="subtitle">每一步都是冒险，每一页都是故事。</p>

    <div class="editor-layout">
      <section class="editor-form-section">
        <form class="journal-form" @submit.prevent="saveJournal">
          <!-- Step 1 -->
          <div class="step-section">
            <span class="step-badge">Step 1</span>
            <p class="step-title">选择旅程</p>
            <label>
              路线
              <select v-model="form.trailId">
                <option v-for="trail in memory.trails" :key="trail.id" :value="trail.id">
                  {{ trail.name }} · {{ trail.province }}
                </option>
              </select>
            </label>
          </div>

          <!-- Step 2 -->
          <div class="step-section">
            <span class="step-badge">Step 2</span>
            <p class="step-title">记录今天</p>

            <label>
              给这段回忆取个名字
              <input v-model="form.title" placeholder="武功山的第一缕晨光…" />
            </label>

            <div class="inline-fields">
              <label>
                心情
                <input v-model="form.mood" placeholder="自由 / 快乐 / 感动…" />
              </label>
              <label>
                天气
                <input v-model="form.weather" placeholder="晴 / 多云 / 雪…" />
              </label>
            </div>

            <label>
              记忆文字
              <textarea v-model="form.text" rows="4" placeholder="写下你想记住的画面、声音、风、朋友和自己…"></textarea>
            </label>

            <section class="image-section">
              <p class="field-label">照片（{{ form.images.length }} / {{ selectedTemplate.slots }}）</p>
              <div class="image-upload-grid">
                <button v-if="canAddMore()" type="button" class="add-image-btn" @click="addImages">
                  <span>+</span>
                  <small>添加照片</small>
                </button>
                <div v-for="(img, index) in form.images" :key="index" class="image-thumb">
                  <img :src="img" alt="" />
                  <button type="button" class="remove-img" @click="removeImage(index)">×</button>
                </div>
              </div>
            </section>
          </div>

          <!-- Step 3 -->
          <div class="step-section">
            <span class="step-badge">Step 3</span>
            <p class="step-title">选择排版</p>

            <div class="template-grid scrapbook-template-grid">
              <button
                v-for="template in templates"
                :key="template.id"
                type="button"
                class="template-option scrapbook-template-option"
                :class="[`template-card-${template.style}`, { active: form.template === template.id }]"
                @click="chooseTemplate(template)"
              >
                <div class="scrapbook-preview" aria-hidden="true">
                  <span class="mock-date">2026/5/21</span>
                  <span class="mock-photo photo-a"></span>
                  <span class="mock-photo photo-b"></span>
                  <span class="mock-photo photo-c"></span>
                  <span class="mock-photo photo-d"></span>
                  <span class="mock-note note-title">{{ previewTitle }}</span>
                  <span class="mock-note note-meta">{{ previewMeta }}</span>
                  <span class="mock-note note-text">{{ previewText }}</span>
                </div>
                <strong class="template-name">{{ template.name }}</strong>
                <small>{{ template.desc }}</small>
              </button>
            </div>
          </div>

          <button class="primary-action save-btn" type="submit">✨ 生成回忆卡</button>
        </form>
      </section>

      <aside class="editor-preview-section">
        <p class="field-label">预览</p>
        <div class="preview-card">
          <CollageCard :journal="{ ...form, createdAt: new Date().toISOString() }" />
        </div>
        <p v-if="!form.images.length" class="preview-tip">
          添加照片后，这里会实时生成你的旅途回忆。
        </p>
      </aside>
    </div>

    <!-- 保存后反馈弹窗 -->
    <Teleport to="body">
      <div v-if="showFeedback" class="feedback-overlay" @click.self="closeFeedback">
        <div class="feedback-modal">
          <div class="feedback-glow"></div>
          <p class="feedback-title">{{ feedbackData.isNewlyUnlocked ? '✨ 路线已点亮！' : '📖 回忆已记录' }}</p>
          <p class="feedback-trail">
            {{ feedbackData.trailName }}
          </p>
          <p v-if="feedbackData.isNewlyUnlocked" class="feedback-story">
            {{ feedbackData.storyTag }}
          </p>
          <p v-else class="feedback-story">新的回忆已加入这条路线</p>
          <div class="feedback-reward">
            <span>+{{ feedbackData.isNewlyUnlocked ? '50' : '10' }} 旅程经验</span>
          </div>
          <div class="feedback-divider"></div>
          <p class="feedback-level">当前等级：<strong>{{ feedbackData.levelName }}</strong></p>
          <p v-if="feedbackData.nextGap > 0" class="feedback-next">
            距离「{{ feedbackData.nextLevelName }}」还差 {{ feedbackData.nextGap }} 条路线
          </p>
          <p v-else class="feedback-next">你已经是最高的山野旅人</p>
          <button class="feedback-btn" type="button" @click="closeFeedback">继续探索</button>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: 28px;
  align-items: start;
  margin-top: 24px;
}

/* Step 区域 */
.step-section {
  padding: 20px 24px;
  border: 1px solid rgba(167, 243, 208, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.35);
  margin-bottom: 12px;
  transition: border-color 0.2s;
}
.step-section:hover {
  border-color: rgba(167, 243, 208, 0.4);
}
.step-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  color: #276749;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  background: rgba(167, 243, 208, 0.35);
  margin-bottom: 6px;
}
.step-title {
  margin: 0 0 16px;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 950;
}

.journal-form {
  display: grid;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.journal-form label {
  display: grid;
  gap: 8px;
  color: #475569;
  font-weight: 900;
}

.journal-form input,
.journal-form select,
.journal-form textarea {
  width: 100%;
  border: 1px solid rgba(128, 155, 171, 0.38);
  border-radius: 14px;
  padding: 12px 14px;
  color: #334155;
  background: rgba(255, 255, 255, 0.82);
}

.inline-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-label {
  margin: 0 0 6px;
  color: #475569;
  font-size: 0.94rem;
  font-weight: 950;
}

.template-section {
  margin-top: 4px;
}

.template-heading-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 12px;
}

.template-heading-row small {
  display: block;
  color: rgba(71, 85, 105, 0.68);
  font-size: 0.78rem;
  font-weight: 700;
}

.template-heading-row > span {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 6px 12px;
  color: #3d6476;
  font-size: 0.78rem;
  font-weight: 950;
  background: rgba(203, 236, 249, 0.72);
}

.scrapbook-template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.scrapbook-template-option {
  display: grid;
  gap: 8px;
  min-height: 282px;
  padding: 12px;
  border: 2px solid rgba(162, 181, 193, 0.32);
  border-radius: 18px;
  cursor: pointer;
  text-align: left;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(239, 249, 252, 0.76)),
    #fff;
  box-shadow: 0 14px 34px rgba(84, 118, 134, 0.11);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.scrapbook-template-option:hover {
  transform: translateY(-3px) rotate(-0.35deg);
  border-color: rgba(112, 193, 232, 0.72);
  box-shadow: 0 18px 42px rgba(84, 118, 134, 0.16);
}

.scrapbook-template-option.active {
  border-color: #72c8f4;
  background:
    linear-gradient(145deg, rgba(240, 251, 255, 0.96), rgba(255, 255, 255, 0.9)),
    #fff;
  box-shadow: 0 18px 48px rgba(80, 177, 225, 0.22), inset 0 0 0 2px rgba(255, 255, 255, 0.9);
}

.scrapbook-template-option small {
  color: rgba(72, 92, 105, 0.72);
  font-size: 0.76rem;
  font-weight: 750;
  line-height: 1.45;
}

.template-name {
  color: #345263;
  font-size: 1rem;
  font-weight: 950;
}

.scrapbook-preview {
  position: relative;
  overflow: hidden;
  height: 220px;
  border-radius: 10px;
  background:
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.95), transparent 22%),
    radial-gradient(circle at 75% 75%, rgba(202, 231, 242, 0.35), transparent 28%),
    linear-gradient(135deg, #f8f4e7 0%, #fbfaf2 54%, #edf7f8 100%);
  box-shadow: inset 0 0 0 1px rgba(83, 105, 116, 0.08);
}

.scrapbook-preview::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.28;
  background-image:
    linear-gradient(90deg, rgba(90, 109, 118, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(90, 109, 118, 0.04) 1px, transparent 1px);
  background-size: 18px 18px;
  pointer-events: none;
}

.mock-photo,
.mock-note,
.mock-date {
  position: absolute;
  z-index: 1;
  display: block;
}

.mock-photo {
  border: 5px solid rgba(255, 255, 255, 0.96);
  border-radius: 2px;
  background:
    linear-gradient(165deg, rgba(192, 226, 231, 0.45), rgba(255, 255, 255, 0.08)),
    linear-gradient(35deg, #80a783 0 34%, #d8e9c7 34% 58%, #a7d6eb 58% 100%);
  box-shadow: 0 6px 14px rgba(68, 88, 98, 0.16);
}

.photo-b {
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.24), transparent),
    linear-gradient(30deg, #6f8f79 0 38%, #d6e5be 38% 56%, #94d5ef 56% 100%);
}

.photo-c,
.photo-d {
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.32), transparent),
    linear-gradient(35deg, #547f72 0 42%, #e5e0c4 42% 60%, #b7e4f2 60% 100%);
}

.mock-note,
.mock-date {
  color: #586065;
  font-family: var(--tm-display-font);
  font-weight: 950;
  letter-spacing: 0.02em;
}

.mock-date {
  top: 14px;
  left: 16px;
  font-family: Georgia, serif;
  font-size: 1rem;
  font-weight: 800;
}

.mock-note {
  overflow: hidden;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.note-title {
  font-size: 0.92rem;
  -webkit-line-clamp: 1;
}

.note-meta {
  color: rgba(58, 87, 101, 0.7);
  font-size: 0.72rem;
  -webkit-line-clamp: 1;
}

.note-text {
  font-size: 0.76rem;
  -webkit-line-clamp: 3;
}

.template-card-one-photo .photo-a {
  top: 38px;
  left: 24px;
  width: calc(100% - 48px);
  height: 76px;
}

.template-card-one-photo .note-title {
  left: 30px;
  right: 30px;
  top: 154px;
  text-align: center;
}

.template-card-one-photo .note-meta {
  left: 30px;
  right: 30px;
  top: 178px;
  text-align: center;
}

.template-card-one-photo .note-text {
  left: 30px;
  right: 30px;
  bottom: 14px;
  text-align: center;
  -webkit-line-clamp: 1;
}

.template-card-one-photo .photo-b,
.template-card-one-photo .photo-c,
.template-card-one-photo .photo-d {
  display: none;
}

.template-card-two-photo .photo-a {
  top: 32px;
  left: 18px;
  width: 58%;
  height: 82px;
}

.template-card-two-photo .photo-b {
  right: 20px;
  bottom: 28px;
  width: 40%;
  height: 54px;
}

.template-card-two-photo .note-title {
  top: 154px;
  left: 20px;
  width: 48%;
}

.template-card-two-photo .note-meta {
  top: 178px;
  left: 20px;
  width: 48%;
}

.template-card-two-photo .note-text {
  top: 50px;
  right: 18px;
  width: 34%;
  -webkit-line-clamp: 3;
}

.template-card-two-photo .photo-c,
.template-card-two-photo .photo-d {
  display: none;
}

.template-card-three-photo .photo-a {
  top: 22px;
  left: 14px;
  width: 50%;
  height: 52px;
  transform: rotate(-1.5deg);
}

.template-card-three-photo .photo-b {
  top: 78px;
  right: 16px;
  width: 56%;
  height: 52px;
  transform: rotate(1deg);
}

.template-card-three-photo .photo-c {
  left: 22px;
  bottom: 18px;
  width: 46%;
  height: 46px;
  transform: rotate(-1deg);
}

.template-card-three-photo .note-title {
  top: 34px;
  right: 18px;
  width: 34%;
}

.template-card-three-photo .note-meta {
  left: 16px;
  top: 112px;
  width: 35%;
}

.template-card-three-photo .note-text {
  right: 18px;
  bottom: 18px;
  width: 38%;
}

.template-card-three-photo .mock-date,
.template-card-three-photo .photo-d {
  display: none;
}

.template-card-four-photo .photo-a {
  top: 18px;
  left: 16px;
  width: 44%;
  height: 58px;
  transform: rotate(-1.5deg);
}

.template-card-four-photo .photo-b {
  top: 30px;
  right: 16px;
  width: 38%;
  height: 70px;
  transform: rotate(1.5deg);
}

.template-card-four-photo .photo-c {
  left: 22px;
  bottom: 20px;
  width: 42%;
  height: 46px;
}

.template-card-four-photo .photo-d {
  right: 20px;
  bottom: 20px;
  width: 36%;
  height: 42px;
  transform: rotate(-1deg);
}

.template-card-four-photo .note-title {
  left: 18px;
  right: 18px;
  top: 140px;
  text-align: center;
}

.template-card-four-photo .note-meta {
  left: 18px;
  right: 18px;
  top: 164px;
  text-align: center;
}

.template-card-four-photo .note-text {
  display: none;
}

.template-card-four-photo .mock-date {
  display: none;
}

.upload-help {
  margin: -2px 0 8px;
  color: rgba(71, 85, 105, 0.66);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.6;
}

.image-upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.add-image-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border: 2px dashed rgba(128, 155, 171, 0.45);
  border-radius: 14px;
  color: #4f6d7d;
  font-size: 0.9rem;
  font-weight: 950;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.55);
  transition: all 0.15s ease;
}

.add-image-btn small {
  color: rgba(79, 109, 125, 0.72);
  font-size: 0.66rem;
  font-weight: 900;
}

.add-image-btn:hover {
  border-color: #7dd3fc;
  color: #0369a1;
  background: rgba(125, 211, 252, 0.12);
}

.image-thumb {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.image-thumb:hover .remove-img {
  opacity: 1;
}

.save-btn {
  margin-top: 8px;
  min-height: 48px;
  font-size: 1rem;
}

.editor-preview-section {
  position: sticky;
  top: 96px;
}

.preview-card {
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(71, 85, 105, 0.12);
}

.preview-tip {
  margin-top: 14px;
  color: #78909e;
  font-size: 0.88rem;
  font-weight: 800;
  text-align: center;
}

@media (max-width: 980px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .editor-preview-section {
    position: static;
  }
}

@media (max-width: 720px) {
  .scrapbook-template-grid {
    grid-template-columns: 1fr;
  }

  .inline-fields {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .journal-form {
    padding: 18px;
  }

  .scrapbook-template-option {
    min-height: 260px;
  }
}

/* 保存后反馈弹窗 */
.feedback-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}
.feedback-modal {
  position: relative;
  max-width: 340px;
  width: 88vw;
  padding: 28px 24px 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  animation: modalPop 0.3s ease-out;
  overflow: hidden;
}
.feedback-glow {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(110, 231, 183, 0.3), transparent 70%);
  pointer-events: none;
}
@keyframes modalPop {
  from { transform: scale(0.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.feedback-title {
  position: relative;
  margin: 0 0 12px;
  color: #276749;
  font-size: 1.3rem;
  font-weight: 950;
}
.feedback-trail {
  margin: 0 0 6px;
  color: #334155;
  font-size: 1.1rem;
  font-weight: 950;
}
.feedback-trail strong { color: #1e3a8a; }
.feedback-story {
  margin: 0 0 14px;
  color: #64748b;
  font-size: 0.82rem;
  font-style: italic;
}
.feedback-reward {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 999px;
  margin-bottom: 14px;
  color: #276749;
  font-size: 0.78rem;
  font-weight: 900;
  background: rgba(167, 243, 208, 0.3);
  border: 1px dashed rgba(110, 231, 183, 0.35);
}
.feedback-divider {
  height: 1px;
  margin: 0 0 14px;
  background: rgba(148, 163, 184, 0.2);
}
.feedback-level {
  margin: 0 0 4px;
  color: #334155;
  font-size: 0.9rem;
}
.feedback-level strong { color: #276749; }
.feedback-next {
  margin: 0 0 18px;
  color: #94a3b8;
  font-size: 0.78rem;
}
.feedback-btn {
  display: inline-block;
  padding: 10px 28px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(135deg, #6ee7b7, #7dd3fc);
  transition: opacity 0.15s;
}
.feedback-btn:hover { opacity: 0.85; }
</style>

