<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import TrailMap3D from '../components/TrailMap3D.vue'
import PixelTraveler from '../components/PixelTraveler.vue'
import { useMemoryStore } from '../stores/memoryStore'
import { useTravelerStore } from '../stores/travelerStore'

const router = useRouter()
const memory = useMemoryStore()
const traveler = useTravelerStore()
const selectedTrailId = ref(memory.trails[0]?.id ?? '')
const atlasOpen = ref(false)

const unlockedSet = computed(() => new Set(memory.unlockedTrailIds))
const growth = computed(() => memory.growthLevel)
const nextGap = computed(() => Math.max(0, growth.value.nextTarget - growth.value.current))
const chinaTrails = computed(() => memory.trails.filter((t) => t.scope === 'china'))
const globalTrails = computed(() => memory.trails.filter((t) => t.scope === 'global'))

// 路线预览弹窗
const showPreviewModal = ref(false)
const previewingTrail = ref(null)

function openTrailPreview(trail) {
  previewingTrail.value = trail
  showPreviewModal.value = true
}
function closeTrailPreview() {
  showPreviewModal.value = false
  previewingTrail.value = null
}
function startJourney() {
  if (previewingTrail.value) {
    router.push(`/journal/new?trailId=${previewingTrail.value.id}`)
  }
  closeTrailPreview()
}
function selectTrail(trail) {
  openTrailPreview(trail)
}
function previewTrail(trail) {
  selectedTrailId.value = trail.id
}
</script>

<template>
  <main class="adventure-scene">
    <!-- 3D 地球：全屏背景 -->
    <TrailMap3D
      class="adventure-globe"
      :trails="memory.trails"
      :unlocked-trail-ids="memory.unlockedTrailIds"
      :selected-trail-id="selectedTrailId"
      @select-trail="selectTrail"
    />

    <!-- 左上：旅人档案 -->
    <div class="traveler-profile">
      <PixelTraveler
        v-if="traveler.hasTraveler"
        :gender="traveler.gender"
        :identity="traveler.identity"
        :level="memory.unlockedCount"
        :size="56"
      />
      <div class="profile-level-ring" v-else>
        <span class="level-emoji">🌱</span>
      </div>
      <div class="profile-info">
        <p class="profile-eyebrow">旅人等级</p>
        <p class="profile-title">{{ growth.levelName }}</p>
        <div class="profile-xp-bar">
          <span :style="{ width: growth.progressPercent + '%' }"></span>
        </div>
        <p class="profile-hint" v-if="nextGap > 0">
          还需 {{ nextGap }} 次远行 → {{ growth.nextLevelName }}
        </p>
        <p class="profile-hint" v-else>你已经抵达山野之巅</p>
      </div>
    </div>

    <!-- 底部：当前任务卡 -->
    <div class="quest-card">
      <span class="quest-icon">📋</span>
      <div class="quest-body">
        <p class="quest-title">今日旅程</p>
        <p class="quest-desc" v-if="nextGap > 0">
          完成一次山野记录，向「{{ growth.nextLevelName }}」前进
        </p>
        <p class="quest-desc" v-else>你已经是最高的山野旅人，继续书写你的传奇</p>
      </div>
      <div class="quest-reward">
        <span>+{{ growth.current >= 12 ? '∞' : '1' }} 旅程经验</span>
      </div>
    </div>

    <!-- 右侧路线索引按钮 -->
    <button class="atlas-fab" type="button" :class="{ active: atlasOpen }" @click="atlasOpen = !atlasOpen">
      <span>🗺</span>
      <span class="fab-badge">{{ memory.unlockedCount }}</span>
    </button>

    <!-- 路线索引面板 -->
    <aside class="atlas-panel" :class="{ open: atlasOpen }">
      <div class="atlas-panel-header">
        <p class="eyebrow">探索节点</p>
        <h2>山野图鉴</h2>
        <button class="btn-close-panel" type="button" @click="atlasOpen = false">×</button>
      </div>
      <p class="atlas-hint">悬停预览 · 点击探索</p>

      <div class="atlas-scroll">
        <div class="atlas-group">
          <p class="atlas-group-title">国内秘境</p>
          <div class="atlas-chips">
            <button
              v-for="t in chinaTrails" :key="t.id"
              :class="['chip', { unlocked: unlockedSet.has(t.id), active: t.id === selectedTrailId }]"
              type="button"
              @mouseenter="previewTrail(t)" @focus="previewTrail(t)" @click="selectTrail(t)"
            >
              <span class="chip-dot"></span>{{ t.name }}
            </button>
          </div>
        </div>
        <div class="atlas-group">
          <p class="atlas-group-title">世界远方</p>
          <div class="atlas-chips">
            <button
              v-for="t in globalTrails" :key="t.id"
              :class="['chip global', { unlocked: unlockedSet.has(t.id), active: t.id === selectedTrailId }]"
              type="button"
              @mouseenter="previewTrail(t)" @focus="previewTrail(t)" @click="selectTrail(t)"
            >
              <span class="chip-dot"></span>{{ t.name }}
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 路线预览弹窗 -->
    <Teleport to="body">
      <div v-if="showPreviewModal && previewingTrail" class="preview-overlay" @click.self="closeTrailPreview">
        <div class="preview-modal">
          <p class="preview-label">{{ unlockedSet.has(previewingTrail.id) ? '✓ 已留下足迹' : '✦ 发现新路线' }}</p>
          <p class="preview-name">{{ previewingTrail.name }}</p>
          <p class="preview-chapter" v-if="previewingTrail.chapter">{{ previewingTrail.chapter }}</p>
          <p class="preview-story" v-if="previewingTrail.storyTag">{{ previewingTrail.storyTag }}</p>
          <p class="preview-quote" v-if="previewingTrail.quote">{{ previewingTrail.quote }}</p>
          <div class="preview-meta-row">
            <span class="preview-meta" v-if="previewingTrail.difficulty">{{ previewingTrail.difficulty }}</span>
            <span class="preview-meta" v-if="previewingTrail.distanceKm">{{ previewingTrail.distanceKm }}km</span>
          </div>
          <button class="preview-start-btn" type="button" @click="startJourney">
            {{ unlockedSet.has(previewingTrail.id) ? '再次记录这段旅程' : '开始探索' }}
          </button>
          <button class="preview-close-btn" type="button" @click="closeTrailPreview">返回地图</button>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
