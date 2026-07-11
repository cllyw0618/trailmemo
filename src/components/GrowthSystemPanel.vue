<script setup>
import { computed, ref, watch } from 'vue'
import PixelTraveler from './PixelTraveler.vue'

const props = defineProps({
  unlockedCount: { type: Number, default: 0 },
  initialGender: { type: String, default: 'female' },
  identity: { type: String, default: 'forest' },
})

const previewGender = ref(props.initialGender || 'female')

watch(
  () => props.initialGender,
  (gender) => {
    if (gender) previewGender.value = gender
  }
)

const stages = [
  {
    min: 0,
    level: 1,
    badge: 'Lv.1',
    title: '山野新人',
    tone: 'sage',
    equipmentTitle: '初始装备',
    equipment: [
      { icon: 'Jacket', label: '普通服饰' },
      { icon: 'Pack', label: '小背包' },
    ],
  },
  {
    min: 3,
    level: 3,
    badge: 'Lv.3',
    title: '草甸行者',
    tone: 'meadow',
    equipmentTitle: '解锁装备',
    equipment: [
      { icon: 'Hat', label: '遮阳帽' },
      { icon: 'Boot', label: '徒步鞋' },
    ],
  },
  {
    min: 5,
    level: 5,
    badge: 'Lv.5',
    title: '峡谷探索者',
    tone: 'river',
    equipmentTitle: '解锁装备',
    equipment: [
      { icon: 'Coat', label: '冲锋衣' },
      { icon: 'Map', label: '地图' },
    ],
  },
  {
    min: 8,
    level: 8,
    badge: 'Lv.8',
    title: '雪山旅人',
    tone: 'snow',
    equipmentTitle: '解锁装备',
    equipment: [
      { icon: 'Pole', label: '登山杖' },
      { icon: 'Scarf', label: '保暖围巾' },
    ],
  },
  {
    min: 12,
    level: 12,
    badge: 'Lv.12',
    title: '远方收藏家',
    tone: 'rose',
    equipmentTitle: '解锁装备',
    equipment: [
      { icon: 'Pin', label: '探险徽章' },
      { icon: 'PackPlus', label: '高级背包' },
    ],
  },
  {
    min: 16,
    level: 16,
    badge: 'Lv.16+',
    title: '地球漫游者',
    tone: 'gold',
    equipmentTitle: '解锁装备',
    equipment: [
      { icon: 'Globe', label: '地球徽章' },
      { icon: 'LegendPack', label: '传奇背包' },
    ],
  },
]

const hatItems = [
  { icon: 'Headphone', active: true },
  { icon: 'Hat' },
  { icon: 'Cap' },
  { icon: 'SnowHat' },
  { icon: 'ExplorerHat' },
]

const clothesItems = [
  { icon: 'Jacket', active: true },
  { icon: 'GreenCoat' },
  { icon: 'Coat' },
  { icon: 'PurpleCoat' },
  { icon: 'PinkCoat' },
  { icon: 'LegendCoat' },
]

const packItems = [
  { icon: 'Pack', active: true },
  { icon: 'MidPack' },
  { icon: 'BigPack' },
  { icon: 'PurplePack' },
  { icon: 'GoldPack' },
  { icon: 'LegendPack' },
]

const shoeItems = [
  { icon: 'Sneaker', active: true },
  { icon: 'Boot' },
  { icon: 'MidBoot' },
  { icon: 'HighBoot' },
  { icon: 'LegendBoot' },
]

const currentStage = computed(() => {
  return [...stages].reverse().find((stage) => props.unlockedCount >= stage.min) || stages[0]
})

function isUnlocked(stage) {
  return stage.min === 0 || props.unlockedCount >= stage.min
}
</script>

