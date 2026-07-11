<script setup>
import { computed, ref } from 'vue'
import { useMemoryStore } from '../stores/memoryStore'
import { useCommunityStore } from '../stores/communityStore'
import CollageCard from '../components/CollageCard.vue'
import PixelTraveler from '../components/PixelTraveler.vue'
import { checkAchievements } from '../data/achievements.js'
import { useTravelerStore } from '../stores/travelerStore'

const memory = useMemoryStore()
const community = useCommunityStore()
const traveler = useTravelerStore()
const pendingDeleteId = ref('')
const showUnlockedPlaces = ref(false)
const showAchievements = ref(false)
const sharingJournalId = ref('')
const shareDoneId = ref('')

const growth = computed(() => memory.growthLevel)
const unlockedTrails = computed(() => memory.trails.filter((trail) => memory.unlockedTrailIds.includes(trail.id)))
const achievementTypeStats = computed(() => memory.achievementTypeStats)
const chapterProgress = computed(() => memory.chapterProgress)

/** 成就列表 */
const achievements = computed(() => {
  const stats = { unlockedCount: memory.unlockedCount, types: memory.achievementTypeStats }
  return checkAchievements(stats)
})
const unlockedAchievements = computed(() => achievements.value.filter((a) => a.unlocked))

/** 类型名称映射 */
const typeNameMap = {
  grassland: '草甸',
  snow: '雪山',
  canyon: '峡谷',
  coast: '海岸',
  pilgrimage: '朝圣',
  alpine: '高山',
  patagonia: '巴塔哥尼亚',
  volcano: '火山',
}

/** 等级对应的图标 */
const levelEmoji = computed(() => {
  const idx = growth.value.current
  if (idx >= 16) return '🌍'
  if (idx >= 12) return '🌟'
  if (idx >= 8) return '🏔️'
  if (idx >= 5) return '🌿'
  if (idx >= 3) return '🌾'
  if (idx >= 1) return '🌱'
  return '🌿'
})

/** 查找 journal 对应的路线数据 */
function getTrailForJournal(journal) {
  if (!journal?.trailId) return null
  return memory.trails.find((t) => t.id === journal.trailId) || null
}

function toggleUnlockedPlaces() {
  showUnlockedPlaces.value = !showUnlockedPlaces.value
}
function toggleAchievements() {
  showAchievements.value = !showAchievements.value
}
function askDelete(journalId) { pendingDeleteId.value = journalId }
function cancelDelete() { pendingDeleteId.value = '' }
async function confirmDelete(journalId) {
  await memory.deleteJournal(journalId)
  pendingDeleteId.value = ''
}

async function shareToCommunity(journal) {
  sharingJournalId.value = journal.id
  try {
    await community.createPost(journal)
    shareDoneId.value = journal.id
    setTimeout(() => { shareDoneId.value = '' }, 2000)
  } catch (e) {
    alert('分享失败：' + (e.message || '请确认 Supabase 已创建 community_posts 表'))
  } finally {
    sharingJournalId.value = ''
  }
}
</script>

