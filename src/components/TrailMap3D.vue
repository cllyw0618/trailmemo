<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  trails: {
    type: Array,
    required: true,
  },
  unlockedTrailIds: {
    type: Array,
    default: () => [],
  },
  selectedTrailId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-trail'])
const canvasHost = ref(null)
const internalSelectedId = ref(props.selectedTrailId || props.trails[0]?.id || '')

let scene
let camera
let renderer
let controls
let animationFrame = 0
let resizeObserver
let raycaster
let pointer
let globeGroup
let markerGroup
let labelGroup
let particleGroup
let ringsGroup
let globeMaterial
let disposed = false
const markerMeshes = []
const labelMeshes = []

const unlockedSet = computed(() => new Set(props.unlockedTrailIds))
const landPalette = ['#f8d0a8', '#f3a5b7', '#c8e7b1', '#ffe37c', '#aad8ff', '#c9b6ff', '#9ddfc7', '#f6c38f']

function latLonToVector3(latitude, longitude, radius = 2.18) {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function projectEquirectangular([longitude, latitude], width, height) {
  return [
    ((longitude + 180) / 360) * width,
    ((90 - latitude) / 180) * height,
  ]
}

function drawGeoRing(context, ring, width, height) {
  ring.forEach((coordinate, index) => {
    const [x, y] = projectEquirectangular(coordinate, width, height)
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
  context.closePath()
}

function drawGraticule(context, width, height) {
  context.save()
  context.strokeStyle = 'rgba(255,255,255,0.38)'
  context.lineWidth = 1
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }
  for (let lat = -60; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }
  context.restore()
}

function createBaseMapTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const context = canvas.getContext('2d')

  const ocean = context.createLinearGradient(0, 0, 0, canvas.height)
  ocean.addColorStop(0, '#56b8e8')
  ocean.addColorStop(0.52, '#75c6ed')
  ocean.addColorStop(1, '#b9e6ff')
  context.fillStyle = ocean
  context.fillRect(0, 0, canvas.width, canvas.height)
  drawGraticule(context, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(renderer?.capabilities.getMaxAnisotropy?.() ?? 8, 8)
  return texture
}

function createGeoJsonTexture(worldData) {
  const canvas = document.createElement('canvas')
  canvas.width = 4096
  canvas.height = 2048
  const context = canvas.getContext('2d')

  const ocean = context.createLinearGradient(0, 0, 0, canvas.height)
  ocean.addColorStop(0, '#43aee0')
  ocean.addColorStop(0.5, '#5ebfe8')
  ocean.addColorStop(1, '#a9def7')
  context.fillStyle = ocean
  context.fillRect(0, 0, canvas.width, canvas.height)
  drawGraticule(context, canvas.width, canvas.height)

  worldData.features.forEach((feature, index) => {
    const geometry = feature.geometry
    if (!geometry) return
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
    const countryName = feature.properties?.ADMIN || feature.properties?.name || ''
    const isChina = countryName.includes('China') || countryName.includes('中国')
    context.fillStyle = isChina ? '#f3a5b7' : landPalette[index % landPalette.length]
    context.strokeStyle = isChina ? 'rgba(120, 65, 76, 0.9)' : 'rgba(255, 255, 255, 0.92)'
    context.lineWidth = isChina ? 3.2 : 1.5

    polygons.forEach((polygon) => {
      context.beginPath()
      polygon.forEach((ring) => drawGeoRing(context, ring, canvas.width, canvas.height))
      context.fill('evenodd')
      context.stroke()
    })
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(renderer?.capabilities.getMaxAnisotropy?.() ?? 8, 8)
  return texture
}

async function applyGeoJsonMapTexture(material) {
  try {
    const response = await fetch('/data/countries.geojson')
    if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`)
    const worldData = await response.json()
    if (disposed) return
    const texture = createGeoJsonTexture(worldData)
    material.map?.dispose()
    material.map = texture
    material.needsUpdate = true
  } catch (error) {
    console.warn('Using fallback globe texture because GeoJSON texture failed.', error)
  }
}

function createLabelTexture(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext('2d')

  // Text shadow
  context.fillStyle = 'rgba(0,0,0,0.55)'
  context.font = 'bold 42px "PingFang SC", "Microsoft YaHei", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 258, 66)

  // Main text
  context.fillStyle = '#ffffff'
  context.shadowColor = 'rgba(0,0,0,0.3)'
  context.shadowBlur = 4
  context.fillText(text, 256, 64)

  // Subtle underline dot
  context.fillStyle = 'rgba(255,255,255,0.6)'
  context.shadowBlur = 0
  context.beginPath()
  context.arc(256, 114, 3, 0, Math.PI * 2)
  context.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createMarkerTexture(isUnlocked, isSelected) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  const glow = isSelected ? '#4ade80' : isUnlocked ? '#4ade80' : '#93c5fd'
  const core = isUnlocked ? '#dcfce7' : '#ffffff'

  // Outer glow
  const gradient = context.createRadialGradient(128, 128, 6, 128, 128, 108)
  gradient.addColorStop(0, core)
  gradient.addColorStop(0.30, glow)
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.beginPath()
  context.arc(128, 128, 108, 0, Math.PI * 2)
  context.fill()

  // Core dot - sharp white circle
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(128, 128, isSelected ? 28 : 22, 0, Math.PI * 2)
  context.fill()

  // Dark outline for clarity
  context.strokeStyle = isSelected ? '#22c55e' : isUnlocked ? '#22c55e' : '#60a5fa'
  context.lineWidth = 6
  context.beginPath()
  context.arc(128, 128, isSelected ? 28 : 22, 0, Math.PI * 2)
  context.stroke()

  // Inner bright core
  context.fillStyle = isSelected ? '#fff7ed' : '#ffffff'
  context.beginPath()
  context.arc(128, 128, isSelected ? 12 : 8, 0, Math.PI * 2)
  context.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createScene() {
  const host = canvasHost.value
  const width = host.clientWidth
  const height = host.clientHeight

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xc8e4ff, 8, 20)

  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
  camera.position.set(0.55, 0.85, 4.65)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.domElement.className = 'trail-map-canvas'
  host.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.enablePan = false
  controls.minDistance = 2.75
  controls.maxDistance = 7.2
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.2
  controls.target.set(0, 0, 0)

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9ab8ce, 2.3))

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
  keyLight.position.set(4, 4, 7)
  keyLight.castShadow = true
  scene.add(keyLight)

  const pinkLight = new THREE.PointLight(0xffd6ec, 2.8, 12)
  pinkLight.position.set(-3, -2, 4)
  scene.add(pinkLight)

  const rimLight = new THREE.DirectionalLight(0x88ccff, 1.8)
  rimLight.position.set(-3, 1, -5)
  scene.add(rimLight)

  const fillLight = new THREE.DirectionalLight(0xbbddff, 0.6)
  fillLight.position.set(-2, -1, 3)
  scene.add(fillLight)

  createGlobe()
  createMarkers()
  createParticles()

  host.addEventListener('pointermove', onPointerMove)
  host.addEventListener('click', onCanvasClick)
  resizeObserver = new ResizeObserver(resizeRenderer)
  resizeObserver.observe(host)
  animate()
}

function createCloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 400; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = 15 + Math.random() * 90
    const opacity = 0.06 + Math.random() * 0.28
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${opacity})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

function createGlobe() {
  globeGroup = new THREE.Group()

  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load('/textures/earth_atmos_2048.jpg')
  earthTexture.colorSpace = THREE.SRGBColorSpace
  earthTexture.anisotropy = Math.min(renderer?.capabilities.getMaxAnisotropy?.() ?? 8, 16)

  const bumpTexture = textureLoader.load('/textures/earth_atmos_2048.jpg')

  globeMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.035,
    roughness: 0.55,
    metalness: 0.02,
    emissive: 0x0a1a2a,
    emissiveIntensity: 0.02,
  })

  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.18, 128, 80), globeMaterial)
  globe.castShadow = true
  globe.receiveShadow = true
  globeGroup.add(globe)

  // Cloud layer
  const cloudTexture = createCloudTexture()
  const cloudMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(2.22, 96, 64), cloudMaterial)
  cloudMesh.userData.cloud = true
  globeGroup.add(cloudMesh)

  // Atmosphere glow
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.26, 96, 64),
    new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.10, side: THREE.BackSide }),
  )
  globeGroup.add(atmosphere)

  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.20, 96, 64),
    new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  globeGroup.add(innerGlow)

  ringsGroup = new THREE.Group()
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  ;[2.55, 2.85].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.005, 8, 160), ringMaterial.clone())
    ring.rotation.x = Math.PI / 2 + index * 0.25
    ring.rotation.z = index * 0.7
    ringsGroup.add(ring)
  })
  globeGroup.add(ringsGroup)

  globeGroup.rotation.y = Math.PI
  globeGroup.rotation.x = THREE.MathUtils.degToRad(-14)
  scene.add(globeGroup)
}

function createMarkers() {
  markerGroup = new THREE.Group()
  labelGroup = new THREE.Group()
  markerMeshes.length = 0
  labelMeshes.length = 0

  props.trails.forEach((trail) => {
    const unlocked = unlockedSet.value.has(trail.id)
    const selected = trail.id === internalSelectedId.value

    // Marker dot
    const material = new THREE.SpriteMaterial({ map: createMarkerTexture(unlocked, selected), transparent: true, depthWrite: false })
    const marker = new THREE.Sprite(material)
    marker.position.copy(latLonToVector3(trail.location.latitude, trail.location.longitude, 2.20))
    marker.scale.set(selected ? 0.28 : unlocked ? 0.2 : 0.16, selected ? 0.28 : unlocked ? 0.2 : 0.16, 1)
    marker.userData.trail = trail
    marker.userData.baseScale = marker.scale.x
    markerMeshes.push(marker)
    markerGroup.add(marker)

    // Name label with tangent-plane offset to prevent overlap
    const labelTexture = createLabelTexture(trail.name)
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false, depthTest: true })
    const label = new THREE.Sprite(labelMaterial)

    // Compute tangent-plane offset direction for label spread
    const basePos = latLonToVector3(trail.location.latitude, trail.location.longitude, 2.35)
    const dir = basePos.clone().normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const east = new THREE.Vector3().crossVectors(dir, up).normalize()
    if (east.length() < 0.001) east.set(1, 0, 0)
    const north = new THREE.Vector3().crossVectors(east, dir).normalize()

    // Unique offset angle per marker based on lat/lon (spreads labels around)
    const offsetAngle = (trail.location.longitude * 0.7 + trail.location.latitude * 1.1) * 0.12
    const offsetDist = 0.09
    label.position.copy(basePos)
      .add(east.clone().multiplyScalar(Math.cos(offsetAngle) * offsetDist))
      .add(north.clone().multiplyScalar(Math.sin(offsetAngle) * offsetDist))

    const nameLen = trail.name.length
    const labelScale = nameLen > 6 ? 0.26 : nameLen > 3 ? 0.28 : 0.30
    label.scale.set(labelScale * 1.8, labelScale * 0.45, 1)
    label.userData.trail = trail
    labelMeshes.push(label)
    labelGroup.add(label)

    // Thin connecting line from marker to label
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      latLonToVector3(trail.location.latitude, trail.location.longitude, 2.22),
      label.position,
    ])
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthTest: false })
    const line = new THREE.Line(lineGeo, lineMat)
    labelGroup.add(line)
  })

  globeGroup.add(markerGroup)
  globeGroup.add(labelGroup)
}

function rebuildMarkers() {
  if (!globeGroup || !markerGroup) return
  globeGroup.remove(markerGroup)
  globeGroup.remove(labelGroup)
  markerGroup.traverse(disposeObject)
  labelGroup.traverse(disposeObject)
  createMarkers()
}

function createParticles() {
  particleGroup = new THREE.Group()
  const baseTexture = createMarkerTexture(true, false)

  for (let index = 0; index < 58; index += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: baseTexture.clone(), transparent: true, opacity: 0.18 + Math.random() * 0.22, depthWrite: false }))
    sprite.position.set((Math.random() - 0.5) * 8.8, (Math.random() - 0.5) * 5.2, (Math.random() - 0.5) * 4.8)
    const size = 0.03 + Math.random() * 0.13
    sprite.scale.set(size, size, 1)
    sprite.userData.floatOffset = Math.random() * Math.PI * 2
    particleGroup.add(sprite)
  }

  scene.add(particleGroup)
}

function resizeRenderer() {
  if (!renderer || !camera || !canvasHost.value) return
  const { clientWidth, clientHeight } = canvasHost.value
  if (clientWidth === 0 || clientHeight === 0) return
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function pickMarker() {
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(markerMeshes, false)
  return intersects[0]?.object ?? null
}

function onPointerMove(event) {
  setPointerFromEvent(event)
  const picked = pickMarker()
  canvasHost.value.style.cursor = picked ? 'pointer' : 'grab'
}

function onCanvasClick(event) {
  setPointerFromEvent(event)
  const picked = pickMarker()
  if (!picked) return
  const trail = picked.userData.trail
  internalSelectedId.value = trail.id
  controls.autoRotate = false
  emit('select-trail', trail)
}

function animate(time = 0) {
  animationFrame = window.requestAnimationFrame(animate)
  const t = time * 0.001

  if (controls) controls.update()
  if (ringsGroup) ringsGroup.rotation.z = t * 0.08
  if (globeGroup) {
    globeGroup.children.forEach((child) => {
      if (child.userData?.cloud) {
        child.rotation.y += 0.00015
      }
    })
  }
  if (particleGroup) {
    particleGroup.children.forEach((sprite) => {
      sprite.position.y += Math.sin(t + sprite.userData.floatOffset) * 0.0009
    })
    particleGroup.rotation.y = Math.sin(t * 0.12) * 0.08
  }

  markerMeshes.forEach((marker, index) => {
    const active = marker.userData.trail.id === internalSelectedId.value
    const pulse = 1 + Math.sin(t * 2.4 + index) * 0.08
    const scale = marker.userData.baseScale * pulse * (active ? 1.2 : 1)
    marker.scale.set(scale, scale, 1)
  })

  renderer.render(scene, camera)
}

function disposeObject(object) {
  if (object.geometry) object.geometry.dispose()
  if (object.material) {
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      if (material.map) material.map.dispose()
      material.dispose()
    })
  }
}

function teardownScene() {
  disposed = true
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
  if (resizeObserver) resizeObserver.disconnect()
  if (canvasHost.value) {
    canvasHost.value.removeEventListener('pointermove', onPointerMove)
    canvasHost.value.removeEventListener('click', onCanvasClick)
  }
  if (controls) controls.dispose()
  if (scene) scene.traverse(disposeObject)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
}

watch(() => props.unlockedTrailIds, rebuildMarkers, { deep: true })
watch(() => props.selectedTrailId, (nextId) => {
  if (!nextId || nextId === internalSelectedId.value) return
  internalSelectedId.value = nextId
  rebuildMarkers()
})
watch(internalSelectedId, rebuildMarkers)

onMounted(createScene)
onBeforeUnmount(teardownScene)
</script>

<template>
  <div ref="canvasHost" class="trail-map-3d trail-globe-3d" aria-label="Rotatable 3D trail globe"></div>
</template>
