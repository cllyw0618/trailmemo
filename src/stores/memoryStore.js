import { defineStore } from 'pinia'
import { trails } from '../data/trails'
import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { useAuthStore } from './authStore'

const LEVELS = [
  { min: 0, name: '山野新手' },
  { min: 1, name: '初入山野' },
  { min: 3, name: '草甸行者' },
  { min: 5, name: '峡谷探索者' },
  { min: 8, name: '雪山旅人' },
  { min: 12, name: '远方收藏家' },
  { min: 16, name: '地球漫游者' },
]

function toJournal(row) {
  return {
    id: row.id,
    trailId: row.trail_id,
    title: row.title || '',
    mood: row.mood || '',
    weather: row.weather || '',
    text: row.text || '',
    images: Array.isArray(row.images) ? row.images : [],
    template: row.template || 't1',
    createdAt: row.created_at || new Date().toISOString(),
  }
}

function toJournalRow(journal, userId) {
  return {
    user_id: userId,
    trail_id: journal.trailId,
    title: journal.title || '',
    mood: journal.mood || '',
    weather: journal.weather || '',
    text: journal.text || '',
    images: journal.images || [],
    template: journal.template || 't1',
  }
}

export const useMemoryStore = defineStore('memory', {
  state: () => ({
    trails,
    journals: [],
    unlockedTrailIds: [],
    loading: false,
  }),
  getters: {
    unlockedCount: (state) => state.unlockedTrailIds.length,
    journalCount: (state) => state.journals.length,
    totalDistanceKm: (state) => state.trails
      .filter((trail) => state.unlockedTrailIds.includes(trail.id))
      .reduce((sum, trail) => sum + trail.distanceKm, 0),

    growthLevel: (state) => {
      const count = state.unlockedTrailIds.length
      let currentLevel = LEVELS[0]
      let nextLevel = null
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (count >= LEVELS[i].min) {
          currentLevel = LEVELS[i]
          if (i < LEVELS.length - 1) nextLevel = LEVELS[i + 1]
          break
        }
      }
      if (!nextLevel) nextLevel = currentLevel
      const current = count
      const nextTarget = nextLevel.min
      const prevTarget = currentLevel.min
      const range = nextTarget - prevTarget
      const progressPercent = Math.min(100, Math.round(((count - prevTarget) / (range || 1)) * 100))
      return {
        levelName: currentLevel.name,
        current,
        nextTarget,
        progressPercent,
        nextLevelName: nextLevel.name,
      }
    },

    achievementTypeStats: (state) => {
      const stats = {}
      state.trails.forEach((t) => {
        if (state.unlockedTrailIds.includes(t.id) && t.achievementType) {
          stats[t.achievementType] = (stats[t.achievementType] || 0) + 1
        }
      })
      return stats
    },

    chapterProgress: (state) => {
      const chapterMap = {}
      state.trails.forEach((t) => {
        if (!t.chapter) return
        if (!chapterMap[t.chapter]) chapterMap[t.chapter] = { total: 0, unlocked: 0 }
        chapterMap[t.chapter].total++
        if (state.unlockedTrailIds.includes(t.id)) chapterMap[t.chapter].unlocked++
      })
      return Object.entries(chapterMap).map(([name, data]) => ({
        chapterName: name,
        unlocked: data.unlocked,
        total: data.total,
      }))
    },
  },
  actions: {
    async loadUserData() {
      const auth = useAuthStore()
      const userId = auth.currentUserId
      if (!hasSupabaseConfig || !userId) return

      this.loading = true
      try {
        const [{ data: unlocked, error: unlockedError }, { data: journals, error: journalsError }] = await Promise.all([
          supabase.from('unlocked_trails').select('trail_id').eq('user_id', userId),
          supabase.from('journals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ])
        if (unlockedError) throw new Error(unlockedError.message)
        if (journalsError) throw new Error(journalsError.message)
        this.unlockedTrailIds = (unlocked || []).map((item) => item.trail_id)
        this.journals = (journals || []).map(toJournal)
      } finally {
        this.loading = false
      }
    },

    async unlockTrail(trailId) {
      const auth = useAuthStore()
      const isNew = !this.unlockedTrailIds.includes(trailId)
      if (isNew) this.unlockedTrailIds.push(trailId)

      if (hasSupabaseConfig && auth.currentUserId) {
        const { error } = await supabase
          .from('unlocked_trails')
          .upsert({ user_id: auth.currentUserId, trail_id: trailId }, { onConflict: 'user_id,trail_id' })
        if (error) throw new Error(error.message)
      }
      return isNew
    },

    async addJournal(journal) {
      const auth = useAuthStore()
      const isNewlyUnlocked = !this.unlockedTrailIds.includes(journal.trailId)
      const localJournal = {
        id: `journal-${Date.now()}`,
        createdAt: new Date().toISOString(),
        images: [],
        template: 't1',
        ...journal,
      }
      this.journals.unshift(localJournal)
      await this.unlockTrail(journal.trailId)

      if (hasSupabaseConfig && auth.currentUserId) {
        const { data, error } = await supabase
          .from('journals')
          .insert(toJournalRow(localJournal, auth.currentUserId))
          .select('*')
          .single()
        if (error) throw new Error(error.message)
        const index = this.journals.findIndex((item) => item.id === localJournal.id)
        if (index >= 0) this.journals.splice(index, 1, toJournal(data))
      }
      return isNewlyUnlocked
    },

    async deleteJournal(journalId) {
      const auth = useAuthStore()
      this.journals = this.journals.filter((journal) => journal.id !== journalId)
      if (hasSupabaseConfig && auth.currentUserId && !journalId.startsWith('journal-')) {
        const { error } = await supabase
          .from('journals')
          .delete()
          .eq('id', journalId)
          .eq('user_id', auth.currentUserId)
        if (error) throw new Error(error.message)
      }
    },
  },
})