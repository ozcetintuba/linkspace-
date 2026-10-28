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

    <!-- Holografik Alt Işıma Tabanı (Glow Base) -->
    <div 
      class="absolute -bottom-1.5 w-3/4 h-3.5 rounded-full blur-md pointer-events-none transition-opacity duration-300"
      :class="isDark ? 'bg-[#FFFF00]/40' : 'bg-amber-500/30'"
    ></div>

    <!-- Tıklama / Etkileşim Efekti Rozeti (Mini Speech Bubble) -->
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
        class="absolute -top-7 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase pointer-events-none z-20 shadow-xl border animate-bounce flex items-center gap-1"
        :class="isDark ? 'bg-black/95 text-[#FFFF00] border-[#FFFF00]/50 shadow-yellow-500/20' : 'bg-white/95 text-amber-800 border-amber-300 shadow-slate-900/10'"
      >
        <span>{{ reactionText }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
const clickableTitle = computed(() => 'Siber Maskot Linky (Beni döndürmek için tıkla / fareyi ve parmağını takip ederim!)')

const containerRef = ref(null)
const showReaction = ref(false)
const reactionText = ref('⚡ BOING!')

let scene = null
let camera = null
let renderer = null
let animationFrameId = null

// Three.js Karakter Nesneleri
let rootGroup = null
let headGroup = null
let bodyGroup = null
let eyeLeft = null
let eyeRight = null
let digitalMouth = null
let antennaTip = null
let handLeft = null
let handRight = null
let haloPoints = null

// Fare takip & İnteraktif yaylanma fiziği
let targetPitch = 0
let targetYaw = 0
let currentPitch = 0
let currentYaw = 0

// Tıklama dönüşü & sıçrama animasyonu
let spinVelocity = 0
let jumpOffset = 0
let jumpVelocity = 0
let cheerWave = 0

// Doğal göz kırpma (Natural Blinking)
let nextBlinkTime = 2.5
let blinkProgress = 0
let isBlinking = false

const REACTIONS = ['⚡ LINKY!', '🚀 SELAM!', '✨ HAZIRIM!', '🤖 BEEP BEEP!', '💛 LINKSPACE!']

const triggerCheer = () => {
  // 360 Spin + Spring Jump + Cheer Wave
  spinVelocity = 13.5
  jumpVelocity = 0.22
  cheerWave = 1.0

  reactionText.value = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
  showReaction.value = true
  setTimeout(() => {
    showReaction.value = false
  }, 1300)

  emit('mascot-click')
}

// Mouse & Touch Dinleyicileri
const handlePointerMove = (e) => {
  if (!props.interactive) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  const normX = (clientX / window.innerWidth) * 2 - 1
  const normY = (clientY / window.innerHeight) * 2 - 1

  targetYaw = normX * 0.70
  targetPitch = -normY * 0.45
}

const initThree = () => {
  if (!containerRef.value) return

  try {
    const width = props.size
    const height = props.size

    // 1. Sahne
    scene = new THREE.Scene()

    // 2. Kamera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 4.2)

    // 3. Renderer (Yüksek Keskinlik & Şeffaf Arka Plan)
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.value.appendChild(renderer.domElement)

    // 4. Stüdyo Işıkları (Pixar / Apple Tarzı Çoklu Aydınlatma)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(3.5, 4.5, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xffff00, 2.5)
    rimLight.position.set(-4, -2, -3)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(-3, 3, 2)
    scene.add(fillLight)

    // 5. Model Hiyerarşisi
    rootGroup = new THREE.Group()
    headGroup = new THREE.Group()
    bodyGroup = new THREE.Group()
    rootGroup.add(bodyGroup)
    rootGroup.add(headGroup)
    scene.add(rootGroup)

    const neonColor = isDark.value ? 0xffff00 : 0xd97706
    const armorDarkColor = isDark.value ? 0x141416 : 0xf1f5f9
    const secondaryArmorColor = isDark.value ? 0x222226 : 0xe2e8f0

    // Ortak Parlak Siber Malzemeler (Ceramic/Metallic Obsidian)
    const helmetMat = new THREE.MeshPhysicalMaterial({
      color: armorDarkColor,
      roughness: 0.18,
      metalness: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12
    })

    const accentMat = new THREE.MeshStandardMaterial({
      color: secondaryArmorColor,
      roughness: 0.25,
      metalness: 0.9
    })

    const neonEmissiveMat = new THREE.MeshStandardMaterial({
      color: neonColor,
      emissive: neonColor,
      emissiveIntensity: 2.8,
      roughness: 0.1
    })

    // ==========================================
    // 5.1 GÖVDE, SİBER BOYUN VE REAKTÖR (TORSO)
    // ==========================================
    // Boyun Halkası
    const neckGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.16, 24)
    const neckMesh = new THREE.Mesh(neckGeo, accentMat)
    neckMesh.position.set(0, -0.66, 0)
    bodyGroup.add(neckMesh)

    // Göğüs Zırhı
    const chestGeo = new THREE.CylinderGeometry(0.50, 0.40, 0.48, 24)
    const chestMesh = new THREE.Mesh(chestGeo, helmetMat)
    chestMesh.position.set(0, -0.96, 0)
    bodyGroup.add(chestMesh)

    // Göğüs Reaktörü (Linkspace Enerji Çekirdeği)
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20)
    coreGeo.rotateX(Math.PI / 2)
    const coreMesh = new THREE.Mesh(coreGeo, neonEmissiveMat)
    coreMesh.position.set(0, -0.92, 0.44)
    bodyGroup.add(coreMesh)

    const coreRingGeo = new THREE.TorusGeometry(0.16, 0.024, 12, 24)
    const coreRing = new THREE.Mesh(coreRingGeo, neonEmissiveMat)
    coreRing.position.set(0, -0.92, 0.43)
    bodyGroup.add(coreRing)

    // ==========================================
    // 5.2 SÜZÜLEN MANYETİK ELLER (FLOATING HANDS)
    // ==========================================
    const handGeo = new THREE.SphereGeometry(0.15, 20, 16)
    handGeo.scale(1.15, 0.9, 1.25)

    handLeft = new THREE.Mesh(handGeo, helmetMat)
    handLeft.position.set(-0.78, -0.92, 0.2)
    bodyGroup.add(handLeft)

    handRight = new THREE.Mesh(handGeo.clone(), helmetMat)
    handRight.position.set(0.78, -0.92, 0.2)
    bodyGroup.add(handRight)

    // ==========================================
    // 5.3 KAFA & KASK (AERODYNAMIC CYBER HELMET)
    // ==========================================
    const helmetGeo = new THREE.SphereGeometry(0.74, 32, 24)
    helmetGeo.scale(1.0, 1.06, 0.96)
    const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat)
    headGroup.add(helmetMesh)

    // Siyah Kavisli Vizör Ekranı (Curved Glossy OLED Screen)
    const visorGeo = new THREE.SphereGeometry(0.66, 32, 24)
    visorGeo.scale(0.88, 0.62, 0.46)
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x030305,
      roughness: 0.04,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    })
    const visorMesh = new THREE.Mesh(visorGeo, visorMat)
    visorMesh.position.set(0, 0.04, 0.48)
    headGroup.add(visorMesh)

    // Canlı İfadeli Dijital Gözler (Capsule LED Eyes)
    const eyeGeo = new THREE.CapsuleGeometry(0.08, 0.13, 8, 16)

    eyeLeft = new THREE.Mesh(eyeGeo, neonEmissiveMat)
    eyeLeft.rotation.z = -0.06
    eyeLeft.position.set(-0.23, 0.07, 0.70)
    headGroup.add(eyeLeft)

    eyeRight = new THREE.Mesh(eyeGeo.clone(), neonEmissiveMat)
    eyeRight.rotation.z = 0.06
    eyeRight.position.set(0.23, 0.07, 0.70)
    headGroup.add(eyeRight)

    // Dijital Gülümseme Çizgisi (Cute Curved Mouth Bar)
    const mouthGeo = new THREE.TorusGeometry(0.12, 0.022, 8, 20, Math.PI * 0.75)
    digitalMouth = new THREE.Mesh(mouthGeo, neonEmissiveMat)
    digitalMouth.rotation.z = Math.PI * 1.12
    digitalMouth.position.set(0, -0.15, 0.71)
    headGroup.add(digitalMouth)

    // ==========================================
    // 5.4 SİBER KULAKLIKLAR (CYBER HEADSETS)
    // ==========================================
    const earcupGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 24)
    earcupGeo.rotateZ(Math.PI / 2)

    const earcupLeft = new THREE.Mesh(earcupGeo, accentMat)
    earcupLeft.position.set(-0.76, 0.05, 0)
    headGroup.add(earcupLeft)

    const earcupRight = new THREE.Mesh(earcupGeo.clone(), accentMat)
    earcupRight.position.set(0.76, 0.05, 0)
    headGroup.add(earcupRight)

    // Kulaklık Neon Halka Işıkları
    const earcupRingGeo = new THREE.TorusGeometry(0.20, 0.03, 10, 24)
    earcupRingGeo.rotateY(Math.PI / 2)

    const earRingLeft = new THREE.Mesh(earcupRingGeo, neonEmissiveMat)
    earRingLeft.position.set(-0.84, 0.05, 0)
    headGroup.add(earRingLeft)

    const earRingRight = new THREE.Mesh(earcupRingGeo.clone(), neonEmissiveMat)
    earRingRight.position.set(0.84, 0.05, 0)
    headGroup.add(earRingRight)

    // ==========================================
    // 5.5 TEPE SİNYAL ANTENİ & IŞILDAK
    // ==========================================
    const antennaStemGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.32, 12)
    const antennaStem = new THREE.Mesh(antennaStemGeo, accentMat)
    antennaStem.position.set(0.10, 0.88, 0)
    antennaStem.rotation.z = -0.18
    antennaStem.rotation.x = -0.10
    headGroup.add(antennaStem)

    const antennaTipGeo = new THREE.SphereGeometry(0.075, 16, 16)
    antennaTip = new THREE.Mesh(antennaTipGeo, neonEmissiveMat)
    antennaTip.position.set(0.14, 1.05, -0.02)
    headGroup.add(antennaTip)

    // ==========================================
    // 5.6 ORBİTAL IŞIK HALESİ (SPARKLE HALO)
    // ==========================================
    const sparkGeo = new THREE.BufferGeometry()
    const sparkCount = 24
    const sparkPos = new Float32Array(sparkCount * 3)
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2
      const radius = 1.35 + Math.random() * 0.15
      sparkPos[i * 3] = Math.cos(angle) * radius
      sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 0.4
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
    haloPoints = new THREE.Points(sparkGeo, sparkMat)
    rootGroup.add(haloPoints)

    // Olay Dinleyicileri
    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })

    // Animasyon Döngüsünü Başlat
    animate()
  } catch (err) {
    console.warn('Mascot Three.js WebGL fallback:', err)
  }
}

