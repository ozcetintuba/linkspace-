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

    <!-- Holografik Alt Işıma Tabanı (Dinamik Maskot Rengiyle Parlar) -->
    <div 
      class="absolute -bottom-1.5 w-3/4 h-3.5 rounded-full blur-md pointer-events-none transition-all duration-300"
      :style="{ 
        backgroundColor: activeNeonHex, 
        opacity: isDark ? 0.45 : 0.35 
      }"
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
        :class="isDark ? 'bg-black/95 text-white border-white/20 shadow-yellow-500/20' : 'bg-white/95 text-slate-800 border-slate-300 shadow-slate-900/10'"
      >
        <span :style="{ color: activeNeonHex }">{{ reactionText }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as THREE from 'three'
import { 
  MASCOT_SKINS, 
  DEFAULT_MASCOT_CONFIG 
} from '../stores/linkStore'

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
  },
  config: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['mascot-click'])

const isDark = computed(() => props.theme !== 'pure-light')

const activeConfig = computed(() => ({
  ...DEFAULT_MASCOT_CONFIG,
  ...(props.config || {})
}))

const currentSkin = computed(() => {
  return MASCOT_SKINS.find(s => s.id === activeConfig.value.skin) || MASCOT_SKINS[0]
})

const activeNeonHex = computed(() => {
  return activeConfig.value.eyeColor || currentSkin.value.defaultNeon
})

const clickableTitle = computed(() => {
  return `${currentSkin.value.name} (Beni döndürmek için tıkla / fareyi ve parmağını takip ederim!)`
})

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
let eyeLeftWink = null
let digitalMouth = null
let antennaTip = null
let haloMesh = null
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

const REACTIONS_MAP = {
  cyber: ['⚡ LINKY!', '🤖 BEEP!', '✨ HAZIRIM!', '💛 LINKSPACE!'],
  sakura: ['🌸 NYA~!', '💖 MOCHI!', '🎀 SEVGİLER!', '✨ YAY!'],
  astro: ['🚀 UÇUŞA GEÇTİK!', '👨‍🚀 APOLLO!', '🌌 YILDIZLAR!', '✨ ROKET!'],
  synthwave: ['💜 RETRO!', '⚡ 80s VIBE!', '🪩 NEON!', '✨ GROOVY!'],
  boba: ['🍃 MATCHA!', '🧋 BOBA!', '🌿 FERAH!', '💚 TAZELİK!']
}

