<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  gender: { type: String, default: 'female' },
  identity: { type: String, default: 'forest' },
  level: { type: Number, default: 0 },
  unlockedCount: { type: Number, default: 0 },
  size: { type: Number, default: 120 },
})

const canvasRef = ref(null)
const W = 64
const H = 84
const SCALE = 4

const colors = {
  outline: '#32251c',
  outlineSoft: '#5b4636',
  skin: '#f8d8c7',
  skinShade: '#e9bfae',
  blush: '#e99aa0',
  hair: '#211915',
  hairLight: '#49372d',
  eye: '#1d1512',
  eyeLight: '#fff6ef',
  cream: '#f8f2e7',
  creamShade: '#e4d8c7',
  hat: '#cdbb9c',
  hatShade: '#a99575',
  hatBand: '#7f6a4f',
  green: '#8ea779',
  greenShade: '#667c55',
  blue: '#6f9fbd',
  blueShade: '#4f7891',
  purple: '#a999c9',
  purpleShade: '#7f6da5',
  pink: '#e3a5ad',
  pinkShade: '#b97885',
  tan: '#c49f70',
  tanShade: '#8f6840',
  boot: '#6b4727',
  bootShade: '#402b1a',
  white: '#fffdf8',
  darkPants: '#3f3f42',
  denim: '#4e6f98',
  ground: '#d7dfbf',
  grass: '#8aac70',
  flower: '#e5bd52',
  snow: '#e8f0f5',
  metal: '#7a8791',
}

const identityPalette = {
  forest: { jacket: colors.green, jacketShade: colors.greenShade, accent: '#dfeac4' },
  coast: { jacket: colors.blue, jacketShade: colors.blueShade, accent: '#d7edf4' },
  mountain: { jacket: colors.purple, jacketShade: colors.purpleShade, accent: '#eadff6' },
}

function gearForLevel(level) {
  if (level >= 16) return { hat: 'explorer', jacket: 'legend', bag: 'legend', boots: 'high', staff: true, goggles: true, badge: true, scarf: false, map: false, camera: false }
  if (level >= 12) return { hat: 'explorer', jacket: 'pink', bag: 'large', boots: 'high', staff: false, goggles: false, badge: true, scarf: false, map: false, camera: true }
  if (level >= 8) return { hat: 'snow', jacket: 'purple', bag: 'large', boots: 'high', staff: true, goggles: true, badge: false, scarf: true, map: false, camera: false }
  if (level >= 5) return { hat: 'cap', jacket: 'blue', bag: 'large', boots: 'mid', staff: false, goggles: false, badge: true, scarf: false, map: true, camera: false }
  if (level >= 3) return { hat: 'bucket', jacket: 'green', bag: 'mid', boots: 'mid', staff: false, goggles: false, badge: false, scarf: false, map: false, camera: false }
  return { hat: 'none', jacket: 'cream', bag: 'small', boots: 'low', staff: false, goggles: false, badge: false, scarf: false, map: false, camera: false }
}

function jacketColors(gear, identity) {
  if (gear.jacket === 'cream') return { main: colors.cream, shade: colors.creamShade, accent: '#d7e2e8' }
  if (gear.jacket === 'green') return { main: colors.green, shade: colors.greenShade, accent: '#dfeac4' }
  if (gear.jacket === 'blue') return { main: colors.blue, shade: colors.blueShade, accent: '#d7edf4' }
  if (gear.jacket === 'purple') return { main: colors.purple, shade: colors.purpleShade, accent: '#eee7fb' }
  if (gear.jacket === 'pink') return { main: colors.pink, shade: colors.pinkShade, accent: '#f8dbe0' }
  const palette = identityPalette[identity] || identityPalette.forest
  return { main: palette.jacket, shade: palette.jacketShade, accent: palette.accent }
}

