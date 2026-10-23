import { Router } from 'express'

const router = Router()

// Hazır Ses Tonları (Tone of Voice Presets)
export const AI_TONES = [
  {
    id: 'professional',
    name: 'Kurumsal & Profesyonel',
    emoji: '💼',
    description: 'Ciddi, güven veren, teknik başarı ve ölçeklenebilirlik odaklı profil dili',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  },
  {
    id: 'casual',
    name: 'Samimi & Girişimci',
    emoji: '🚀',
    description: 'Enerjik, yenilikçi, ürün odaklı ve iş birliğine açık sıcak ton',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'minimalist',
    name: 'Minimalist & Siberpunk',
    emoji: '⚡',
    description: 'Vurucu, kısa, modern yazılımcı ve açık kaynak kültürü tarzı',
    badgeClass: 'bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30'
  },
  {
    id: 'creative',
    name: 'Yaratıcı & Meraklı',
    emoji: '🎨',
    description: 'Hikaye anlatan, tasarım ve kullanıcı deneyimine vurgu yapan özgün üslup',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  }
]

// Popüler Yetenek ve Rol Önerileri
export const SUGGESTED_ROLES = [
  'Yazılım Mühendisliği Öğrencisi',
  'Full-Stack Web Geliştirici',
  'Frontend & Vue.js Geliştirici',
  'Backend & Node.js Developer',
  'UI/UX & Ürün Tasarımcısı',
  'Açık Kaynak & AI Meraklısı'
]

export const SUGGESTED_SKILLS = [
  'Vue 3',
  'Express.js',
  'PostgreSQL',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Açık Kaynak',
  'Yapay Zeka & LLM',
  'REST API',
  'Docker'
]

/**
 * Bağlamsal & Algoritmik Biyografi Üretim Motoru
 * Harici API olmadan da 100% deterministik, zengin ve doğal Türkçe varyasyonlar üretir.
 */
