<template>
  <div 
    class="relative inline-flex items-center justify-center select-none"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <!-- Three.js Canvas Container -->
    <div 
      ref="containerRef"
      class="w-full h-full cursor-pointer relative z-10 transition-transform active:scale-95"
      @click="triggerCheer"
      :title="clickableTitle"
    ></div>

    <!-- Holografik Alt Işıma Tabanı -->
    <div 
      class="absolute -bottom-1 w-3/4 h-3 rounded-full blur-md pointer-events-none transition-opacity duration-300"
      :class="isDark ? 'bg-[#FFFF00]/40' : 'bg-amber-500/30'"
    ></div>

    <!-- Tıklama / Etkileşim Efekti Rozeti (Mini Toast) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-90"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-90"
    >
      <div 
        v-if="showReaction"
        class="absolute -top-6 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase pointer-events-none z-20 shadow-lg border animate-bounce"
        :class="isDark ? 'bg-black/90 text-[#FFFF00] border-[#FFFF00]/40' : 'bg-white/95 text-amber-700 border-amber-300'"
      >
        {{ reactionText }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  size: {
    type: Number,
    default: 130
  },
  theme: {
    type: String,
    default: 'dark'
  },
  interactive: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['mascot-click'])

const isDark = computed(() => props.theme !== 'pure-light')
const clickableTitle = computed(() => '3D Siber Maskot (Beni döndürmek için tıkla / fareyi takip ederim!)')

const containerRef = ref(null)
const showReaction = ref(false)
const reactionText = ref('⚡ BOING!')

let scene = null
let camera = null
let renderer = null
let animationFrameId = null

// Three.js nesneleri
let rootGroup = null
let headGroup = null
let coreMesh = null
let visorMesh = null
let eyeLeft = null
let eyeRight = null
let ringOuter = null
let ringInner = null
let sparkPoints = null
let earLeft = null
let earRight = null

// Fare takip & İnteraktif yaylanma fiziği
let targetPitch = 0
let targetYaw = 0
let currentPitch = 0
let currentYaw = 0

// Tıklama dönüşü & sıçrama animasyonu
let spinVelocity = 0
let jumpOffset = 0
let jumpVelocity = 0
let winkProgress = 0

const REACTIONS = ['⚡ SELAM!', '🚀 VROOOM!', '✨ HARİKA!', '👾 BEEP!', '💛 LINKSPACE!']

const triggerCheer = () => {
  // 360 spin + spring jump
  spinVelocity = 14.0
  jumpVelocity = 0.22
  winkProgress = 1.0

  // Rastgele neşeli mesaj balonu
  reactionText.value = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
  showReaction.value = true
  setTimeout(() => {
    showReaction.value = false
  }, 1200)

  emit('mascot-click')
}

// Mouse & Touch dinleyicileri
const handlePointerMove = (e) => {
  if (!props.interactive) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  // Ekran merkezine göre normalize açı
  const normX = (clientX / window.innerWidth) * 2 - 1
  const normY = (clientY / window.innerHeight) * 2 - 1

  // Clamped bakış açıları (Maks ±35 derece yaw, ±25 derece pitch)
  targetYaw = normX * 0.65
  targetPitch = -normY * 0.45
}

