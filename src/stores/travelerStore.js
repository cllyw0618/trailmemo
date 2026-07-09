/**
 * travelerStore.js — 旅人数据管理
 * 管理像素旅人的外观、装备、等级表现
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTravelerStore = defineStore('traveler', () => {
  // 旅人基本信息
  const gender = ref('male')       // male | female
  const identity = ref('forest')   // forest | coast | mountain

  // 已解锁装备列表
  const unlockedEquipment = ref([])

  // 装备等级映射
  const identityNames = {
    forest: '森林新人',
    coast: '海岸旅人',
    mountain: '山峰探索者',
  }

  const identityDescriptions = {
    forest: '来自密林的探索者，与树木和溪流为伴',
    coast: '追逐海浪的旅人，收藏着每一片贝壳',
    mountain: '向往高峰的攀登者，云层之上是归宿',
  }

  /** 初始化旅人 */
  function createTraveler(g, id) {
    gender.value = g
    identity.value = id
    unlockedEquipment.value = []
  }

  /** 检查是否已创建旅人 */
  const hasTraveler = computed(() => !!gender.value && !!identity.value)

  return {
    gender,
    identity,
    unlockedEquipment,
    identityNames,
    identityDescriptions,
    createTraveler,
    hasTraveler,
  }
})