export const generateBiosContextually = ({ role, skills = [], tone = 'professional', keywords = '' }) => {
  const cleanRole = (role && role.trim()) ? role.trim() : 'Full-Stack Geliştirici'
  
  // Yetenek listesini ayrıştır
  let skillList = Array.isArray(skills) ? [...skills] : []
  if (typeof skills === 'string' && skills.trim()) {
    skillList = skills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
  }
  if (keywords && typeof keywords === 'string') {
    const extra = keywords.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    skillList = Array.from(new Set([...skillList, ...extra]))
  }
  if (skillList.length === 0) {
    skillList = ['Vue 3', 'Node.js', 'Modern Web']
  }

  const primarySkill = skillList[0] || 'Vue 3'
  const secondarySkill = skillList[1] || 'Node.js'
  const skillsText = skillList.slice(0, 3).join(' • ')

  const results = []

  // 1. Kurumsal & Profesyonel
  if (tone === 'professional' || tone === 'all') {
    results.push(
      {
        id: `bio-prof-1-${Date.now()}`,
        tone: 'professional',
        toneName: 'Kurumsal & Profesyonel',
        emoji: '💼',
        text: `${cleanRole} | ${skillsText} odaklı modern, performanslı ve ölçeklenebilir dijital çözümler üretiyorum.`,
        tags: ['Kurumsal', 'Ölçeklenebilir', 'İş Arayışı'],
        highlight: 'İş başvuruları ve LinkedIn bağlantıları için ideal'
      },
      {
        id: `bio-prof-2-${Date.now()}`,
        tone: 'professional',
        toneName: 'Kurumsal & Profesyonel',
        emoji: '💼',
        text: `${cleanRole}. ${primarySkill} ve ${secondarySkill} ekosisteminde kullanıcı odaklı mimariler ve temiz kod prensipleriyle projeler inşa ediyorum.`,
        tags: ['Temiz Kod', 'Mimari', 'Performans'],
        highlight: 'Teknik liderlik ve kurumsal iş birlikleri için tavsiye edilir'
      }
    )
  }

  // 2. Samimi & Girişimci
  if (tone === 'casual' || tone === 'all') {
    results.push(
      {
        id: `bio-cas-1-${Date.now()}`,
        tone: 'casual',
        toneName: 'Samimi & Girişimci',
        emoji: '🚀',
        text: `Fikirleri çalışan dijital ürünlere dönüştürüyorum 🚀 ${cleanRole} olarak ${primarySkill} ve modern web teknolojileriyle üretmeyi seviyorum!`,
        tags: ['Girişimci', 'Ürün Odaklı', 'Enerjik'],
        highlight: 'SaaS kurucuları, staj ve freelance projeler için mükemmel'
      },
      {
        id: `bio-cas-2-${Date.now()}`,
        tone: 'casual',
        toneName: 'Samimi & Girişimci',
        emoji: '✨',
        text: `Kod yazmak, yeni şeyler denemek ve açık kaynak dünyası 💡 ${cleanRole} adayı | ${skillsText} ile geleceğin webini inşa ediyorum.`,
        tags: ['Açık Kaynak', 'Topluluk', 'İnovasyon'],
        highlight: 'Topluluk odaklı ve ilham veren samimi üslup'
      }
    )
  }

  // 3. Minimalist & Siberpunk / Tech
  if (tone === 'minimalist' || tone === 'all') {
    results.push(
      {
        id: `bio-min-1-${Date.now()}`,
        tone: 'minimalist',
        toneName: 'Minimalist & Siberpunk',
        emoji: '⚡',
        text: `Code. Ship. Iterate. ⚡ ${cleanRole} // Stack: ${skillsText}`,
        tags: ['Minimal', 'Geek', 'Doğrudan'],
        highlight: 'GitHub ve teknik portfolyolar için sade ve vurucu'
      },
      {
        id: `bio-min-2-${Date.now()}`,
        tone: 'minimalist',
        toneName: 'Minimalist & Siberpunk',
        emoji: '💻',
        text: `${cleanRole} 🚀 ${primarySkill} & ${secondarySkill} mimarı. Hızlı, hafif ve kusursuz arayüzler.`,
        tags: ['Hızlı', 'Kusursuz Arayüz', 'Teknik'],
        highlight: 'Net ve dikkat dağıtmayan modern siber görünüm'
      }
    )
  }

  // 4. Yaratıcı & Meraklı
  if (tone === 'creative' || tone === 'all') {
    results.push(
      {
        id: `bio-cre-1-${Date.now()}`,
        tone: 'creative',
        toneName: 'Yaratıcı & Meraklı',
        emoji: '🎨',
        text: `Piksellerle mantığın kesişiminde harikalar tasarlıyorum ✨ ${cleanRole} & ${primarySkill} aşığı. Merak et, keşfet, üret!`,
        tags: ['UI/UX', 'Yaratıcı', 'Tasarım'],
        highlight: 'Tasarımcı-geliştirici melez profiller için benzersiz'
      },
      {
        id: `bio-cre-2-${Date.now()}`,
        tone: 'creative',
        toneName: 'Yaratıcı & Meraklı',
        emoji: '☕',
        text: `Kahve içer, problem çözer, zarif arayüzler kodlar ☕ ${cleanRole} | ${skillsText}.`,
        tags: ['Problem Çözücü', 'Kahve & Kod', 'Zarif'],
        highlight: 'Akılda kalıcı, sevecen ve profesyonel etki'
      }
    )
  }

  // Karakter sayısını hesapla ve sırala
  return results.map(item => ({
    ...item,
    charCount: item.text.length
  }))
}

// GET /api/ai/tones (Desteklenen ses tonları ve önerilen yetenekler)
router.get('/tones', (req, res) => {
  res.json({
    tones: AI_TONES,
    suggestedRoles: SUGGESTED_ROLES,
    suggestedSkills: SUGGESTED_SKILLS
  })
})

// POST /api/ai/generate-bio (Biyografi metinleri üretir)
router.post('/generate-bio', async (req, res) => {
  try {
    const { role, skills, tone, keywords, currentBio } = req.body || {}

    // Seçilen tona göre veya tüm tonlarda alternatifler üret
    const generatedBios = generateBiosContextually({
      role,
      skills,
      tone: tone || 'all',
      keywords,
      currentBio
    })

    res.json({
      success: true,
      count: generatedBios.length,
      data: generatedBios,
      meta: {
        role: role || 'Full-Stack Geliştirici',
        tone: tone || 'all',
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('AI Biyografi üretim hatası:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Biyografi üretilirken bir sorun oluştu.' 
    })
  }
})

export default router
