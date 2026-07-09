<script setup>
/**
 * PixelTraveler.vue — 治愈系像素旅人 v3
 * 完全参考图片风格：大头 Q 版、柔和色块、分层装备
 * 40x56 像素网格，4x 缩放
 */
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  gender: { type: String, default: 'female' },
  identity: { type: String, default: 'forest' },
  level: { type: Number, default: 0 },
  unlockedCount: { type: Number, default: 0 },
  size: { type: Number, default: 120 },
})

const canvasRef = ref(null)
const S = 4  // 缩放
const W = 40
const H = 56

// 调色板
const P = {
  skin: '#ffe4d0',
  skinS: '#ffd0b0',
  skinD: '#f0c0a0',
  hair: '#2c1e14',
  hairL: '#4a3528',
  hairH: '#6a5242',
  eye: '#1a1008',
  white: '#fff',
  blush: '#ffb0b0',
  mouth: '#e09090',

  shirt: '#fff',
  shirtS: '#f5f0ec',

  pantsF: '#3a5a8a',
  pantsFS: '#2f4a70',
  pantsM: '#4a4a4a',
  pantsMS: '#3a3a3a',

  shoeN: '#3d3d3d',
  shoeNS: '#2d2d2d',
  shoeH: '#7a5a30',
  shoeHS: '#5a4018',

  coatW: '#f5f0ec', coatWS: '#e8e0d8', coatWD: '#d8d0c8',
  coatG: '#8faf80', coatGS: '#7f9f70', coatGD: '#6f8f60',
  coatB: '#7fb0d0', coatBS: '#6fa0c0', coatBD: '#5f90b0',
  coatP: '#c0b0d0', coatPS: '#b0a0c0', coatPD: '#a090b0',
  coatPi: '#f0b0c0', coatPiS: '#e0a0b0', coatPiD: '#d090a0',
  coatL: '#8fb08f', coatLS: '#7fa07f', coatLD: '#6f906f',

  hatB: '#f0e0c0', hatBS: '#e0d0b0', hatBD: '#d0c0a0',
  hatBe: '#f5f0ec', hatBeS: '#e8e0d8', hatBeD: '#d8d0c8',

  bagS: '#e8d8c0', bagSS: '#d8c8b0', bagSD: '#c8b8a0',
  bagM: '#d8c8b0', bagMS: '#c8b8a0', bagMD: '#b8a890',
  bagB: '#c4a882', bagBS: '#b49872', bagBD: '#a48862',
  bagL: '#8fa88a', bagLS: '#7f987a', bagLD: '#6f886a',

  staff: '#7a6a4a', staffS: '#5a4a2a',
  scarf: '#f0b0b0', scarfS: '#e0a0a0',
  badge: '#f0c040', badgeS: '#e0b030',

  mapP: '#f0e8d0', mapG: '#a0c090', mapR: '#d0a0a0',
  camera: '#4a4a4a', cameraL: '#8ab4d4',

  ground: '#d0e0b0', groundS: '#c0d0a0',
  leaf: '#a0d0a0', leafS: '#80b080',
  rock: '#c0c0c0', rockS: '#a8a8a8',
}

function getEquip(lv) {
  if (lv >= 16) return { hat: 'wide', coat: 'legend', bag: 'legend', staff: true, scarf: false, badge: 3, boots: 'hiking' }
  if (lv >= 12) return { hat: 'wide', coat: 'pink', bag: 'big', staff: false, scarf: false, badge: 2, boots: 'hiking' }
  if (lv >= 8) return { hat: 'beanie', coat: 'purple', bag: 'big', staff: true, scarf: true, badge: 2, boots: 'hiking' }
  if (lv >= 5) return { hat: 'cap', coat: 'blue', bag: 'big', staff: false, scarf: false, badge: 1, boots: 'hiking' }
  if (lv >= 3) return { hat: 'bucket', coat: 'green', bag: 'medium', staff: false, scarf: false, badge: 0, boots: 'hiking' }
  if (lv >= 1) return { hat: 'none', coat: 'white', bag: 'small', staff: false, scarf: false, badge: 0, boots: 'normal' }
  return { hat: 'none', coat: 'white', bag: 'small', staff: false, scarf: false, badge: 0, boots: 'normal' }
}