/* ===== 冒险场景容器 ===== */
.adventure-scene {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(110, 231, 183, 0.18), transparent 40%),
    radial-gradient(ellipse at 80% 25%, rgba(147, 197, 253, 0.16), transparent 38%),
    radial-gradient(ellipse at 50% 80%, rgba(196, 181, 253, 0.12), transparent 36%),
    linear-gradient(160deg, #c8f0e0 0%, #eef7f5 42%, #f0f4ff 100%);
}

.adventure-globe,
.adventure-scene :deep(.trail-map-3d) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/* ===== 旅人档案 ===== */
.traveler-profile {
  position: absolute;
  top: clamp(16px, 3vh, 28px);
  left: clamp(16px, 3vw, 36px);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 240px;
  padding: 12px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}
.traveler-profile:hover {
  transform: translateY(-2px);
}
.profile-level-ring {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #a7f3d0, #bae6fd);
  box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.2), 0 4px 12px rgba(0,0,0,0.08);
  flex-shrink: 0;
}
.level-emoji {
  font-size: 1.4rem;
}
.profile-info {
  flex: 1;
  min-width: 0;
}
.profile-eyebrow {
  margin: 0 0 1px;
  color: #64748b;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.profile-title {
  margin: 0 0 4px;
  color: #276749;
  font-size: 0.95rem;
  font-weight: 950;
  line-height: 1.2;
}
.profile-xp-bar {
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  margin-bottom: 3px;
}
.profile-xp-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6ee7b7, #7dd3fc);
  transition: width 0.5s ease;
}
.profile-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 0.6rem;
  font-weight: 700;
}

/* ===== 当前任务卡 ===== */
.quest-card {
  position: absolute;
  left: 50%;
  bottom: clamp(16px, 3vh, 28px);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  width: calc(100vw - 48px);
  padding: 10px 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
  transform: translateX(-50%);
}
.quest-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}
.quest-body {
  flex: 1;
  min-width: 0;
}
.quest-title {
  margin: 0 0 2px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 950;
}
.quest-desc {
  margin: 0;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.4;
}
.quest-reward {
  flex-shrink: 0;
}
.quest-reward span {
  padding: 4px 8px;
  border-radius: 999px;
  color: #276749;
  font-size: 0.65rem;
  font-weight: 900;
  background: rgba(167, 243, 208, 0.45);
}