function drawTraveler() {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = W * SCALE
  canvas.height = H * SCALE

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(SCALE, SCALE)

  const level = props.level || props.unlockedCount || 0
  const gear = gearForLevel(level)
  const jacket = jacketColors(gear, props.identity)
  const isMale = props.gender === 'male'

  const r = (x, y, w, h, c) => {
    ctx.fillStyle = c
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }
  const e = (x, y, w, h, c) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // soft ground
  e(12, 73, 40, 6, colors.ground)
  r(13, 73, 34, 2, '#c6d3aa')
  r(10, 70, 4, 3, '#bcc3ad')
  r(48, 70, 5, 3, '#bcc3ad')
  r(9, 69, 1, 3, colors.grass)
  r(11, 68, 1, 4, colors.grass)
  r(52, 68, 1, 4, colors.grass)
  r(54, 70, 1, 3, colors.grass)
  r(8, 67, 1, 1, colors.flower)
  r(55, 69, 1, 1, colors.flower)

  // back backpack, drawn before body
  const bagMain = gear.bag === 'legend' ? '#788d63' : gear.bag === 'large' ? '#9b744f' : gear.bag === 'mid' ? '#b18d64' : '#c6ad8c'
  const bagShade = gear.bag === 'legend' ? '#536644' : gear.bag === 'large' ? '#6b4c32' : gear.bag === 'mid' ? '#7d5d3c' : '#8a7157'
  const bagX = gear.bag === 'small' ? 42 : 41
  const bagW = gear.bag === 'small' ? 10 : 13
  const bagH = gear.bag === 'legend' ? 25 : gear.bag === 'large' ? 23 : gear.bag === 'mid' ? 20 : 16
  r(bagX, 34, bagW, bagH, colors.outline)
  r(bagX + 1, 35, bagW - 2, bagH - 2, bagMain)
  r(bagX + 1, 35, 2, bagH - 2, bagShade)
  r(bagX + 3, 39, bagW - 5, 7, bagShade)
  r(bagX + bagW - 2, 40, 2, 8, colors.outlineSoft)
  if (gear.bag === 'large' || gear.bag === 'legend') {
    r(bagX + 2, 31, bagW - 4, 4, colors.outline)
    r(bagX + 3, 32, bagW - 6, 2, gear.bag === 'legend' ? '#3f6d75' : '#6e875e')
  }
  if (gear.bag === 'legend') {
    e(bagX + 5, 43, 5, 5, '#5ba7c8')
    r(bagX + 7, 44, 2, 2, '#6fad68')
  }

  // staff
  if (gear.staff) {
    r(8, 37, 2, 34, colors.outline)
    r(9, 37, 1, 34, '#8a6846')
    r(7, 35, 4, 3, '#6a4c32')
    r(8, 70, 3, 2, colors.metal)
  }

  // legs
  if (isMale) {
    r(25, 55, 5, 13, colors.outline)
    r(35, 55, 5, 13, colors.outline)
    r(26, 56, 4, 12, colors.darkPants)
    r(36, 56, 4, 12, colors.darkPants)
  } else {
    r(25, 55, 5, 12, colors.outline)
    r(35, 55, 5, 12, colors.outline)
    r(26, 56, 4, 11, colors.skin)
    r(36, 56, 4, 11, colors.skin)
    r(23, 53, 9, 5, colors.outline)
    r(34, 53, 9, 5, colors.outline)
    r(24, 54, 8, 4, colors.denim)
    r(35, 54, 8, 4, colors.denim)
  }

  // boots / shoes
  const bootTop = gear.boots === 'low' ? 67 : 66
  r(22, bootTop, 10, 5, colors.outline)
  r(34, bootTop, 10, 5, colors.outline)
  r(23, bootTop, 8, 3, gear.boots === 'low' ? '#f5f3ee' : colors.boot)
  r(35, bootTop, 8, 3, gear.boots === 'low' ? '#f5f3ee' : colors.boot)
  r(23, bootTop + 3, 9, 2, gear.boots === 'low' ? '#1f2328' : colors.bootShade)
  r(35, bootTop + 3, 9, 2, gear.boots === 'low' ? '#1f2328' : colors.bootShade)
  if (gear.boots !== 'low') {
    r(27, bootTop + 1, 2, 1, '#f2e2c8')
    r(39, bootTop + 1, 2, 1, '#f2e2c8')
  }

  // body / coat
  r(20, 36, 25, 22, colors.outline)
  r(21, 37, 23, 20, jacket.main)
  r(21, 37, 3, 20, jacket.shade)
  r(42, 37, 2, 20, jacket.shade)
  r(29, 37, 7, 18, colors.cream)
  r(31, 38, 3, 17, jacket.accent)
  r(23, 45, 5, 4, jacket.shade)
  r(38, 45, 4, 4, jacket.shade)
  r(32, 40, 1, 15, colors.outlineSoft)
  if (gear.badge) {
    r(24, 40, 2, 2, colors.flower)
    r(39, 40, 2, 2, '#76aec3')
  }
  if (gear.scarf) {
    r(21, 35, 23, 4, colors.outline)
    r(22, 36, 21, 2, '#d8c3ec')
    r(23, 38, 6, 8, '#bda4dc')
  }

  // arms and hands
  r(15, 39, 8, 16, colors.outline)
  r(16, 40, 6, 14, jacket.main)
  r(44, 39, 8, 16, colors.outline)
  r(45, 40, 6, 14, jacket.main)
  r(16, 53, 6, 4, colors.outline)
  r(17, 53, 4, 3, colors.skin)
  r(45, 53, 6, 4, colors.outline)
  r(46, 53, 4, 3, colors.skin)

  if (gear.map) {
    r(10, 48, 11, 8, colors.outline)
    r(11, 49, 9, 6, '#f3e8ca')
    r(12, 50, 2, 2, '#88b979')
    r(16, 52, 2, 2, '#d79a85')
  }
  if (gear.camera) {
    r(12, 48, 11, 8, colors.outline)
    r(13, 49, 9, 6, '#4f4a45')
    e(16, 50, 5, 5, '#83b0c5')
    r(14, 48, 3, 2, colors.tan)
  }

  // head base
  r(18, 10, 30, 28, colors.outline)
  r(20, 11, 26, 26, colors.skin)
  r(20, 11, 2, 26, colors.skinShade)
  r(44, 14, 2, 20, colors.skinShade)
  r(16, 20, 5, 8, colors.outline)
  r(17, 21, 3, 6, colors.skin)
  r(46, 20, 5, 8, colors.outline)
  r(47, 21, 3, 6, colors.skin)

  // hair
  if (isMale) {
    r(18, 8, 30, 8, colors.outline)
    r(20, 7, 26, 7, colors.hair)
    r(20, 7, 26, 2, colors.hairLight)
    r(17, 13, 5, 12, colors.hair)
    r(45, 13, 5, 12, colors.hair)
    r(21, 15, 5, 5, colors.hair)
    r(28, 14, 5, 6, colors.hair)
    r(35, 14, 5, 5, colors.hair)
  } else {
    r(17, 8, 32, 9, colors.outline)
    r(19, 7, 28, 8, colors.hair)
    r(20, 7, 24, 2, colors.hairLight)
    r(14, 13, 8, 25, colors.outline)
    r(15, 14, 6, 23, colors.hair)
    r(46, 13, 8, 25, colors.outline)
    r(47, 14, 6, 23, colors.hair)
    r(21, 15, 5, 6, colors.hair)
    r(28, 14, 5, 7, colors.hair)
    r(35, 14, 5, 6, colors.hair)
    r(16, 34, 5, 5, colors.hairLight)
    r(47, 34, 5, 5, colors.hairLight)
  }

  // face
  r(25, 23, 6, 6, colors.eye)
  r(37, 23, 6, 6, colors.eye)
  r(26, 23, 2, 2, colors.eyeLight)
  r(38, 23, 2, 2, colors.eyeLight)
  r(24, 20, 7, 1, colors.hair)
  r(37, 20, 7, 1, colors.hair)
  r(22, 30, 5, 2, colors.blush)
  r(41, 30, 5, 2, colors.blush)
  r(33, 30, 2, 1, colors.skinShade)
  r(32, 33, 5, 1, '#a76767')

  // hat, drawn over hair
  if (gear.hat === 'bucket') {
    r(13, 10, 41, 5, colors.outline)
    r(15, 11, 37, 3, colors.hat)
    r(19, 6, 29, 8, colors.outline)
    r(20, 7, 27, 6, colors.hat)
    r(20, 11, 27, 2, colors.hatShade)
    r(28, 8, 12, 2, '#dfd3b9')
  } else if (gear.hat === 'cap') {
    r(18, 8, 31, 8, colors.outline)
    r(20, 9, 27, 6, colors.hat)
    r(13, 14, 19, 4, colors.outline)
    r(14, 15, 17, 2, colors.hatShade)
    r(32, 10, 3, 3, '#90b86f')
  } else if (gear.hat === 'snow') {
    r(19, 6, 29, 9, colors.outline)
    r(20, 7, 27, 7, colors.cream)
    r(22, 5, 20, 4, colors.creamShade)
    r(29, 3, 9, 4, colors.outline)
    r(30, 4, 7, 2, colors.cream)
  } else if (gear.hat === 'explorer') {
    r(11, 11, 45, 5, colors.outline)
    r(13, 12, 41, 3, colors.hat)
    r(19, 5, 30, 10, colors.outline)
    r(20, 6, 28, 8, colors.hat)
    r(20, 12, 28, 2, colors.hatShade)
    r(25, 10, 18, 2, colors.hatBand)
    r(22, 7, 3, 3, '#88a96e')
    r(42, 7, 3, 3, colors.flower)
  } else {
    // headphones like the first level in the reference
    r(13, 21, 5, 10, colors.outline)
    r(14, 22, 3, 8, colors.tan)
    r(50, 21, 5, 10, colors.outline)
    r(51, 22, 3, 8, colors.tan)
    r(18, 17, 2, 5, colors.tanShade)
    r(48, 17, 2, 5, colors.tanShade)
  }

  if (gear.goggles) {
    r(22, 12, 9, 5, colors.outline)
    r(37, 12, 9, 5, colors.outline)
    r(24, 13, 5, 3, '#9fc8d8')
    r(39, 13, 5, 3, '#9fc8d8')
    r(31, 14, 6, 1, colors.outline)
  }

  // sparkle pixels
  r(7, 25, 1, 1, '#d9bf62')
  r(57, 21, 1, 1, '#d9bf62')
  r(12, 30, 1, 1, '#9ab4c4')
  r(54, 36, 1, 1, '#9ab4c4')

  ctx.restore()
}

onMounted(drawTraveler)
watch(() => [props.level, props.gender, props.identity, props.unlockedCount], drawTraveler)
</script>

<template>
  <div class="pixel-traveler" :style="{ width: size + 'px' }">
    <canvas
      ref="canvasRef"
      :style="{
        width: size + 'px',
        height: (size * H / W) + 'px',
        imageRendering: 'pixelated',
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
  animation: traveler-bob 3.2s ease-in-out infinite;
  filter: drop-shadow(0 8px 12px rgba(72, 90, 99, 0.16));
}

canvas {
  display: block;
  border-radius: 6px;
}

@keyframes traveler-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .pixel-traveler {
    animation: none;
  }
}
</style>
