<script setup>
import { computed } from 'vue'

const props = defineProps({
  journal: { type: Object, required: true },
  trail: { type: Object, default: null },
})

const template = computed(() => props.journal.template || 't4')
const images = computed(() => props.journal.images || [])

const rotations = computed(() => {
  const angles = [-1.4, 1.7, -0.9, 1.2]
  return images.value.map((_, index) => angles[index % angles.length] + index * 0.2)
})

const titleText = computed(() => props.journal.title?.trim() || '山野手账')
const bodyText = computed(() => props.journal.text?.trim() || '写下你走过的路、看见的风景，还有那一刻的心情。')
const moodText = computed(() => props.journal.mood?.trim() || '心情')
const weatherText = computed(() => props.journal.weather?.trim() || '天气')
const metaLine = computed(() => `${moodText.value} · ${weatherText.value}`)
const shortBody = computed(() => bodyText.value.length > 34 ? `${bodyText.value.slice(0, 34)}...` : bodyText.value)

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <article class="collage-card" :class="`template-${template}`">
    <div class="tape tape-tl"></div>
    <div class="tape tape-tr"></div>

    <div v-if="template === 't1'" class="collage-grid one-layout">
      <div v-if="images[0]" class="img-wrapper photo-main" :style="{ transform: `rotate(${rotations[0]}deg)` }">
        <img :src="images[0]" alt="" />
      </div>
      <div v-else class="empty-photo photo-main">照片 1</div>
      <section class="text-block centered-copy">
        <span class="date-text">{{ formatDate(journal.createdAt) }}</span>
        <h3>{{ titleText }}</h3>
        <p class="meta-text">{{ metaLine }}</p>
        <p>{{ bodyText }}</p>
      </section>
    </div>

    <div v-else-if="template === 't2'" class="collage-grid two-layout">
      <div v-if="images[0]" class="img-wrapper photo-main" :style="{ transform: `rotate(${rotations[0]}deg)` }">
        <img :src="images[0]" alt="" />
      </div>
      <div v-else class="empty-photo photo-main">照片 1</div>
      <div v-if="images[1]" class="img-wrapper photo-side" :style="{ transform: `rotate(${rotations[1]}deg)` }">
        <img :src="images[1]" alt="" />
      </div>
      <div v-else class="empty-photo photo-side">照片 2</div>
      <section class="text-block note-block">
        <span class="date-text">{{ formatDate(journal.createdAt) }}</span>
        <h3>{{ titleText }}</h3>
        <p class="meta-text">{{ metaLine }}</p>
        <p>{{ shortBody }}</p>
      </section>
    </div>

    <div v-else-if="template === 't3'" class="three-layout">
      <div v-for="index in 3" :key="index" class="photo-slot" :class="`photo-${index}`">
        <div v-if="images[index - 1]" class="img-wrapper" :style="{ transform: `rotate(${rotations[index - 1]}deg)` }">
          <img :src="images[index - 1]" alt="" />
        </div>
        <div v-else class="empty-photo">照片 {{ index }}</div>
      </div>
      <section class="floating-copy copy-title">
        <h3>{{ titleText }}</h3>
        <p class="meta-text">{{ metaLine }}</p>
      </section>
      <section class="floating-copy copy-body">
        <p>{{ shortBody }}</p>
      </section>
    </div>

    <div v-else class="four-layout">
      <div v-for="index in 4" :key="index" class="photo-slot" :class="`photo-${index}`">
        <div v-if="images[index - 1]" class="img-wrapper" :style="{ transform: `rotate(${rotations[index - 1]}deg)` }">
          <img :src="images[index - 1]" alt="" />
        </div>
        <div v-else class="empty-photo">照片 {{ index }}</div>
      </div>
      <section class="paper-note">
        <span class="date-text">{{ formatDate(journal.createdAt) }}</span>
        <h3>{{ titleText }}</h3>
        <p class="meta-text">{{ metaLine }}</p>
        <p>{{ shortBody }}</p>
      </section>
    </div>

    <!-- 回忆卡：路线故事信息 -->
    <footer v-if="trail" class="trail-footnote">
      <span class="footnote-chapter" v-if="trail.chapter">{{ trail.chapter }}</span>
      <span class="footnote-sep" v-if="trail.chapter && trail.moodKeyword">·</span>
      <span class="footnote-mood" v-if="trail.moodKeyword">{{ trail.moodKeyword }}</span>
      <span class="footnote-quote" v-if="trail.quote">{{ trail.quote }}</span>
    </footer>
  </article>
</template>