/* ===== 路线索引浮钮 ===== */
.atlas-fab {
  position: absolute;
  right: clamp(16px, 3vw, 36px);
  bottom: clamp(72px, 10vh, 90px);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  color: #475569;
  font-size: 1.1rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  justify-content: center;
  transition: all 0.2s;
  overflow: hidden;
}
.atlas-fab:hover,
.atlas-fab.active {
  width: auto;
  padding: 0 14px 0 10px;
  border-radius: 999px;
  color: #276749;
  background: rgba(167, 243, 208, 0.25);
  border-color: rgba(110, 231, 183, 0.4);
}
.fab-badge {
  display: none;
  padding: 1px 6px;
  border-radius: 999px;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 900;
  background: #7dd3fc;
}
.atlas-fab:hover .fab-badge,
.atlas-fab.active .fab-badge {
  display: grid;
}

/* ===== 路线索引面板 ===== */
.atlas-panel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 15;
  display: flex;
  flex-direction: column;
  width: min(340px, 85vw);
  height: 100vh;
  padding: clamp(20px, 4vh, 36px) clamp(18px, 3vw, 28px);
  border-left: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.06);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}
.atlas-panel.open { transform: translateX(0); }
.atlas-panel-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}
.atlas-panel-header .eyebrow { margin: 0; }
.atlas-panel-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1.6rem;
}
.btn-close-panel {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: #64748b;
  font-size: 1.4rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}
.atlas-hint {
  margin: 0 0 16px;
  color: #94a3b8;
  font-size: 0.82rem;
}
.atlas-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
.atlas-scroll::-webkit-scrollbar { width: 4px; }
.atlas-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.3);
}
.atlas-group { margin-bottom: 20px; }
.atlas-group-title {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.atlas-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.6);
}
.chip:hover {
  border-color: rgba(148, 163, 184, 0.5);
  background: rgba(255, 255, 255, 0.85);
}
.chip.active {
  color: #276749;
  border-color: #6ee7b7;
  background: rgba(167, 243, 208, 0.18);
}
.chip.unlocked { color: #276749; }
.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
  background: #93c5fd;
}
.chip.global .chip-dot { background: #60a5fa; }
.chip.unlocked .chip-dot {
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.15);
}
.chip.active .chip-dot {
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.2);
}

/* ===== 路线预览弹窗 ===== */
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}
.preview-modal {
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
}
@keyframes modalPop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.preview-label {
  margin: 0 0 8px;
  color: #276749;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
}
.preview-name {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 1.4rem;
  font-weight: 950;
}
.preview-chapter {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}
.preview-story {
  margin: 0 0 6px;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 800;
}
.preview-quote {
  margin: 0 0 14px;
  color: #94a3b8;
  font-size: 0.82rem;
  font-style: italic;
}
.preview-meta-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
}
.preview-meta {
  padding: 4px 10px;
  border-radius: 999px;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 800;
  background: rgba(148, 163, 184, 0.12);
}
.preview-start-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  margin-bottom: 8px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 900;
  cursor: pointer;
  background: linear-gradient(135deg, #6ee7b7, #7dd3fc);
  transition: all 0.2s;
}
.preview-start-btn:hover { opacity: 0.85; transform: translateY(-1px); }
.preview-close-btn {
  display: block;
  width: 100%;
  padding: 8px 0;
  border: 0;
  border-radius: 999px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
}
.preview-close-btn:hover { color: #334155; }

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .traveler-profile {
    max-width: 200px;
    padding: 10px 12px;
  }
  .profile-level-ring {
    width: 36px;
    height: 36px;
  }
  .profile-title { font-size: 0.82rem; }
  .quest-card {
    max-width: 280px;
    padding: 8px 12px;
  }
  .quest-title { font-size: 0.7rem; }
  .quest-desc { font-size: 0.62rem; }
  .atlas-panel { width: 100vw; }
  .atlas-fab {
    right: 12px;
    bottom: 80px;
  }
}
</style>