const triggerCheer = () => {
  spinVelocity = 13.5
  jumpVelocity = 0.22
  cheerWave = 1.0

  const pool = REACTIONS_MAP[activeConfig.value.skin] || REACTIONS_MAP.cyber
  reactionText.value = pool[Math.floor(Math.random() * pool.length)]
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

// Güvenli Grup Temizliği (Bellek Sızıntısız Mesh Temizliği)
const clearGroupSafely = (group) => {
  if (!group) return
  while (group.children.length > 0) {
    const obj = group.children[0]
    group.remove(obj)
    if (obj.isGroup) {
      clearGroupSafely(obj)
    }
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  }
}

// Karakteri Seçilen Cilt, Aksesuar ve İfadeye Göre Sıfırdan İnşa Et
const buildMascot = () => {
  if (!scene || !rootGroup) return

  // Önceki nesneleri temizle
  clearGroupSafely(bodyGroup)
  clearGroupSafely(headGroup)
  clearGroupSafely(rootGroup)

  headGroup = new THREE.Group()
  bodyGroup = new THREE.Group()
  rootGroup.add(bodyGroup)
  rootGroup.add(headGroup)

  const skin = currentSkin.value
  const neonColor = new THREE.Color(activeNeonHex.value)
  const isLightSkin = ['sakura', 'astro', 'boba'].includes(skin.id)

  // 1. Kask & Ana Zırh Malzemesi
  const helmetMat = new THREE.MeshPhysicalMaterial({
    color: skin.helmetColor,
    roughness: isLightSkin ? 0.12 : 0.20,
    metalness: isLightSkin ? 0.25 : 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.10
  })

  // 2. İkincil Vurgu Malzemesi
  const accentMat = new THREE.MeshStandardMaterial({
    color: skin.secondaryColor,
    roughness: 0.25,
    metalness: isLightSkin ? 0.35 : 0.85
  })

  // 3. Parlak Neon LED Malzemesi
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
    color: skin.id === 'synthwave' ? 0x0a0412 : 0x030305,
    roughness: 0.04,
    metalness: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  })
  const visorMesh = new THREE.Mesh(visorGeo, visorMat)
  visorMesh.position.set(0, 0.04, 0.48)
  headGroup.add(visorMesh)

  // ==========================================
  // 5.4 GÖZLER VE İFADE (MOOD EXPRESSIONS)
  // ==========================================
  const mood = activeConfig.value.mood || 'happy'

  if (mood === 'wink') {
    // Sağ göz açık, Sol göz sevimli kırpma yayı (Wink Arc)
    const eyeGeo = new THREE.CapsuleGeometry(0.08, 0.13, 8, 16)
    eyeRight = new THREE.Mesh(eyeGeo, neonEmissiveMat)
    eyeRight.rotation.z = 0.06
    eyeRight.position.set(0.23, 0.07, 0.70)
    headGroup.add(eyeRight)

    const winkGeo = new THREE.TorusGeometry(0.09, 0.024, 8, 16, Math.PI * 0.8)
    eyeLeftWink = new THREE.Mesh(winkGeo, neonEmissiveMat)
    eyeLeftWink.rotation.z = Math.PI * 1.08
    eyeLeftWink.position.set(-0.23, 0.05, 0.70)
    headGroup.add(eyeLeftWink)
    eyeLeft = null
  } else if (mood === 'cool') {
    // Havalı / Keskin Bakışlar
    const eyeGeo = new THREE.CapsuleGeometry(0.08, 0.07, 8, 16)
    eyeGeo.scale(1.2, 0.6, 1.0)

    eyeLeft = new THREE.Mesh(eyeGeo, neonEmissiveMat)
    eyeLeft.rotation.z = -0.15
    eyeLeft.position.set(-0.23, 0.07, 0.70)
    headGroup.add(eyeLeft)

    eyeRight = new THREE.Mesh(eyeGeo.clone(), neonEmissiveMat)
    eyeRight.rotation.z = 0.15
    eyeRight.position.set(0.23, 0.07, 0.70)
    headGroup.add(eyeRight)
    eyeLeftWink = null
  } else {
    // Normal / Neşeli Açık Gözler
    const eyeGeo = new THREE.CapsuleGeometry(0.08, 0.13, 8, 16)
    eyeLeft = new THREE.Mesh(eyeGeo, neonEmissiveMat)
    eyeLeft.rotation.z = -0.06
    eyeLeft.position.set(-0.23, 0.07, 0.70)
    headGroup.add(eyeLeft)

    eyeRight = new THREE.Mesh(eyeGeo.clone(), neonEmissiveMat)
    eyeRight.rotation.z = 0.06
    eyeRight.position.set(0.23, 0.07, 0.70)
    headGroup.add(eyeRight)
    eyeLeftWink = null
  }

  // Sevimli Dijital Gülümseme (Cute Curved Smile Bar)
  const mouthGeo = new THREE.TorusGeometry(0.12, 0.022, 8, 20, Math.PI * 0.75)
  digitalMouth = new THREE.Mesh(mouthGeo, neonEmissiveMat)
  digitalMouth.rotation.z = Math.PI * 1.12
  digitalMouth.position.set(0, -0.15, 0.71)
  headGroup.add(digitalMouth)

  // Sevimli Yanak Parıltıları (Kawaii Blush - Sakura ve Boba modellerinde)
  if (['sakura', 'boba'].includes(skin.id) || mood === 'happy') {
    const blushGeo = new THREE.SphereGeometry(0.045, 12, 12)
    blushGeo.scale(1.4, 0.6, 0.4)

    const blushMat = new THREE.MeshStandardMaterial({
      color: neonColor,
      emissive: neonColor,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.8
    })

    const blushLeft = new THREE.Mesh(blushGeo, blushMat)
    blushLeft.position.set(-0.36, -0.06, 0.63)
    headGroup.add(blushLeft)

    const blushRight = new THREE.Mesh(blushGeo.clone(), blushMat)
    blushRight.position.set(0.36, -0.06, 0.63)
    headGroup.add(blushRight)
  }

  // ==========================================
  // 5.5 SİBER KULAKLIKLAR (CYBER HEADSETS)
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
  // 5.6 SEÇİLEN AKSEDÖRLER (ACCESSORIES)
  // ==========================================
  const accessory = activeConfig.value.accessory || skin.defaultAccessory

  if (accessory === 'ears') {
    // 🐱 SEVİMLİ CHIBI KEDİ / TAVŞAN KULAKLARI
    const earOuterGeo = new THREE.ConeGeometry(0.18, 0.40, 16)
    earOuterGeo.scale(1.1, 1.0, 0.75)

    const earInnerGeo = new THREE.ConeGeometry(0.12, 0.30, 16)
    earInnerGeo.scale(1.0, 1.0, 0.65)

    // Sol Kulak
    const earLeft = new THREE.Group()
    const earLeftMesh = new THREE.Mesh(earOuterGeo, helmetMat)
    const earLeftInner = new THREE.Mesh(earInnerGeo, neonEmissiveMat)
    earLeftInner.position.set(0, -0.03, 0.04)
    earLeft.add(earLeftMesh)
    earLeft.add(earLeftInner)
    earLeft.position.set(-0.38, 0.82, 0.08)
    earLeft.rotation.z = 0.35
    earLeft.rotation.x = -0.12
    headGroup.add(earLeft)

    // Sağ Kulak
    const earRight = new THREE.Group()
    const earRightMesh = new THREE.Mesh(earOuterGeo.clone(), helmetMat)
    const earRightInner = new THREE.Mesh(earInnerGeo.clone(), neonEmissiveMat)
    earRightInner.position.set(0, -0.03, 0.04)
    earRight.add(earRightMesh)
    earRight.add(earRightInner)
    earRight.position.set(0.38, 0.82, 0.08)
    earRight.rotation.z = -0.35
    earRight.rotation.x = -0.12
    headGroup.add(earRight)

    antennaTip = null
    haloMesh = null
  } else if (accessory === 'halo') {
    // 😇 ORBİTAL MELEK HALESİ (NEON HALO)
    const haloGeo = new THREE.TorusGeometry(0.46, 0.035, 12, 32)
    haloMesh = new THREE.Mesh(haloGeo, neonEmissiveMat)
    haloMesh.rotation.x = Math.PI / 2.3
    haloMesh.position.set(0, 1.15, -0.05)
    headGroup.add(haloMesh)

    antennaTip = null
  } else if (accessory === 'headset') {
    // 🎧 KULAKLIK BANDI (HEADPHONE HEADBAND)
    const bandGeo = new THREE.TorusGeometry(0.77, 0.04, 12, 32, Math.PI * 0.85)
    const bandMesh = new THREE.Mesh(bandGeo, accentMat)
    bandMesh.rotation.z = Math.PI * 0.08
    bandMesh.position.set(0, 0.16, 0)
    headGroup.add(bandMesh)

    antennaTip = null
    haloMesh = null
  } else {
    // 📡 KLASİK SİNYAL ANTENİ
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
    haloMesh = null
  }

  // ==========================================
  // 5.7 ORBİTAL IŞIK HALESİ (SPARKLE HALO)
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
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    containerRef.value.appendChild(renderer.domElement)

    // 4. Stüdyo Işıkları (Pixar / Apple Tarzı Çoklu Aydınlatma)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(3.5, 4.5, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2)
    rimLight.position.set(-4, -2, -3)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(-3, 3, 2)
    scene.add(fillLight)

    // 5. Model Kök Grubu
    rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // Modeli İnşa Et
    buildMascot()

    // Olay Dinleyicileri
    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('touchstart', handlePointerMove, { passive: true })

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

  if (!rootGroup || !headGroup) return

  // 1. Yumuşak İmleç / Parmak Takibi (Smooth Lerp)
  currentPitch += (targetPitch - currentPitch) * 0.08
  currentYaw += (targetYaw - currentYaw) * 0.08

  // 2. Tıklama Dönüşü (Spin Friction)
  if (spinVelocity > 0) {
    rootGroup.rotation.y += spinVelocity * delta
    spinVelocity -= delta * 9.0
    if (spinVelocity < 0) {
      spinVelocity = 0
      rootGroup.rotation.y = 0
    }
  }

  // 3. Sıçrama Fiziği (Jump Physics)
  if (jumpVelocity > 0 || jumpOffset > 0) {
    jumpOffset += jumpVelocity
    jumpVelocity -= delta * 1.8
    if (jumpOffset <= 0) {
      jumpOffset = 0
      jumpVelocity = 0
    }
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
    blinkProgress += delta * 7.5
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

  // 6. Süzülen Manyetik Ellerin Canlı Hareketi
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

  // 7. Tepe Anten Işığının Nabız Gibi Parlaması
  if (antennaTip && antennaTip.material) {
    antennaTip.material.emissiveIntensity = 2.4 + Math.sin(elapsedTime * 4.5) * 0.9
  }

  // 8. Melek Halesinin Dönüşü
  if (haloMesh) {
    haloMesh.rotation.z = elapsedTime * 0.45
  }

  // 9. Halo Kıvılcım Halka Dönüşü
  if (haloPoints) {
    haloPoints.rotation.y = elapsedTime * 0.30
  }

  renderer.render(scene, camera)
}

// Konfigürasyon veya Tema Değiştiğinde Modeli Yeniden Kur
watch(
  () => [props.config, props.theme],
  () => {
    buildMascot()
  },
  { deep: true }
)

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
  window.removeEventListener('touchstart', handlePointerMove)
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
