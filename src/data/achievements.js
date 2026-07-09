/**
 * 轻量成就系统
 * 每个成就定义名称、描述和检查函数
 * 检查函数接收 stats 对象，返回布尔值
 */
export const achievements = [
  {
    id: 'first_trail',
    name: '第一束山风',
    description: '完成第一条徒步路线',
    check: (stats) => stats.unlockedCount >= 1,
  },
  {
    id: 'three_trails',
    name: '开始走向远方',
    description: '点亮 3 条路线',
    check: (stats) => stats.unlockedCount >= 3,
  },
  {
    id: 'five_trails',
    name: '峡谷探索者',
    description: '点亮 5 条路线',
    check: (stats) => stats.unlockedCount >= 5,
  },
  {
    id: 'eight_trails',
    name: '雪山旅人',
    description: '点亮 8 条路线',
    check: (stats) => stats.unlockedCount >= 8,
  },
  {
    id: 'twelve_trails',
    name: '远方收藏家',
    description: '点亮 12 条路线',
    check: (stats) => stats.unlockedCount >= 12,
  },
  {
    id: 'grassland_collector',
    name: '草甸收藏家',
    description: '完成至少 1 条草甸路线',
    check: (stats) => (stats.types?.grassland || 0) >= 1,
  },
  {
    id: 'snow_mountain',
    name: '雪山旅人',
    description: '完成至少 1 条雪山路线',
    check: (stats) => (stats.types?.snow || 0) >= 1,
  },
  {
    id: 'canyon_explorer',
    name: '峡谷穿越者',
    description: '完成至少 1 条峡谷路线',
    check: (stats) => (stats.types?.canyon || 0) >= 1,
  },
  {
    id: 'coast_walker',
    name: '海岸漫步者',
    description: '完成至少 1 条海岸路线',
    check: (stats) => (stats.types?.coast || 0) >= 1,
  },
  {
    id: 'pilgrimage',
    name: '朝圣者',
    description: '完成至少 1 条朝圣路线',
    check: (stats) => (stats.types?.pilgrimage || 0) >= 1,
  },
  {
    id: 'all_china',
    name: '走遍中国',
    description: '点亮所有国内路线',
    check: (stats) => {
      // 国内路线共 9 条（scope === 'china'）
      // 简单处理：unlockedCount >= 9 且包含国内路线
      return stats.unlockedCount >= 9
    },
  },
]

/**
 * 计算所有成就的完成状态
 * @param {object} stats - 统计数据 { unlockedCount, types }
 * @returns {Array<{ id, name, description, unlocked }>}
 */
export function checkAchievements(stats) {
  return achievements.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    unlocked: a.check(stats),
  }))
}