<template>
  <main class="archive-page">
    <!-- ===== 英雄卡片：旅人档案 ===== -->
    <header class="hero-card">
      <PixelTraveler
        v-if="traveler.hasTraveler"
        :gender="traveler.gender"
        :identity="traveler.identity"
        :level="memory.unlockedCount"
        :size="64"
      />
      <div class="hero-avatar" v-else>
        <span class="hero-emoji">{{ levelEmoji }}</span>
      </div>
      <div class="hero-body">
        <p class="hero-label">山野旅人</p>
        <p class="hero-title">{{ growth.levelName }}</p>
        <div class="hero-stats">
          <div class="hero-stat">
            <strong>{{ growth.current }}</strong>
            <span>已探索区域</span>
          </div>
          <div class="hero-stat">
            <strong>{{ memory.journalCount }}</strong>
            <span>收集回忆</span>
          </div>
          <div class="hero-stat">
            <strong>{{ memory.totalDistanceKm }}</strong>
            <span>累计公里</span>
          </div>
        </div>
        <div class="hero-xp-bar">
          <span :style="{ width: growth.progressPercent + '%' }"></span>
        </div>
        <p class="hero-xp-hint" v-if="Math.max(0, growth.nextTarget - growth.current) > 0">
          距离「{{ growth.nextLevelName }}」还需 {{ Math.max(0, growth.nextTarget - growth.current) }} 次远行
        </p>
        <p class="hero-xp-hint" v-else>你已抵达山野之巅</p>
      </div>
    </header>

    <!-- ===== 旅程地图（章节进度） ===== -->
    <section class="journey-section">
      <h2 class="section-title">旅程地图</h2>
      <div class="journey-map">
        <div
          v-for="ch in chapterProgress"
          :key="ch.chapterName"
          class="journey-chapter"
          :class="{ completed: ch.unlocked >= ch.total }"
        >
          <div class="chapter-header">
            <span class="chapter-icon">{{ ch.unlocked >= ch.total ? '★' : '○' }}</span>
            <span class="chapter-name">{{ ch.chapterName }}</span>
          </div>
          <div class="chapter-track">
            <span
              v-for="i in ch.total"
              :key="i"
              class="chapter-node"
              :class="{ lit: i <= ch.unlocked }"
            ></span>
          </div>
          <span class="chapter-count">{{ ch.unlocked }}/{{ ch.total }}</span>
        </div>
      </div>
    </section>

    <!-- ===== 成就徽章 ===== -->
    <section class="badges-section">
      <h2 class="section-title">旅途徽章</h2>
      <div class="badges-grid">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="badge-card"
          :class="{ earned: ach.unlocked }"
        >
          <span class="badge-icon">{{ ach.unlocked ? '⭐' : '☆' }}</span>
          <div class="badge-body">
            <strong>{{ ach.name }}</strong>
            <small>{{ ach.description }}</small>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 已探索区域 ===== -->
    <section class="explored-section">
      <h2 class="section-title">已探索区域</h2>
      <div class="explored-tags" v-if="Object.keys(achievementTypeStats).length">
        <span v-for="(count, type) in achievementTypeStats" :key="type" class="explored-tag">
          {{ typeNameMap[type] || type }} × {{ count }}
        </span>
        <span v-if="!Object.keys(achievementTypeStats).length" class="no-content">
          还没有探索过山野
        </span>
      </div>
      <div class="explored-list" v-if="showUnlockedPlaces">
        <div
          v-for="trail in unlockedTrails"
          :key="trail.id"
          class="explored-item"
        >
          <span class="explored-dot"></span>
          <span class="explored-name">{{ trail.name }}</span>
          <span class="explored-type">{{ trail.chapter }}</span>
        </div>
      </div>
      <button v-if="unlockedTrails.length" class="toggle-btn" type="button" @click="toggleUnlockedPlaces">
        {{ showUnlockedPlaces ? '收起' : '查看全部' }}（{{ unlockedTrails.length }}条路线）
      </button>
    </section>

    <!-- ===== 回忆手账 ===== -->
    <section class="memories-section">
      <h2 class="section-title">回忆手账</h2>
      <div v-if="memory.journals.length" class="collage-list">
        <div
          v-for="journal in memory.journals"
          :key="journal.id"
          class="collage-item"
        >
          <CollageCard :journal="journal" :trail="getTrailForJournal(journal)" />
          <div class="collage-actions">
            <button class="delete-btn" type="button" @click="askDelete(journal.id)">删除</button>
            <button
              class="share-btn"
              type="button"
              :disabled="sharingJournalId === journal.id"
              @click="shareToCommunity(journal)"
            >
              {{ shareDoneId === journal.id ? '已分享' : sharingJournalId === journal.id ? '分享中...' : '分享到营地' }}
            </button>
            <div v-if="pendingDeleteId === journal.id" class="delete-confirm">
              <span>确认删除？</span>
              <button class="delete-yes" type="button" @click="confirmDelete(journal.id)">确认</button>
              <button class="delete-cancel" type="button" @click="cancelDelete">取消</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-memories">
        <span class="empty-emoji">📖</span>
        <p>还没有记录下山野记忆</p>
        <p>去探索地图，开始你的第一次旅程吧</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ===== 页面容器 ===== */
.archive-page {
  padding: clamp(20px, 4vw, 40px) clamp(16px, 4vw, 40px) 100px;
  max-width: 720px;
  margin: 0 auto;
  background:
    radial-gradient(ellipse at 20% 10%, rgba(110, 231, 183, 0.12), transparent 35%),
    radial-gradient(ellipse at 70% 30%, rgba(147, 197, 253, 0.1), transparent 30%),
    linear-gradient(175deg, #f5faf8 0%, #f0f4ff 100%);
  min-height: 100vh;
}

/* ===== 英雄卡片 ===== */
.hero-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  border: 1.5px solid rgba(167, 243, 208, 0.35);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255,255,255,0.5) inset;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}
.hero-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6ee7b7, #7dd3fc, #c4b5fd);
}
.hero-avatar {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #a7f3d0 0%, #bae6fd 60%, #c4b5fd 100%);
  box-shadow: 0 0 0 4px rgba(110, 231, 183, 0.15), 0 6px 18px rgba(0,0,0,0.08);
  flex-shrink: 0;
}
.hero-emoji {
  font-size: 1.8rem;
}
.hero-body {
  flex: 1;
  min-width: 0;
}
.hero-label {
  margin: 0 0 2px;
  color: #64748b;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.hero-title {
  margin: 0 0 12px;
  color: #276749;
  font-size: 1.4rem;
  font-weight: 950;
  line-height: 1.2;
}
.hero-stats {
  display: flex;
  gap: 18px;
  margin-bottom: 10px;
}
.hero-stat {
  display: grid;
  gap: 1px;
}
.hero-stat strong {
  color: #276749;
  font-size: 1.1rem;
  line-height: 1;
}
.hero-stat span {
  color: #64748b;
  font-size: 0.65rem;
  font-weight: 800;
}
.hero-xp-bar {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  margin-bottom: 4px;
}
.hero-xp-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6ee7b7, #7dd3fc, #c4b5fd);
  transition: width 0.5s ease;
}
.hero-xp-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 0.65rem;
  font-weight: 700;
}