const initThree = () => {
  if (!containerRef.value) return

  const width = props.size
  const height = props.size

  // 1. Sahne
  scene = new THREE.Scene()

  // 2. Kamera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 0, 4.3)

  // 3. Renderer (Şeffaf arka plan, yüksek keskinlik)
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  containerRef.value.appendChild(renderer.domElement)

  // 4. Işıklar
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
  keyLight.position.set(3, 4, 5)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0xffff00, 2.0)
  rimLight.position.set(-4, -2, -3)
  scene.add(rimLight)

  const neonAccentLight = new THREE.PointLight(0xffff00, 3.0, 10)
  neonAccentLight.position.set(0, 0, 2)
  scene.add(neonAccentLight)

  // 5. Model Grupları
  rootGroup = new THREE.Group()
  headGroup = new THREE.Group()
  rootGroup.add(headGroup)
  scene.add(rootGroup)

  const neonColor = isDark.value ? 0xffff00 : 0xd97706
  const coreBodyColor = isDark.value ? 0x121214 : 0x1e293b

  // 5.1 Kafa: Fasetli Low-Poly Kristal İkosahedron (Modern Cyber Karakter)
  const coreGeo = new THREE.IcosahedronGeometry(0.85, 1)
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: coreBodyColor,
    roughness: 0.25,
    metalness: 0.85,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    flatShading: true
  })
  coreMesh = new THREE.Mesh(coreGeo, coreMat)
  headGroup.add(coreMesh)

  // 5.2 Siber Vizör (Kavisli Gövde + Neon Parlama)
  const visorGeo = new THREE.BoxGeometry(0.88, 0.28, 0.38)
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x050505,
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.92
  })
  visorMesh = new THREE.Mesh(visorGeo, visorMat)
  visorMesh.position.set(0, 0.08, 0.68)
  headGroup.add(visorMesh)

  // 5.3 Çift Neon Dijital Siber Gözler (Parlayan Silindir / Kapsül)
  const eyeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16)
  eyeGeo.rotateX(Math.PI / 2)
  const eyeMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 2.2,
    roughness: 0.2
  })

  eyeLeft = new THREE.Mesh(eyeGeo, eyeMat)
  eyeLeft.position.set(-0.24, 0.08, 0.88)
  headGroup.add(eyeLeft)

  eyeRight = new THREE.Mesh(eyeGeo.clone(), eyeMat.clone())
  eyeRight.position.set(0.24, 0.08, 0.88)
  headGroup.add(eyeRight)

  // 5.4 Yan Siber Kulaklar / Antenler (Floating Nodes)
  const earGeo = new THREE.OctahedronGeometry(0.18, 0)
  const earMat = new THREE.MeshStandardMaterial({
    color: 0x222226,
    metalness: 0.9,
    roughness: 0.2,
    flatShading: true
  })

  earLeft = new THREE.Mesh(earGeo, earMat)
  earLeft.position.set(-1.05, 0.05, 0)
  headGroup.add(earLeft)

  earRight = new THREE.Mesh(earGeo.clone(), earMat.clone())
  earRight.position.set(1.05, 0.05, 0)
  headGroup.add(earRight)

  // 5.5 Dönen Orbital Jiroskopik Halka 1 (İç Neon Halka)
  const ringInnerGeo = new THREE.TorusGeometry(1.22, 0.032, 8, 36)
  const ringInnerMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 0.9,
    metalness: 0.9,
    roughness: 0.2
  })
  ringInner = new THREE.Mesh(ringInnerGeo, ringInnerMat)
  rootGroup.add(ringInner)

  // 5.6 Dönen Orbital Jiroskopik Halka 2 (Dış Titanyum Halka)
  const ringOuterGeo = new THREE.TorusGeometry(1.42, 0.024, 8, 40)
  const ringOuterMat = new THREE.MeshStandardMaterial({
    color: isDark.value ? 0x52525b : 0x94a3b8,
    metalness: 0.95,
    roughness: 0.25
  })
  ringOuter = new THREE.Mesh(ringOuterGeo, ringOuterMat)
  rootGroup.add(ringOuter)

  // 5.7 Yörüngede Süzülen Mikro Kıvılcımlar (Sparkles)
  const sparkGeo = new THREE.BufferGeometry()
  const sparkCount = 28
  const sparkPos = new Float32Array(sparkCount * 3)
  for (let i = 0; i < sparkCount; i++) {
    const angle = (i / sparkCount) * Math.PI * 2
    const radius = 1.3 + Math.random() * 0.2
    sparkPos[i * 3] = Math.cos(angle) * radius
    sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 0.5
    sparkPos[i * 3 + 2] = Math.sin(angle) * radius
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
  const sparkMat = new THREE.PointsMaterial({
    color: neonColor,
    size: 0.065,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  })
  sparkPoints = new THREE.Points(sparkGeo, sparkMat)
  rootGroup.add(sparkPoints)

  // Olay dinleyicileri
  window.addEventListener('mousemove', handlePointerMove, { passive: true })
  window.addEventListener('touchmove', handlePointerMove, { passive: true })

  // Render döngüsü
  animate()
}

let clock = new THREE.Clock()

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)

  const delta = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  // 1. Yumuşak İmleç Takibi (Lerp)
  currentPitch += (targetPitch - currentPitch) * 0.08
  currentYaw += (targetYaw - currentYaw) * 0.08

  // 2. Yaylanma ve Zıplama Fiziği (Boing spring physics)
  if (jumpVelocity !== 0 || jumpOffset > 0) {
    jumpOffset += jumpVelocity
    jumpVelocity -= 1.4 * delta // Yerçekimi
    if (jumpOffset <= 0) {
      jumpOffset = 0
      jumpVelocity = 0
    }
  }

  // 3. Tıklama Dönüş Sürati (Damping)
  if (spinVelocity > 0.01) {
    headGroup.rotation.y += spinVelocity * delta
    spinVelocity *= 0.92 // Sürtünme sönümü
  } else {
    spinVelocity = 0
  }

  // 4. Kafa Yönelimi ve Sinüzoidal Havalanma (Levitation Float)
  const floatY = Math.sin(elapsedTime * 2.2) * 0.06
  rootGroup.position.y = floatY + jumpOffset

  // Kafa yaw/pitch uygulaması
  if (spinVelocity === 0) {
    headGroup.rotation.y = currentYaw
    headGroup.rotation.x = currentPitch
  }
  headGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.04

  // Göz kırpma / wink
  if (winkProgress > 0) {
    winkProgress -= delta * 3.0
    if (winkProgress < 0) winkProgress = 0
    const winkScaleY = 1.0 - Math.sin(winkProgress * Math.PI) * 0.85
    if (eyeRight) eyeRight.scale.y = Math.max(0.15, winkScaleY)
  }

  // 5. Jiroskopik Orbital Halkaların Dönüşü
  if (ringInner) {
    ringInner.rotation.x = elapsedTime * 0.7
    ringInner.rotation.y = elapsedTime * 0.5
  }
  if (ringOuter) {
    ringOuter.rotation.y = -elapsedTime * 0.6
    ringOuter.rotation.z = elapsedTime * 0.4
  }

  // 6. Kulakların mikro titreşimi
  if (earLeft && earRight) {
    const earPulse = Math.sin(elapsedTime * 4.0) * 0.05
    earLeft.position.x = -1.05 - earPulse
    earRight.position.x = 1.05 + earPulse
  }

  // 7. Mikro Kıvılcım Halka Dönüşü
  if (sparkPoints) {
    sparkPoints.rotation.y = elapsedTime * 0.35
  }

  renderer.render(scene, camera)
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  } else {
    if (!animationFrameId && renderer) {
      clock.start()
      animate()
    }
  }
}

onMounted(() => {
  initThree()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('touchmove', handlePointerMove)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // Three.js bellek temizliği (Zero Memory Leaks)
  if (scene) {
    scene.traverse((obj) => {
      if (obj.isMesh || obj.isPoints) {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      }
    })
  }

  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
})
</script>