<template>
  <section class="growth-system-card">
    <header class="growth-header">
      <p class="leaf-line"><span></span>山野旅人 · 成长系统<span></span></p>
      <h2>山野旅人 · 成长系统</h2>
      <p>你的旅人，与你同行，探索世界每一角</p>
    </header>

    <div class="level-card-grid">
      <article
        v-for="stage in stages"
        :key="stage.badge"
        class="level-card"
        :class="[stage.tone, { locked: !isUnlocked(stage), current: currentStage.badge === stage.badge }]"
      >
        <span class="level-badge">{{ stage.badge }}</span>
        <h3>{{ stage.title }}</h3>
        <div class="traveler-stage">
          <PixelTraveler
            :gender="previewGender"
            :identity="identity"
            :level="stage.level"
            :size="118"
          />
          <span v-if="!isUnlocked(stage)" class="lock-hint">还差 {{ stage.min - unlockedCount }} 处</span>
        </div>
        <div class="equipment-card">
          <strong>{{ stage.equipmentTitle }}</strong>
          <div class="equipment-items">
            <div v-for="item in stage.equipment" :key="item.label" class="equipment-item">
              <span class="gear-icon" :data-icon="item.icon"></span>
              <small>{{ item.label }}</small>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div class="growth-lower-grid">
      <section class="gender-panel">
        <h3><span></span>性别选择<span></span></h3>
        <div class="gender-options">
          <button
            class="gender-card"
            :class="{ active: previewGender === 'male' }"
            type="button"
            @click="previewGender = 'male'"
          >
            <span>男生形象</span>
            <PixelTraveler :gender="'male'" :identity="identity" :level="currentStage.level" :size="94" />
          </button>
          <button
            class="gender-card"
            :class="{ active: previewGender === 'female' }"
            type="button"
            @click="previewGender = 'female'"
          >
            <span>女生形象</span>
            <PixelTraveler :gender="'female'" :identity="identity" :level="currentStage.level" :size="94" />
          </button>
        </div>
      </section>

      <section class="equipment-panel">
        <h3><span></span>装备系统预览<span></span></h3>
        <div class="gear-row">
          <span class="gear-label">帽子</span>
          <span v-for="item in hatItems" :key="item.icon" class="gear-icon preview" :class="{ active: item.active }" :data-icon="item.icon"></span>
        </div>
        <div class="gear-row">
          <span class="gear-label">上衣</span>
          <span v-for="item in clothesItems" :key="item.icon" class="gear-icon preview" :class="{ active: item.active }" :data-icon="item.icon"></span>
        </div>
        <div class="gear-row">
          <span class="gear-label">背包</span>
          <span v-for="item in packItems" :key="item.icon" class="gear-icon preview" :class="{ active: item.active }" :data-icon="item.icon"></span>
        </div>
        <div class="gear-row">
          <span class="gear-label">鞋子</span>
          <span v-for="item in shoeItems" :key="item.icon" class="gear-icon preview" :class="{ active: item.active }" :data-icon="item.icon"></span>
        </div>
      </section>

      <section class="growth-note-panel">
        <h3><span></span>成长说明<span></span></h3>
        <div class="growth-note">
          <span class="note-icon mountain"></span>
          <p>完成徒步路线<br />可获得经验，提升等级</p>
        </div>
        <div class="growth-note">
          <span class="note-icon backpack"></span>
          <p>解锁新装备<br />装扮你的旅人</p>
        </div>
        <div class="growth-note">
          <span class="note-icon camera"></span>
          <p>记录更多回忆<br />让旅人陪你走更远</p>
        </div>
        <p class="growth-quote">每一步成长，都是你与山野的故事</p>
      </section>
    </div>

    <p class="growth-footer">像素旅人会陪伴你探索世界，记录每一次心动的风景，见证你的成长。</p>
  </section>
</template>

<style scoped>
.growth-system-card {
  width: min(1180px, calc(100vw - 28px));
  margin: 0 0 28px 50%;
  transform: translateX(-50%);
  padding: clamp(18px, 2.5vw, 28px);
  border: 1.5px solid rgba(189, 181, 161, 0.42);
  border-radius: 24px;
  color: #3a2c21;
  background:
    radial-gradient(circle at 12% 12%, rgba(246, 226, 173, 0.28), transparent 28%),
    radial-gradient(circle at 90% 18%, rgba(194, 215, 179, 0.22), transparent 24%),
    linear-gradient(180deg, rgba(255, 252, 244, 0.92), rgba(250, 246, 235, 0.9));
  box-shadow: 0 22px 60px rgba(109, 89, 62, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.75);
}

