import { defineStore } from 'pinia'
import { trails } from '../data/trails'

/**
 * 成长等级规则
 * 0→山野新手  1→初入山野  3→草甸行者  5→峡谷探索者
 * 8→雪山旅人  12→远方收藏家  16+→地球漫游者
 */
const LEVELS = [
  { min: 0, name: '山野新手' },
  { min: 1, name: '初入山野' },
  { min: 3, name: '草甸行者' },
  { min: 5, name: '峡谷探索者' },
  { min: 8, name: '雪山旅人' },
  { min: 12, name: '远方收藏家' },
  { min: 16, name: '地球漫游者' },
]

export const useMemoryStore = defineStore('memory', {
  state: () => ({
    trails,
    journals: [],
    unlockedTrailIds: [],
  }),
  getters: {
    unlockedCount: (state) => state.unlockedTrailIds.length,
    journalCount: (state) => state.journals.length,
    totalDistanceKm: (state) => state.trails
      .filter((trail) => state.unlockedTrailIds.includes(trail.id))
      .reduce((sum, trail) => sum + trail.distanceKm, 0),

    /** 成长等级：返回当前等级名称、进度、下一级目标 */
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
      // 如果当前是最高等级，nextLevel 取自身
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

    /** 按 achievementType 统计已解锁路线数量 */
    achievementTypeStats: (state) => {
      const stats = {}
      state.trails.forEach((t) => {
        if (state.unlockedTrailIds.includes(t.id) && t.achievementType) {
          stats[t.achievementType] = (stats[t.achievementType] || 0) + 1
        }
      })
      return stats
    },

    /** 各章节进度：{ chapterName, unlocked, total } */
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
    unlockTrail(trailId) {
      if (!this.unlockedTrailIds.includes(trailId)) {
        this.unlockedTrailIds.push(trailId)
        return true // 首次解锁
      }
      return false // 已解锁过
    },
    addJournal(journal) {
      const isNewlyUnlocked = !this.unlockedTrailIds.includes(journal.trailId)
      this.journals.unshift({
        id: `journal-${Date.now()}`,
        createdAt: new Date().toISOString(),
        images: [],
        template: 't1',
        ...journal,
      })
      this.unlockTrail(journal.trailId)
      return isNewlyUnlocked
    },
    deleteJournal(journalId) {
      this.journals = this.journals.filter((journal) => journal.id !== journalId)
    },
  },
})
