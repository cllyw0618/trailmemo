<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMemoryStore } from '../stores/memoryStore'

const route = useRoute()
const memory = useMemoryStore()
const note = ref('')

const trail = computed(() => memory.trails.find((item) => item.id === route.params.id))
const isUnlocked = computed(() => trail.value ? memory.unlockedTrailIds.includes(trail.value.id) : false)
const journals = computed(() => memory.journals.filter((journal) => journal.trailId === trail.value?.id))

async function unlockTrail() {
  if (!trail.value) return
  await memory.unlockTrail(trail.value.id)
}

async function saveJournal() {
  if (!trail.value || !note.value.trim()) return
  await memory.addJournal({
    trailId: trail.value.id,
    title: `${trail.value.name} · 电子手账`,
    mood: '山野记录',
    weather: '待补充天气',
    text: note.value.trim(),
  })
  note.value = ''
}
</script>

<template>
  <main v-if="trail" class="trail-journal-page" :style="{ '--cover-a': trail.coverGradient[0], '--cover-b': trail.coverGradient[1] }">
    <RouterLink class="journal-back" to="/map">×</RouterLink>

    <section class="journal-hero">
      <div class="journal-cover-orb">
        <span>{{ trail.scope === 'china' ? 'CN' : '🌍' }}</span>
      </div>
      <div class="journal-title-block">
        <p class="eyebrow">{{ trail.scope === 'china' ? 'China Trail' : 'World Trail' }} · {{ trail.region }}</p>
        <h1>{{ trail.name }}</h1>
        <p>{{ trail.province }} · {{ trail.city }} · {{ trail.type }}</p>
      </div>
      <button class="primary-action" type="button" @click="unlockTrail">
        {{ isUnlocked ? '已点亮' : '点亮这个小点' }}
      </button>
    </section>

    <section class="journal-grid-layout">
      <article class="journal-story-sheet">
        <span class="chapter-label">Trail Story</span>
        <h2>路线记忆</h2>
        <p>{{ trail.story }}</p>
        <div class="story-tags">
          <span v-for="tag in trail.tags" :key="tag">{{ tag }}</span>
        </div>
        <div class="story-facts">
          <span>{{ trail.difficulty }}</span>
          <span>{{ trail.distanceKm }} km</span>
          <span>{{ trail.duration }}</span>
        </div>
      </article>

      <article class="journal-photo-wall">
        <span class="chapter-label">Photo Notes</span>
        <h2>照片记录</h2>
        <div class="photo-grid">
          <div v-for="item in 6" :key="item" class="photo-placeholder">
            <span>{{ item }}</span>
          </div>
        </div>
        <p>这里后续可以接照片上传；答辩阶段先作为电子手账照片墙展示位。</p>
      </article>

      <article class="journal-editor-panel">
        <span class="chapter-label">Memory Input</span>
        <h2>写下这条路线的记忆</h2>
        <p>{{ trail.journalPrompt }}</p>
        <textarea v-model="note" rows="5" placeholder="写一句属于这条路线的手账记录..."></textarea>
        <button class="primary-action" type="button" @click="saveJournal">保存到电子手账</button>
      </article>

      <article class="journal-memory-list">
        <span class="chapter-label">Memory Cards</span>
        <h2>我的记录</h2>
        <div v-if="journals.length" class="memory-shards page-shards">
          <article v-for="journal in journals" :key="journal.id" class="memory-shard">
            <strong>{{ journal.title }}</strong>
            <p>{{ journal.text }}</p>
          </article>
        </div>
        <p v-else class="empty-shard">还没有记录。点亮后写下第一张手账碎片吧。</p>
      </article>
    </section>
  </main>

  <main v-else class="page-pad">
    <h1>没有找到这个徒步地点</h1>
    <RouterLink class="primary-action" to="/map">返回地图</RouterLink>
  </main>
</template>