let clock = new THREE.Clock()

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.1)
  const elapsedTime = clock.getElapsedTime()

  // 1. Yumuşak İmleç / Parmak Takibi (Smooth Lerp)
  currentPitch += (targetPitch - currentPitch) * 0.08
  currentYaw += (targetYaw - currentYaw) * 0.08

  // 2. Tıklama Yaylanma & Zıplama Fiziği (Boing Spring Jump)
  if (jumpVelocity !== 0 || jumpOffset > 0) {
    jumpOffset += jumpVelocity
    jumpVelocity -= 1.4 * delta
    if (jumpOffset <= 0) {
      jumpOffset = 0
      jumpVelocity = 0
    }
  }

  // 3. Tıklama 360 Dönüş Sürati (Damping)
  if (spinVelocity > 0.01) {
    rootGroup.rotation.y += spinVelocity * delta
    spinVelocity *= 0.92
  } else {
    spinVelocity = 0
  }

  // 4. Havalanma ve Canlı Süzülme (Levitation Float)
  const floatY = Math.sin(elapsedTime * 2.4) * 0.07
  rootGroup.position.y = 0.15 + floatY + jumpOffset

  // Kafa Bakış Açısı
  if (spinVelocity === 0) {
    headGroup.rotation.y = currentYaw
    headGroup.rotation.x = currentPitch
  }
  headGroup.rotation.z = Math.sin(elapsedTime * 1.6) * 0.03

  // 5. Doğal Göz Kırpma Döngüsü (Natural Blinking System)
  if (!isBlinking && elapsedTime > nextBlinkTime) {
    isBlinking = true
    blinkProgress = 0
  }

  if (isBlinking) {
    blinkProgress += delta * 7.5 // Hızlı doğal göz kırpma
    const blinkScale = 1.0 - Math.sin(Math.min(blinkProgress, 1.0) * Math.PI) * 0.88
    if (eyeLeft) eyeLeft.scale.y = Math.max(0.12, blinkScale)
    if (eyeRight) eyeRight.scale.y = Math.max(0.12, blinkScale)

    if (blinkProgress >= 1.0) {
      isBlinking = false
      if (eyeLeft) eyeLeft.scale.y = 1.0
      if (eyeRight) eyeRight.scale.y = 1.0
      nextBlinkTime = elapsedTime + 3.0 + Math.random() * 2.5
    }
  }

  // 6. Süzülen Manyetik Ellerin Canlı Hareketi (Floating Hands Animation)
  if (cheerWave > 0) {
    cheerWave -= delta * 1.5
    if (cheerWave < 0) cheerWave = 0
  }

  const handCheerOffset = Math.sin(cheerWave * Math.PI) * 0.35
  if (handLeft && handRight) {
    handLeft.position.y = -0.92 + Math.sin(elapsedTime * 2.8) * 0.05 + handCheerOffset
    handRight.position.y = -0.92 + Math.sin(elapsedTime * 2.8 + Math.PI) * 0.05 + handCheerOffset

    handLeft.rotation.z = Math.sin(elapsedTime * 2.0) * 0.12 - cheerWave * 0.3
    handRight.rotation.z = -Math.sin(elapsedTime * 2.0) * 0.12 + cheerWave * 0.3
  }

  // 7. Tepe Anten Işığının Nabız Gibi Parlaması (Breathing Glow)
  if (antennaTip && antennaTip.material) {
    antennaTip.material.emissiveIntensity = 2.4 + Math.sin(elapsedTime * 4.5) * 0.9
  }

  // 8. Halo Kıvılcım Halka Dönüşü
  if (haloPoints) {
    haloPoints.rotation.y = elapsedTime * 0.30
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

  // Bellek Temizliği (Zero Memory Leaks)
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