function coatC(type) {
  const m = {
    white: { m: P.coatW, s: P.coatWS, d: P.coatWD },
    green: { m: P.coatG, s: P.coatGS, d: P.coatGD },
    blue: { m: P.coatB, s: P.coatBS, d: P.coatBD },
    purple: { m: P.coatP, s: P.coatPS, d: P.coatPD },
    pink: { m: P.coatPi, s: P.coatPiS, d: P.coatPiD },
    legend: { m: P.coatL, s: P.coatLS, d: P.coatLD },
  }
  return m[type] || m.white
}

function draw(ctx) {
  const eq = getEquip(props.level)
  const isMale = props.gender === 'male'
  const cc = coatC(eq.coat)

  const pw = W * S, ph = H * S
  ctx.clearRect(0, 0, pw, ph)

  function px(c, r, color) {
    if (!color) return
    ctx.fillStyle = color
    ctx.fillRect(c * S, r * S, S, S)
  }
  function rect(c, r, w, h, color) {
    if (!color) return
    ctx.fillStyle = color
    ctx.fillRect(c * S, r * S, w * S, h * S)
  }
  function circ(c, r, radius, color) {
    if (!color) return
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc((c + 0.5) * S, (r + 0.5) * S, radius * S, 0, Math.PI * 2)
    ctx.fill()
  }

  // ===== 地面场景 =====
  // 地面椭圆
  rect(4, 50, 32, 3, P.ground)
  rect(3, 51, 34, 2, P.groundS)
  // 石头
  rect(8, 49, 3, 2, P.rock); rect(8, 49, 3, 1, P.rockS)
  rect(28, 49, 4, 2, P.rock); rect(28, 49, 4, 1, P.rockS)
  // 小草和花朵
  px(6, 50, P.leaf); px(7, 49, P.leaf); px(12, 51, P.leaf)
  px(25, 51, P.leaf); px(31, 50, P.leaf); px(32, 49, P.leaf)
  // 黄色小花
  px(14, 51, '#f0d060'); px(15, 50, '#f0d060'); px(30, 51, '#f0d060')

  // ===== 腿部 =====
  if (isMale) {
    rect(14, 38, 5, 11, P.pantsM)
    rect(21, 38, 5, 11, P.pantsM)
    rect(14, 38, 1, 11, P.pantsMS)
    rect(25, 38, 1, 11, P.pantsMS)
  } else {
    // 女生短裤/短裙
    rect(14, 38, 5, 10, P.skin)
    rect(21, 38, 5, 10, P.skin)
    rect(14, 38, 1, 10, P.skinS)
    rect(25, 38, 1, 10, P.skinS)
    // 短裤
    rect(13, 38, 6, 4, P.pantsF)
    rect(21, 38, 6, 4, P.pantsF)
    rect(13, 38, 6, 1, P.pantsFS)
    rect(21, 38, 6, 1, P.pantsFS)
  }

  // ===== 鞋子 =====
  if (eq.boots === 'hiking') {
    // 登山鞋
    rect(13, 47, 7, 3, P.shoeH)
    rect(13, 47, 7, 1, '#a08050')
    rect(13, 49, 7, 1, P.shoeHS)
    rect(20, 47, 7, 3, P.shoeH)
    rect(20, 47, 7, 1, '#a08050')
    rect(20, 49, 7, 1, P.shoeHS)
    // 鞋带
    px(16, 48, '#fff'); px(17, 48, '#fff')
    px(23, 48, '#fff'); px(24, 48, '#fff')
  } else {
    // 普通鞋
    rect(14, 47, 5, 3, P.shoeN)
    rect(21, 47, 5, 3, P.shoeN)
    rect(14, 49, 5, 1, P.shoeNS)
    rect(21, 49, 5, 1, P.shoeNS)
    // 白色袜子
    rect(14, 45, 5, 2, P.white)
    rect(21, 45, 5, 2, P.white)
  }

  // ===== 身体躯干 =====
  // 主体
  rect(13, 24, 14, 16, cc.m)
  rect(13, 24, 1, 16, cc.s)
  rect(26, 24, 1, 16, cc.s)
  // 底部
  rect(13, 38, 14, 2, cc.d)

  // 内搭白色T恤
  rect(17, 24, 6, 3, P.white)
  rect(18, 24, 4, 1, P.shirtS)

  // 衣服细节：口袋/拉链
  if (eq.coat !== 'white') {
    rect(15, 30, 3, 3, cc.d)
    rect(22, 30, 3, 3, cc.d)
    // 拉链/纽扣
    rect(19, 26, 2, 12, P.white)
    px(19, 26, cc.d); px(20, 26, cc.d)
    px(19, 28, cc.d); px(20, 28, cc.d)
    px(19, 30, cc.d); px(20, 30, cc.d)
  } else {
    // 白色外套条纹内搭
    rect(19, 26, 2, 8, P.shirtS)
    px(19, 26, '#a0c0e0'); px(20, 27, '#a0c0e0'); px(19, 28, '#a0c0e0')
  }

  // ===== 手臂 =====
  rect(9, 26, 5, 10, cc.m)
  rect(9, 26, 1, 10, cc.s)
  rect(26, 26, 5, 10, cc.m)
  rect(30, 26, 1, 10, cc.s)
  // 手
  rect(9, 35, 4, 3, P.skin)
  rect(9, 35, 1, 3, P.skinS)
  rect(27, 35, 4, 3, P.skin)

  // ===== 头部 =====
  // 脸轮廓
  rect(11, 4, 18, 18, P.skin)
  rect(11, 4, 1, 18, P.skinS)
  rect(28, 4, 1, 18, P.skinS)
  // 耳朵
  rect(8, 10, 4, 6, P.skin)
  rect(29, 10, 4, 6, P.skin)

  // ===== 头发 =====
  if (isMale) {
    // 男生短发，顺毛
    rect(10, 2, 20, 5, P.hair)
    rect(8, 3, 3, 6, P.hair)
    rect(29, 3, 3, 6, P.hair)
    rect(10, 2, 20, 1, P.hairH)
    // 刘海
    rect(11, 7, 18, 2, P.hairL)
    rect(12, 7, 2, 1, P.hair)
    rect(16, 7, 2, 1, P.hair)
    rect(20, 7, 2, 1, P.hair)
    rect(24, 7, 2, 1, P.hair)
  } else {
    // 女生长发，蓬松双马尾感
    rect(10, 2, 20, 6, P.hair)
    rect(8, 3, 3, 8, P.hair)
    rect(29, 3, 3, 8, P.hair)
    rect(6, 6, 4, 12, P.hair)
    rect(30, 6, 4, 12, P.hair)
    rect(10, 2, 20, 1, P.hairH)
    rect(6, 6, 1, 12, P.hairL)
    rect(33, 6, 1, 12, P.hairL)
    // 刘海
    rect(11, 7, 18, 3, P.hairL)
    rect(12, 7, 2, 1, P.hair)
    rect(16, 7, 2, 1, P.hair)
    rect(20, 7, 2, 1, P.hair)
    rect(24, 7, 2, 1, P.hair)
    // 发梢渐变
    rect(6, 17, 4, 2, P.hairL)
    rect(30, 17, 4, 2, P.hairL)
  }

  // ===== 脸部细节 =====
  // 眼睛（大而可爱）
  rect(14, 12, 4, 4, P.eye)
  rect(22, 12, 4, 4, P.eye)
  // 高光
  px(14, 12, P.white); px(15, 13, P.white)
  px(22, 12, P.white); px(23, 13, P.white)
  // 眉毛
  rect(14, 10, 4, 1, P.hair)
  rect(22, 10, 4, 1, P.hair)
  // 腮红
  px(12, 15, P.blush); px(13, 15, P.blush); px(14, 15, P.blush)
  px(26, 15, P.blush); px(27, 15, P.blush); px(28, 15, P.blush)
  // 鼻子
  px(19, 15, P.skinD)
  // 嘴巴
  rect(18, 17, 4, 1, P.mouth)

  // ===== 耳机（Lv1） =====
  if (eq.hat === 'none') {
    rect(7, 10, 3, 6, '#d8c8b0')
    rect(30, 10, 3, 6, '#d8c8b0')
    rect(7, 10, 3, 1, '#c8b8a0')
    rect(30, 10, 3, 1, '#c8b8a0')
    // 头梁
    rect(10, 8, 1, 3, '#c8b8a0')
    rect(29, 8, 1, 3, '#c8b8a0')
  }

  // ===== 帽子 =====
  if (eq.hat === 'bucket') {
    // 渔夫帽
    rect(8, 3, 24, 3, P.hatB)
    rect(6, 5, 28, 2, P.hatBS)
    rect(8, 3, 24, 1, P.hatBD)
    // 帽带
    rect(8, 6, 24, 1, '#c8b8a0')
    // 小徽章
    px(19, 4, P.badge)
  } else if (eq.hat === 'cap') {
    // 棒球帽
    rect(10, 3, 20, 4, P.hatB)
    rect(10, 3, 20, 1, P.hatBD)
    rect(7, 6, 13, 2, P.hatBS)
    rect(7, 6, 13, 1, P.hatBD)
    px(19, 4, P.badge)
  } else if (eq.hat === 'beanie') {
    // 毛线帽
    rect(10, 2, 20, 5, P.hatBe)
    rect(10, 2, 20, 1, P.hatBeD)
    rect(12, 1, 16, 2, P.hatBeS)
    // 毛球
    rect(16, 0, 8, 2, P.hatBe)
    // 护目镜
    rect(11, 7, 7, 3, '#a0c8e8')
    rect(22, 7, 7, 3, '#a0c8e8')
    rect(11, 7, 7, 1, '#80a8c8')
    rect(22, 7, 7, 1, '#80a8c8')
    rect(8, 8, 4, 1, '#5a7a9a')
    rect(28, 8, 4, 1, '#5a7a9a')
  } else if (eq.hat === 'wide') {
    // 宽檐探险帽
    rect(6, 5, 28, 2, P.hatB)
    rect(4, 6, 32, 2, P.hatBS)
    rect(6, 5, 28, 1, P.hatBD)
    // 帽顶
    rect(12, 2, 16, 4, P.hatB)
    rect(12, 2, 16, 1, P.hatBD)
    // 帽带
    rect(12, 5, 16, 1, '#c8b8a0')
    // 装饰
    if (eq.badge >= 2) {
      px(14, 3, '#f0a0a0'); px(15, 3, '#f0a0a0')
      px(24, 3, '#a0c8e8'); px(25, 3, '#a0c8e8')
    }
    if (eq.badge >= 3) {
      px(18, 2, '#a0d8a0'); px(19, 2, '#a0d8a0')
    }
  }

  // ===== 背包 =====
  if (eq.bag === 'small') {
    rect(27, 26, 6, 8, P.bagS)
    rect(27, 26, 1, 8, P.bagSS)
    rect(27, 26, 6, 1, P.bagSD)
    rect(25, 25, 2, 4, P.bagSS)
  } else if (eq.bag === 'medium') {
    rect(27, 25, 8, 10, P.bagM)
    rect(27, 25, 1, 10, P.bagMS)
    rect(27, 25, 8, 1, P.bagMD)
    rect(28, 27, 6, 4, P.bagMD)
    rect(25, 25, 2, 5, P.bagMS)
    rect(34, 28, 2, 4, P.bagMD)
  } else if (eq.bag === 'big') {
    rect(27, 24, 9, 12, P.bagB)
    rect(27, 24, 1, 12, P.bagBS)
    rect(27, 24, 9, 1, P.bagBD)
    rect(28, 26, 7, 5, P.bagBD)
    rect(29, 27, 5, 3, P.bagBS)
    rect(25, 25, 2, 6, P.bagBS)
    rect(35, 27, 2, 5, P.bagBD)
    // 顶部卷垫
    rect(28, 23, 7, 2, '#8faf80')
  } else if (eq.bag === 'legend') {
    rect(27, 24, 9, 13, P.bagL)
    rect(27, 24, 1, 13, P.bagLS)
    rect(27, 24, 9, 1, P.bagLD)
    rect(28, 26, 7, 6, P.bagLD)
    rect(29, 27, 5, 4, '#5f8060')
    rect(25, 25, 2, 7, P.bagLS)
    rect(35, 27, 2, 6, P.bagLD)
    // 地球徽章
    rect(30, 28, 4, 4, '#4a8ab0')
    px(31, 29, '#6aaa60'); px(32, 30, '#6aaa60'); px(31, 30, '#6aaa60')
    // 卷垫
    rect(28, 23, 7, 2, '#4a6a8a')
  }

  // ===== 登山杖 =====
  if (eq.staff) {
    rect(6, 28, 2, 22, P.staff)
    rect(6, 26, 3, 3, P.staffS)
    px(6, 49, '#888')
    rect(6, 28, 2, 4, '#5a4a2a')
  }

  // ===== 围巾 =====
  if (eq.scarf) {
    rect(13, 23, 14, 2, P.scarf)
    rect(13, 23, 14, 1, P.scarfS)
    rect(13, 25, 4, 5, P.scarf)
    rect(13, 25, 1, 5, P.scarfS)
  }

  // ===== 徽章 =====
  if (eq.badge >= 1) {
    px(15, 28, P.badge); px(16, 28, P.badgeS)
    if (eq.badge >= 2) {
      px(23, 28, P.badge); px(24, 28, P.badgeS)
    }
    if (eq.badge >= 3) {
      px(19, 29, P.white); px(20, 29, P.white)
    }
  }

  // ===== 手持道具 =====
  if (eq.coat === 'blue') {
    // 地图
    rect(7, 32, 7, 5, P.mapP)
    rect(7, 32, 7, 1, '#e0d8c0')
    px(8, 33, P.mapG); px(9, 34, P.mapG); px(10, 33, P.mapG)
    px(11, 34, P.mapR)
  }
  if (eq.coat === 'pink') {
    // 相机
    rect(7, 32, 7, 5, P.camera)
    rect(8, 33, 5, 3, '#666')
    px(10, 34, P.cameraL)
    rect(7, 32, 7, 1, '#2d2d2d')
    px(9, 33, '#f0c040')
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = W * S
  canvas.height = H * S
  draw(canvas.getContext('2d'))
})

watch(() => [props.level, props.gender, props.identity, props.unlockedCount], () => {
  const canvas = canvasRef.value
  if (!canvas) return
  draw(canvas.getContext('2d'))
})
</script>

<template>
  <div class="pixel-traveler" :style="{ width: size + 'px' }">
    <canvas
      ref="canvasRef"
      :style="{
        width: size + 'px',
        height: (size * H / W) + 'px',
        imageRendering: 'pixelated',
        display: 'block',
      }"
    />
  </div>
</template>

<style scoped>
.pixel-traveler {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
canvas {
  border-radius: 4px;
}
</style>