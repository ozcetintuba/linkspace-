<template>
  <div 
    ref="containerRef" 
    class="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-1000"
    :class="opacityClass"
    aria-hidden="true"
  ></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  theme: {
    type: String,
    default: 'dark'
  },
  enabled: {
    type: Boolean,
    default: true
  }
})

const containerRef = ref(null)
const opacityClass = ref('opacity-0')

let scene = null
let camera = null
let renderer = null
let particles = null
let lineMesh = null
let animationFrameId = null

let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0

const PARTICLE_COUNT = 320
const MAX_DISTANCE = 110

const getThemeColors = () => {
  if (props.theme === 'pure-light') {
    return {
      particle: 0xd97706, // Amber/Gold
      line: 0xf59e0b,
      lineOpacity: 0.12
    }
  }
  // Dark / Obsidian default
  return {
    particle: 0xffff00, // Cyber Neon Yellow
    line: 0xffff00,
    lineOpacity: 0.15
  }
}

const initThree = () => {
  if (!containerRef.value || !props.enabled) return

  const width = window.innerWidth
  const height = window.innerHeight

  // 1. Scene
  scene = new THREE.Scene()

  // 2. Camera
  camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000)
  camera.position.z = 700

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // 4. Parçacıklar (Particles)
  const colors = getThemeColors()
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const velocities = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1200
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1200
    positions[i * 3 + 2] = (Math.random() - 0.5) * 800

    velocities.push({
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.4,
      z: (Math.random() - 0.5) * 0.3
    })
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  // Neon Parçacık Malzemesi
  const particleMaterial = new THREE.PointsMaterial({
    color: colors.particle,
    size: 3.5,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  })

  particles = new THREE.Points(geometry, particleMaterial)
  particles.userData = { velocities }
  scene.add(particles)

  // 5. Takımyıldız Hatları (Lines)
  const lineGeometry = new THREE.BufferGeometry()
  const lineMaterial = new THREE.LineBasicMaterial({
    color: colors.line,
    transparent: true,
    opacity: colors.lineOpacity,
    blending: THREE.AdditiveBlending
  })
  lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
  scene.add(lineMesh)

  // 6. Olay Dinleyicileri
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)

  // Fade in
  setTimeout(() => {
    opacityClass.value = 'opacity-100'
  }, 100)

  // 7. Render Döngüsü Başlat
  animate()
}

const onMouseMove = (event) => {
  targetMouseX = (event.clientX - window.innerWidth / 2) * 0.4
  targetMouseY = (event.clientY - window.innerHeight / 2) * 0.4
}

const onTouchMove = (event) => {
  if (event.touches.length > 0) {
    targetMouseX = (event.touches[0].clientX - window.innerWidth / 2) * 0.3
    targetMouseY = (event.touches[0].clientY - window.innerHeight / 2) * 0.3
  }
}

const onWindowResize = () => {
  if (!camera || !renderer) return
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const onVisibilityChange = () => {
  if (document.hidden) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
  } else {
    animate()
  }
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)

  if (!particles || !camera || !renderer) return

  // Yumuşak kamera paralaks lerp
  mouseX += (targetMouseX - mouseX) * 0.05
  mouseY += (targetMouseY - mouseY) * 0.05
  camera.position.x = mouseX * 0.6
  camera.position.y = -mouseY * 0.6
  camera.lookAt(scene.position)

  // Parçacık konumlarını güncelle
  const positions = particles.geometry.attributes.position.array
  const velocities = particles.userData.velocities

  const linePositions = []
  let lineCount = 0

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] += velocities[i].x
    positions[i * 3 + 1] += velocities[i].y
    positions[i * 3 + 2] += velocities[i].z

    // Sınır kontrolü (döngüsel alan)
    if (positions[i * 3] > 600) positions[i * 3] = -600
    if (positions[i * 3] < -600) positions[i * 3] = 600
    if (positions[i * 3 + 1] > 600) positions[i * 3 + 1] = -600
    if (positions[i * 3 + 1] < -600) positions[i * 3 + 1] = 600

    // Yakın komşu parçacıklar arasına dinamik bağlantı çizgisi çek
    for (let j = i + 1; j < PARTICLE_COUNT; j++) {
      const dx = positions[i * 3] - positions[j * 3]
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < MAX_DISTANCE && lineCount < 180) {
        linePositions.push(
          positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
          positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
        )
        lineCount++
      }
    }
  }

  particles.geometry.attributes.position.needsUpdate = true

  // Hatları güncelle
  lineMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

  // Yavaş sahne dönüşü
  particles.rotation.y += 0.0006
  particles.rotation.x += 0.0003

  renderer.render(scene, camera)
}

const cleanUp = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  if (renderer && renderer.domElement && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
}

watch(() => props.theme, () => {
  if (particles && lineMesh) {
    const colors = getThemeColors()
    particles.material.color.setHex(colors.particle)
    lineMesh.material.color.setHex(colors.line)
  }
})

onMounted(() => {
  initThree()
})

onUnmounted(() => {
  cleanUp()
})
</script>