<style scoped>
.collage-card {
  position: relative;
  overflow: hidden;
  min-height: 470px;
  border-radius: 20px;
  padding: 22px;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.9), transparent 22%),
    linear-gradient(135deg, #f8f4e7 0%, #fbfaf3 50%, #eef8fa 100%);
  box-shadow: 0 8px 30px rgba(71, 85, 105, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.collage-card::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.18;
  background-image:
    linear-gradient(90deg, rgba(74, 93, 104, 0.06) 1px, transparent 1px),
    linear-gradient(rgba(74, 93, 104, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.collage-grid,
.one-layout,
.two-layout,
.three-layout,
.four-layout {
  position: relative;
  z-index: 1;
}

.collage-grid {
  display: grid;
  gap: 16px;
}

.img-wrapper,
.empty-photo {
  overflow: hidden;
  min-height: 90px;
  border: 6px solid rgba(255, 255, 255, 0.96);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 8px 20px rgba(68, 88, 98, 0.14);
}

.img-wrapper img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-photo {
  display: grid;
  place-items: center;
  color: rgba(76, 96, 108, 0.55);
  font-family: var(--tm-display-font);
  font-weight: 950;
  background:
    linear-gradient(35deg, #8cac8f 0 34%, #ddeacb 34% 58%, #b8e4f2 58% 100%);
}

.one-layout .photo-main {
  min-height: 215px;
}

.centered-copy {
  text-align: center;
}

.two-layout {
  display: grid;
  grid-template-columns: 0.98fr 0.92fr;
  grid-template-areas:
    'main note'
    'main side';
  gap: 16px;
}

.two-layout .photo-main { grid-area: main; min-height: 330px; }
.two-layout .photo-side { grid-area: side; min-height: 170px; }
.two-layout .note-block { grid-area: note; }

.three-layout,
.four-layout {
  min-height: 460px;
}

.photo-slot {
  position: absolute;
}

.photo-slot .img-wrapper,
.photo-slot .empty-photo {
  width: 100%;
  height: 100%;
}

.three-layout .photo-1 { top: 0; left: 4%; width: 44%; height: 170px; }
.three-layout .photo-2 { top: 120px; right: 2%; width: 46%; height: 168px; }
.three-layout .photo-3 { bottom: 0; left: 8%; width: 40%; height: 145px; }

.floating-copy,
.paper-note,
.text-block {
  color: #304957;
  font-family: var(--tm-display-font);
}

.floating-copy {
  position: absolute;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 10px 24px rgba(88, 118, 132, 0.1);
}

.copy-title { top: 24px; right: 2%; width: 42%; }
.copy-body { right: 2%; bottom: 22px; width: 42%; }

.four-layout .photo-1 { top: 0; left: 2%; width: 38%; height: 165px; }
.four-layout .photo-2 { top: 18px; right: 2%; width: 34%; height: 185px; }
.four-layout .photo-3 { bottom: 0; left: 8%; width: 40%; height: 145px; }
.four-layout .photo-4 { bottom: 24px; right: 4%; width: 34%; height: 128px; }

.paper-note {
  position: absolute;
  left: 8%;
  right: 10%;
  top: 198px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.64);
  box-shadow: 0 10px 24px rgba(88, 118, 132, 0.12);
}

h3 {
  margin: 0 0 8px;
  color: #304957;
  font-size: 1.28rem;
  font-weight: 950;
  line-height: 1.35;
}

p {
  margin: 0;
  color: #536774;
  font-size: 0.95rem;
  font-weight: 850;
  line-height: 1.8;
}

.meta-text {
  margin-bottom: 8px;
  color: rgba(58, 87, 101, 0.72);
  font-size: 0.82rem;
  font-weight: 950;
}

.date-text {
  display: inline-block;
  margin-bottom: 8px;
  color: rgba(61, 76, 86, 0.72);
  font-family: Georgia, serif;
  font-size: 0.95rem;
  font-weight: 800;
}

.tape {
  position: absolute;
  z-index: 2;
  width: 44px;
  height: 13px;
  border-radius: 2px;
  opacity: 0.72;
  background: rgba(221, 238, 245, 0.82);
  box-shadow: 0 1px 4px rgba(68, 88, 98, 0.1);
}

.tape-tl { top: 10px; left: 28px; transform: rotate(-8deg); }
.tape-tr { top: 12px; right: 32px; transform: rotate(10deg); }

/* 回忆卡：路线故事脚注 */
.trail-footnote {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  align-items: center;
  margin-top: 14px;
  padding: 8px 10px 6px;
  border-top: 1px dashed rgba(148, 163, 184, 0.25);
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: #64748b;
}
.footnote-chapter {
  color: #276749;
  font-size: 0.68rem;
}
.footnote-sep {
  color: #cbd5e1;
}
.footnote-mood {
  color: #7c3aed;
  font-size: 0.68rem;
}
.footnote-quote {
  width: 100%;
  margin-top: 2px;
  font-style: italic;
  font-size: 0.68rem;
  color: #94a3b8;
}

@media (max-width: 520px) {
  .two-layout {
    grid-template-columns: 1fr;
    grid-template-areas: 'main' 'side' 'note';
  }

  .three-layout,
  .four-layout {
    min-height: 500px;
  }
}
</style>