.growth-header {
  text-align: center;
  margin-bottom: 20px;
}

.leaf-line,
.growth-footer {
  margin: 0;
  color: #75624f;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.leaf-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.leaf-line span,
.gender-panel h3 span,
.equipment-panel h3 span,
.growth-note-panel h3 span {
  width: 16px;
  height: 12px;
  display: inline-block;
  background:
    radial-gradient(ellipse at 35% 50%, #79935f 0 42%, transparent 44%),
    radial-gradient(ellipse at 70% 42%, #a6b97d 0 35%, transparent 37%);
  transform: rotate(-20deg);
}

.leaf-line span:last-child,
.gender-panel h3 span:last-child,
.equipment-panel h3 span:last-child,
.growth-note-panel h3 span:last-child {
  transform: scaleX(-1) rotate(-20deg);
}

.growth-header h2 {
  margin: 6px 0 4px;
  color: #302013;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  font-weight: 950;
  letter-spacing: 0.04em;
}

.growth-header p:last-child {
  margin: 0;
  color: #6b5946;
  font-size: clamp(0.9rem, 1.6vw, 1.08rem);
  font-weight: 800;
}

.level-card-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(138px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.level-card {
  position: relative;
  min-height: 410px;
  padding: 16px 12px 14px;
  border: 1.5px solid rgba(146, 133, 111, 0.22);
  border-radius: 14px;
  text-align: center;
  background: rgba(255, 254, 249, 0.78);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  transition: transform 0.24s ease, box-shadow 0.24s ease, opacity 0.24s ease;
}

.level-card.current {
  transform: translateY(-4px);
  box-shadow: 0 14px 28px rgba(116, 98, 75, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.75);
}

.level-card.locked {
  opacity: 0.58;
  filter: saturate(0.72);
}

.level-badge {
  display: inline-flex;
  min-width: 70px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 7px;
  color: #fffdf6;
  font-size: 0.98rem;
  font-weight: 950;
  background: var(--tone);
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.08);
}

.sage { --tone: #83a27d; --wash: rgba(131, 162, 125, 0.12); }
.meadow { --tone: #8cad43; --wash: rgba(140, 173, 67, 0.12); }
.river { --tone: #6da5c5; --wash: rgba(109, 165, 197, 0.12); }
.snow { --tone: #9b7fc9; --wash: rgba(155, 127, 201, 0.12); }
.rose { --tone: #dd7e83; --wash: rgba(221, 126, 131, 0.12); }
.gold { --tone: #dfa936; --wash: rgba(223, 169, 54, 0.14); }

.level-card h3 {
  margin: 12px 0 6px;
  color: #201813;
  font-size: 1.04rem;
  font-weight: 950;
}

.traveler-stage {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 166px;
  align-items: end;
}

.lock-hint {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 999px;
  color: #715b44;
  font-size: 0.68rem;
  font-weight: 950;
  background: rgba(255, 250, 235, 0.92);
  white-space: nowrap;
}

.equipment-card {
  margin-top: 8px;
  padding: 12px 8px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(238, 236, 225, 0.74), var(--wash));
}

.equipment-card strong {
  display: block;
  margin-bottom: 10px;
  color: #4a3d31;
  font-size: 0.78rem;
  font-weight: 950;
}

.equipment-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.equipment-item {
  display: grid;
  justify-items: center;
  gap: 4px;
}

.equipment-item small {
  color: #4d4035;
  font-size: 0.66rem;
  font-weight: 950;
}

.growth-lower-grid {
  display: grid;
  grid-template-columns: minmax(250px, 0.8fr) minmax(360px, 1.4fr) minmax(260px, 0.9fr);
  gap: 24px;
  align-items: start;
}

.gender-panel h3,
.equipment-panel h3,
.growth-note-panel h3 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: 0 0 14px;
  color: #2f251c;
  font-size: 1.04rem;
  font-weight: 950;
}

.gender-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.gender-card {
  min-height: 210px;
  padding: 14px 10px 8px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  background: rgba(255, 253, 246, 0.7);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.gender-card.active {
  border-color: rgba(124, 153, 106, 0.42);
  background: rgba(245, 252, 237, 0.88);
  transform: translateY(-2px);
}

.gender-card span {
  display: block;
  margin-bottom: 4px;
  color: #42362b;
  font-size: 0.78rem;
  font-weight: 950;
}

.equipment-panel {
  padding: 0 4px;
}

.gear-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  min-height: 58px;
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 13px;
  background: rgba(255, 254, 249, 0.55);
}

.gear-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border-radius: 8px;
  color: #fffdf5;
  font-size: 0.82rem;
  font-weight: 950;
  background: #aec190;
}

.gear-row .gear-icon {
  margin: 0 6px;
}

.gear-row .gear-icon.active {
  transform: translateY(-2px);
}

.growth-note-panel {
  padding: 14px;
  border-radius: 15px;
  background: rgba(255, 253, 246, 0.66);
}

.growth-note {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}

.growth-note p {
  margin: 0;
  color: #493a2d;
  font-size: 0.86rem;
  font-weight: 850;
  line-height: 1.55;
}

.growth-quote {
  margin: 16px 0 0;
  padding: 12px;
  border-radius: 12px;
  color: #775f39;
  text-align: center;
  font-size: 0.84rem;
  font-weight: 950;
  background: linear-gradient(90deg, rgba(246, 219, 166, 0.4), rgba(244, 235, 206, 0.85));
}

.growth-footer {
  margin-top: 24px;
  text-align: center;
}

.gear-icon,
.note-icon {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
}

.gear-icon::before,
.gear-icon::after,
.note-icon::before,
.note-icon::after {
  content: '';
  position: absolute;
  box-sizing: border-box;
}

.gear-icon[data-icon='Jacket']::before,
.gear-icon[data-icon='GreenCoat']::before,
.gear-icon[data-icon='Coat']::before,
.gear-icon[data-icon='PurpleCoat']::before,
.gear-icon[data-icon='PinkCoat']::before,
.gear-icon[data-icon='LegendCoat']::before {
  left: 10px;
  top: 9px;
  width: 18px;
  height: 23px;
  border: 2px solid #584436;
  border-radius: 6px 6px 3px 3px;
  background: var(--gear-color, #f6f0e8);
}

.gear-icon[data-icon='Jacket'] { --gear-color: #f7f1e8; }
.gear-icon[data-icon='GreenCoat'] { --gear-color: #98ad78; }
.gear-icon[data-icon='Coat'] { --gear-color: #6f9fbd; }
.gear-icon[data-icon='PurpleCoat'] { --gear-color: #b6a4d7; }
.gear-icon[data-icon='PinkCoat'] { --gear-color: #e7a9b2; }
.gear-icon[data-icon='LegendCoat'] { --gear-color: #879a68; }

.gear-icon[data-icon='Jacket']::after,
.gear-icon[data-icon='GreenCoat']::after,
.gear-icon[data-icon='Coat']::after,
.gear-icon[data-icon='PurpleCoat']::after,
.gear-icon[data-icon='PinkCoat']::after,
.gear-icon[data-icon='LegendCoat']::after {
  left: 17px;
  top: 11px;
  width: 2px;
  height: 19px;
  background: rgba(88, 68, 54, 0.45);
}

.gear-icon[data-icon='Pack']::before,
.gear-icon[data-icon='MidPack']::before,
.gear-icon[data-icon='BigPack']::before,
.gear-icon[data-icon='PurplePack']::before,
.gear-icon[data-icon='GoldPack']::before,
.gear-icon[data-icon='PackPlus']::before,
.gear-icon[data-icon='LegendPack']::before {
  left: 9px;
  top: 8px;
  width: 21px;
  height: 25px;
  border: 2px solid #584436;
  border-radius: 7px 7px 5px 5px;
  background: var(--pack-color, #c5aa82);
}

.gear-icon[data-icon='Pack'] { --pack-color: #c5aa82; }
.gear-icon[data-icon='MidPack'] { --pack-color: #b89060; }
.gear-icon[data-icon='BigPack'] { --pack-color: #9e744d; }
.gear-icon[data-icon='PurplePack'] { --pack-color: #a18ac7; }
.gear-icon[data-icon='GoldPack'] { --pack-color: #cda66d; }
.gear-icon[data-icon='PackPlus'] { --pack-color: #d3b484; }
.gear-icon[data-icon='LegendPack'] { --pack-color: #788d63; }

.gear-icon[data-icon='Pack']::after,
.gear-icon[data-icon='MidPack']::after,
.gear-icon[data-icon='BigPack']::after,
.gear-icon[data-icon='PurplePack']::after,
.gear-icon[data-icon='GoldPack']::after,
.gear-icon[data-icon='PackPlus']::after,
.gear-icon[data-icon='LegendPack']::after {
  left: 13px;
  top: 15px;
  width: 13px;
  height: 7px;
  border: 2px solid rgba(88, 68, 54, 0.55);
  border-radius: 3px;
}

.gear-icon[data-icon='Hat']::before,
.gear-icon[data-icon='Cap']::before,
.gear-icon[data-icon='SnowHat']::before,
.gear-icon[data-icon='ExplorerHat']::before {
  left: 9px;
  top: 15px;
  width: 22px;
  height: 9px;
  border: 2px solid #584436;
  border-radius: 10px 10px 3px 3px;
  background: var(--hat-color, #d3c09f);
}

.gear-icon[data-icon='Hat'] { --hat-color: #d2c09f; }
.gear-icon[data-icon='Cap'] { --hat-color: #d8c7a7; }
.gear-icon[data-icon='SnowHat'] { --hat-color: #f2eee3; }
.gear-icon[data-icon='ExplorerHat'] { --hat-color: #c1a47d; }

.gear-icon[data-icon='Hat']::after,
.gear-icon[data-icon='ExplorerHat']::after {
  left: 5px;
  top: 22px;
  width: 30px;
  height: 4px;
  border-radius: 5px;
  background: #584436;
}

.gear-icon[data-icon='Headphone']::before {
  left: 10px;
  top: 10px;
  width: 18px;
  height: 20px;
  border: 3px solid #584436;
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
}

.gear-icon[data-icon='Headphone']::after {
  left: 7px;
  top: 20px;
  width: 24px;
  height: 10px;
  border-left: 6px solid #c8aa79;
  border-right: 6px solid #c8aa79;
}

.gear-icon[data-icon='Boot']::before,
.gear-icon[data-icon='MidBoot']::before,
.gear-icon[data-icon='HighBoot']::before,
.gear-icon[data-icon='LegendBoot']::before,
.gear-icon[data-icon='Sneaker']::before {
  left: 8px;
  top: 18px;
  width: 24px;
  height: 12px;
  border: 2px solid #4f3726;
  border-radius: 5px 8px 4px 4px;
  background: var(--boot-color, #7d552f);
}

.gear-icon[data-icon='Sneaker'] { --boot-color: #fffaf0; }
.gear-icon[data-icon='Boot'] { --boot-color: #8a6238; }
.gear-icon[data-icon='MidBoot'] { --boot-color: #7b5733; }
.gear-icon[data-icon='HighBoot'] { --boot-color: #5e4127; }
.gear-icon[data-icon='LegendBoot'] { --boot-color: #3f3227; }

.gear-icon[data-icon='Boot']::after,
.gear-icon[data-icon='MidBoot']::after,
.gear-icon[data-icon='HighBoot']::after,
.gear-icon[data-icon='LegendBoot']::after {
  left: 12px;
  top: 12px;
  width: 12px;
  height: 13px;
  border: 2px solid #4f3726;
  border-radius: 4px 4px 0 0;
  background: var(--boot-color, #7d552f);
}

.gear-icon[data-icon='Map']::before {
  left: 8px;
  top: 8px;
  width: 23px;
  height: 25px;
  border: 2px solid #5c4938;
  border-radius: 4px;
  background: linear-gradient(90deg, #f6e8c8 0 33%, #fff4d7 33% 66%, #ead8b6 66%);
}

.gear-icon[data-icon='Map']::after {
  left: 13px;
  top: 13px;
  width: 13px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #8dad78;
  border-left-color: #d89179;
}

.gear-icon[data-icon='Pole']::before {
  left: 18px;
  top: 7px;
  width: 4px;
  height: 27px;
  border-radius: 3px;
  background: #6a4d35;
}

.gear-icon[data-icon='Pole']::after {
  left: 14px;
  top: 5px;
  width: 12px;
  height: 6px;
  border-radius: 6px;
  background: #4a3729;
}

.gear-icon[data-icon='Scarf']::before {
  left: 8px;
  top: 11px;
  width: 23px;
  height: 12px;
  border: 2px solid #584436;
  border-radius: 8px;
  background: #bba6de;
}

.gear-icon[data-icon='Scarf']::after {
  left: 13px;
  top: 21px;
  width: 9px;
  height: 12px;
  border-radius: 4px;
  background: #a08acb;
}

.gear-icon[data-icon='Pin']::before {
  left: 12px;
  top: 6px;
  width: 16px;
  height: 16px;
  border: 2px solid #584436;
  border-radius: 50% 50% 50% 0;
  background: #d97b74;
  transform: rotate(-45deg);
}

.gear-icon[data-icon='Pin']::after {
  left: 17px;
  top: 11px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f9ead6;
}

.gear-icon[data-icon='Globe']::before {
  left: 7px;
  top: 7px;
  width: 25px;
  height: 25px;
  border: 2px solid #584436;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #9fd5e5 0 32%, #6aa9c8 33% 100%);
}

.gear-icon[data-icon='Globe']::after {
  left: 13px;
  top: 12px;
  width: 15px;
  height: 12px;
  border-radius: 50%;
  background: #89ad70;
  box-shadow: -4px 7px 0 -1px #89ad70;
}

.note-icon.mountain::before {
  left: 6px;
  top: 12px;
  width: 26px;
  height: 20px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background: #b8c791;
}

.note-icon.mountain::after {
  left: 18px;
  top: 6px;
  width: 8px;
  height: 13px;
  border-left: 3px solid #7a5c3e;
  background: #e4b95f;
  clip-path: polygon(0 0, 100% 28%, 0 56%);
}

.note-icon.backpack::before {
  left: 9px;
  top: 8px;
  width: 22px;
  height: 25px;
  border: 2px solid #584436;
  border-radius: 7px;
  background: #b58b5c;
}

.note-icon.backpack::after {
  left: 13px;
  top: 16px;
  width: 13px;
  height: 8px;
  border: 2px solid rgba(88, 68, 54, 0.55);
  border-radius: 4px;
}

.note-icon.camera::before {
  left: 7px;
  top: 12px;
  width: 26px;
  height: 18px;
  border: 2px solid #584436;
  border-radius: 5px;
  background: #8bbbd0;
}

.note-icon.camera::after {
  left: 15px;
  top: 16px;
  width: 10px;
  height: 10px;
  border: 2px solid #584436;
  border-radius: 50%;
  background: #f7f1e8;
}

@media (max-width: 980px) {
  .level-card-grid {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }

  .growth-lower-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .growth-system-card {
    width: min(100%, calc(100vw - 20px));
    padding: 16px 12px;
  }

  .level-card-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .level-card {
    min-height: 360px;
    padding: 14px 8px 10px;
  }

  .traveler-stage {
    min-height: 145px;
  }

  .gender-options {
    grid-template-columns: 1fr;
  }

  .gear-row {
    grid-template-columns: 58px 1fr;
    padding: 8px;
  }

  .gear-row .gear-icon {
    margin: 0 2px;
    transform: scale(0.9);
  }
}
</style>