/* ===== 区块标题 ===== */
.section-title {
  margin: 0 0 14px;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 950;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 旅程地图 ===== */
.journey-section {
  margin-bottom: 28px;
  padding: 20px 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
}
.journey-map {
  display: grid;
  gap: 16px;
}
.journey-chapter {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chapter-header {
  width: 90px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.chapter-icon {
  font-size: 0.8rem;
  color: #94a3b8;
}
.journey-chapter.completed .chapter-icon {
  color: #276749;
}
.chapter-name {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}
.journey-chapter.completed .chapter-name {
  color: #276749;
}
.chapter-track {
  flex: 1;
  display: flex;
  gap: 4px;
}
.chapter-node {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  transition: background 0.3s;
}
.chapter-node.lit {
  background: linear-gradient(90deg, #6ee7b7, #7dd3fc);
  box-shadow: 0 0 6px rgba(110, 231, 183, 0.3);
}
.chapter-count {
  width: 30px;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
  text-align: right;
  flex-shrink: 0;
}

/* ===== 成就徽章 ===== */
.badges-section {
  margin-bottom: 28px;
  padding: 20px 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
}
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 8px;
}
.badge-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0.5;
  transition: all 0.2s;
}
.badge-card.earned {
  opacity: 1;
  border-color: rgba(167, 243, 208, 0.35);
  background: rgba(167, 243, 208, 0.1);
}
.badge-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
.badge-body { min-width: 0; }
.badge-body strong {
  display: block;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 950;
}
.badge-body small {
  display: block;
  color: #94a3b8;
  font-size: 0.65rem;
  font-weight: 800;
}
.badge-card.earned .badge-body strong { color: #276749; }

/* ===== 已探索区域 ===== */
.explored-section {
  margin-bottom: 28px;
  padding: 20px 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
}
.explored-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.explored-tag {
  padding: 4px 10px;
  border-radius: 999px;
  color: #276749;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(167, 243, 208, 0.25);
  border: 1px solid rgba(167, 243, 208, 0.3);
}
.explored-list {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
}
.explored-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 800;
}
.explored-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.15);
}
.explored-name { color: #334155; flex: 1; }
.explored-type { color: #94a3b8; font-size: 0.7rem; }
.toggle-btn {
  display: inline-block;
  padding: 6px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
}
.no-content {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 800;
}

/* ===== 回忆手账 ===== */
.memories-section {
  margin-bottom: 28px;
}
.collage-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.collage-item {
  position: relative;
}
.collage-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.delete-btn {
  padding: 4px 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
}
.delete-btn:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.share-btn {
  padding: 4px 10px;
  border: 1px solid rgba(110, 231, 183, 0.35);
  border-radius: 999px;
  color: #276749;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  background: rgba(167, 243, 208, 0.15);
  transition: all 0.2s;
}
.share-btn:hover { background: rgba(167, 243, 208, 0.3); }
.share-btn:disabled { opacity: 0.5; cursor: default; }
.delete-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
}
.delete-yes {
  padding: 2px 8px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  background: #ef4444;
}
.delete-cancel {
  padding: 2px 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 999px;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
}
.empty-memories {
  text-align: center;
  padding: 48px 20px;
  border: 2px dashed rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  color: #94a3b8;
}
.empty-emoji {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}
.empty-memories p {
  margin: 0 0 4px;
  font-size: 0.9rem;
  font-weight: 800;
}
.empty-memories p + p {
  font-size: 0.78rem;
  font-weight: 700;
}

/* ===== 响应式 ===== */
@media (max-width: 520px) {
  .hero-card {
    flex-direction: column;
    text-align: center;
    padding: 20px 16px;
  }
  .hero-stats {
    justify-content: center;
  }
  .collage-list {
    grid-template-columns: 1fr;
  }
  .badges-grid {
    grid-template-columns: 1fr 1fr;
  }
  .journey-chapter {
    flex-wrap: wrap;
  }
  .chapter-header {
    width: 100%;
  }
}
</style>