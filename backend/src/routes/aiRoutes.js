import { Router } from 'express'
import { aiLimiter } from '../middleware/rateLimiter.js'

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
 */
export const generateBiosContextually = ({ role, skills = [], tone = 'professional', keywords = '' }) => {
  const cleanRole = (role && role.trim()) ? role.trim() : 'Full-Stack Geliştirici'
  
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

  return results.map(item => ({
    ...item,
    charCount: item.text.length
  }))
}

/**
 * AI Copilot: Kullanıcının Hedefine Göre Otomatik Bio & Buton Başlığı Üreticisi
 */
export const generateCopilotRecommendations = ({ goal = '', role = '', currentBio = '' }) => {
  const text = `${goal} ${role} ${currentBio}`.toLowerCase()

  const isDev = text.includes('yazılım') || text.includes('kod') || text.includes('proje') || text.includes('developer') || text.includes('mühendis') || text.includes('github') || text.includes('web')
  const isCreator = text.includes('içerik') || text.includes('youtube') || text.includes('video') || text.includes('podcast') || text.includes('tiktok') || text.includes('instagram') || text.includes('kanal')
  const isBusiness = text.includes('butik') || text.includes('satış') || text.includes('müşteri') || text.includes('sipariş') || text.includes('e-ticaret') || text.includes('mağaza') || text.includes('kahve') || text.includes('hizmet')
  const isDesign = text.includes('tasarım') || text.includes('ui') || text.includes('ux') || text.includes('figma') || text.includes('sanat') || text.includes('portfolyo')

  let bios = []
  let buttonTitles = []

  if (isDev) {
    bios = [
      {
        text: '💻 Kod. Üretim. Açık Kaynak. Full-Stack projelerimi ve canlı web uygulamalarımı keşfedin ⚡',
        headline: 'Mühendislik & Ürün Odaklı Bio',
        badge: 'Yüksek CTR'
      },
      {
        text: '🚀 Fikirleri çalışan, performanslı dijital ürünlere dönüştürüyorum. En son projelerim aşağıda! 👇',
        headline: 'Girişimci & Portfolyo Bio',
        badge: 'Önerilen'
      },
      {
        text: '⚡ Temiz kod, modern mimari ve kullanıcı odaklı web deneyimleri inşa ediyorum. İş birliklerine açığım 🤝',
        headline: 'Kariyer & İş Fırsatları',
        badge: 'Profesyonel'
      }
    ]

    buttonTitles = [
      {
        title: '🚀 Öne Çıkan Canlı Web Projelerim',
        category: 'Projelerim',
        suggestedUrl: 'https://github.com',
        description: 'Ziyaretçileri doğrudan çalışan demolarınıza yönlendirir (+%45 tıklama)'
      },
      {
        title: '⚡ GitHub Repolarım & Açık Kaynak Kodlar',
        category: 'Yazılım',
        suggestedUrl: 'https://github.com',
        description: 'Teknik yetkinliğinizi ve kod kalitenizi kanıtlar'
      },
      {
        title: '📄 Güncel CV & Mühendislik Portfolyom',
        category: 'Kariyer',
        suggestedUrl: 'https://linkedin.com',
        description: 'İK ve staj değerlendiricileri için doğrudan erişim'
      },
      {
        title: '☕ 15 Dakikalık Hızlı Tanışma / Mentörlük',
        category: 'İletişim',
        suggestedUrl: 'https://cal.com',
        description: 'Net bir eylem çağrısı ile randevu almanızı sağlar'
      }
    ]
  } else if (isCreator) {
    bios = [
      {
        text: '🎬 Haftalık teknoloji ve yazılım videoları üretiyorum. En yeni videomu kaçırma! 🚀',
        headline: 'İçerik Üreticisi Bio',
        badge: 'Viral Odaklı'
      },
      {
        text: '✨ Dijital dünyaya dair ilham verici içerikler, ipuçları ve topluluğumuz aşağıda 👇',
        headline: 'Topluluk & Kanal Bio',
        badge: 'Önerilen'
      },
      {
        text: '🎙️ Yeni bölüm yayında! Tüm platformlardan tek tıkla dinleyin ve abone olun ⚡',
        headline: 'Podcast & Medya',
        badge: 'Dönüşüm Odaklı'
      }
    ]

    buttonTitles = [
      {
        title: '🔥 En Son YouTube Videomu İzle (Yeni!)',
        category: 'Videolar',
        suggestedUrl: 'https://youtube.com',
        description: 'Ziyaretçilerin en taze içeriğinize tıklama oranını 2x artırır'
      },
      {
        title: '🎙️ Spotify & Apple Podcasts Bölümlerimiz',
        category: 'Yayınlar',
        suggestedUrl: 'https://spotify.com',
        description: 'Mini embed çalar ile doğrudan profilinizden dinletir'
      },
      {
        title: '💬 Özel Discord / Telegram Topluluğumuza Katıl',
        category: 'Topluluk',
        suggestedUrl: 'https://discord.gg',
        description: 'Sadık takipçi kitlenizi tek bir çatı altında toplar'
      },
      {
        title: '📩 Haftalık Ücretsiz Bültenime Abone Ol',
        category: 'Bülten',
        suggestedUrl: 'https://substack.com',
        description: 'E-posta listenizi hızla büyütür'
      }
    ]
  } else if (isBusiness) {
    bios = [
      {
        text: '✨ Özel tasarım ürünler ve seçkin koleksiyonumuz. Hızlı kargo & güvenli sipariş 🛍️',
        headline: 'E-Ticaret & Satış Bio',
        badge: 'Yüksek Satış'
      },
      {
        text: '💛 Hayatınıza keyif katan lezzetler ve özel menümüz. Hemen inceleyin ve sipariş verin! ☕',
        headline: 'Kafe & İşletme Bio',
        badge: 'Önerilen'
      },
      {
        text: '🚀 İşinizi büyütecek profesyonel çözümler ve danışmanlık hizmetleri. Teklif alın 👇',
        headline: 'B2B & Hizmet Bio',
        badge: 'Kurumsal'
      }
    ]

    buttonTitles = [
      {
        title: '🛍️ Yeni Sezon Koleksiyonunu İncele & Satın Al',
        category: 'Ürünlerimiz',
        suggestedUrl: 'https://shop.com',
        description: 'Alışveriş yapan müşteriler için net eylem çağrısı'
      },
      {
        title: '🔥 Günün İndirimi: %25 Fırsat Kuponunu Yakala',
        category: 'Kampanyalar',
        suggestedUrl: 'https://shop.com/discount',
        description: 'Aciliyet hissi vererek anlık satışları tetikler'
      },
      {
        title: '💬 WhatsApp ile Anında Sipariş & Destek',
        category: 'Destek',
        suggestedUrl: 'https://wa.me',
        description: 'Kararsız müşterilere anında satış kapatma kanalı'
      },
      {
        title: '📍 Konum & Mağazamıza Yol Tarifi Al',
        category: 'Ziyaret',
        suggestedUrl: 'https://maps.google.com',
        description: 'Fiziksel mekanınıza ziyaretçi çeker'
      }
    ]
  } else if (isDesign) {
    bios = [
      {
        text: '🎨 Estetik ve işlevselliğin kesiştiği piksel kusursuzluğunda arayüzler tasarlıyorum ✨',
        headline: 'Tasarım & UI/UX Bio',
        badge: 'Portfolyo'
      },
      {
        text: '💡 Kullanıcı deneyimini dönüştüren modern dijital ürün tasarımları. Vaka çalışmalarım aşağıda 👇',
        headline: 'Case Study Odaklı',
        badge: 'Önerilen'
      },
      {
        text: '✨ Fikirleri zarif tasarımlara dönüştürüyorum. Yeni freelance projelere açığım 🚀',
        headline: 'Freelance & İş',
        badge: 'İş Arayışı'
      }
    ]

    buttonTitles = [
      {
        title: '✨ Behance & Dribbble Seçme Tasarımlarım',
        category: 'Portfolyo',
        suggestedUrl: 'https://dribbble.com',
        description: 'Görsel portfolyonuzu sergileyerek güven yaratır'
      },
      {
        title: '🔍 Figma Case Study: Sıfırdan Ürün Tasarımı',
        category: 'Vaka Çalışmaları',
        suggestedUrl: 'https://figma.com',
        description: 'Tasarım sürecinizi ve düşünce yapınızı gösterir'
      },
      {
        title: '📅 Yeni Bir Tasarım Projesi Başlatalım',
        category: 'İletişim',
        suggestedUrl: 'https://cal.com',
        description: 'Müşterileri anında teklif ve görüşmeye çeker'
      }
    ]
  } else {
    // Genel / Varsayılan
    bios = [
      {
        text: `✨ Dijital dünyadaki tüm bağlantılarım, projelerim ve paylaşımlarım tek merkezde! 👇`,
        headline: 'Evrensel & Net Bio',
        badge: 'Önerilen'
      },
      {
        text: `🚀 Sürekli öğrenen, üreten ve paylaşan biri. Beni takip edebileceğiniz tüm kanallar aşağıda ⚡`,
        headline: 'Samimi & Kişisel Bio',
        badge: 'Popüler'
      },
      {
        text: `💼 Profesyonel çalışmalarım, sosyal medya hesaplarım ve doğrudan iletişim kanallarım 🤝`,
        headline: 'İş & İletişim Bio',
        badge: 'Profesyonel'
      }
    ]

    buttonTitles = [
      {
        title: '🌟 En Çok Sevilen Çalışmalarım & Projelerim',
        category: 'Öne Çıkanlar',
        suggestedUrl: 'https://example.com',
        description: 'Ziyaretçilerin en değerli içeriğinizi kaçırmamasını sağlar'
      },
      {
        title: '🔗 Tüm Sosyal Medya & İçerik Kanallarım',
        category: 'Sosyal',
        suggestedUrl: 'https://instagram.com',
        description: 'Takipçi trafiğinizi diğer platformlara dağıtır'
      },
      {
        title: '📩 Bana Doğrudan Mesaj Gönderin',
        category: 'İletişim',
        suggestedUrl: 'mailto:info@example.com',
        description: 'Hızlı ve kolay iletişim sağlar'
      }
    ]
  }

  return {
    inferredTopic: isDev ? 'Yazılım & Mühendislik' : (isCreator ? 'İçerik Üretimi & Medya' : (isBusiness ? 'İşletme & E-Ticaret' : (isDesign ? 'Tasarım & Portfolyo' : 'Kişisel & Profesyonel'))),
    bios,
    buttonTitles
  }
}

/**
 * Akıllı Link Tıklama Tahmini & Tavsiye Motoru (Rule Engine)
 */
export const generateSmartInsights = ({ links = [], totalVisits = 0, analytics = {} }) => {
  const insights = []
  const activeLinks = (links || []).filter(l => !l.isHeader && l.isActive !== false)

  if (activeLinks.length === 0) {
    return [
      {
        id: 'no-links',
        type: 'create_link',
        priority: 'high',
        icon: 'Sparkles',
        title: 'İlk Bağlantınızı Ekleyin',
        message: 'Henüz aktif bir bağlantınız bulunmuyor. AI Copilot ile hedefinize uygun başlıklar üretebilirsiniz.',
        actionLabel: 'AI ile Başlık Üret',
        actionType: 'open_copilot'
      }
    ]
  }

  // 1. Kural: Listenin altında kalmış gizli şampiyon (Top Clicked link is below position 1)
  const sortedByClicks = [...activeLinks].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
  const topLink = sortedByClicks[0]

  if (topLink && (topLink.clicks || 0) > 2) {
    const currentIndex = activeLinks.findIndex(l => l.id === topLink.id)
    if (currentIndex > 0) {
      insights.push({
        id: `move-top-${topLink.id}`,
        type: 'reorder',
        priority: 'high',
        icon: 'Zap',
        title: 'Gizli Şampiyonu İlk Sıraya Taşıyın',
        message: `"${topLink.title}" bağlantınız ${topLink.clicks} tıklama ile en popüler linkiniz, ancak listenin ${currentIndex + 1}. sırasında. Onu ilk sıraya taşıyarak tıklanma oranınızı %35+ artırabilirsiniz.`,
        actionLabel: '⚡ İlk Sıraya Taşı',
        actionType: 'move_to_top',
        targetLinkId: topLink.id
      })
    }
  }

  // 2. Kural: Sıfır tık alan link uyarısı (Zero clicks despite overall traffic)
  const zeroClickLinks = activeLinks.filter(l => !l.clicks || l.clicks === 0)
  if (zeroClickLinks.length > 0 && totalVisits > 5) {
    const candidate = zeroClickLinks[0]
    insights.push({
      id: `zero-clicks-${candidate.id}`,
      type: 'cta_rewrite',
      priority: 'medium',
      icon: 'AlertCircle',
      title: 'Düşük Etkileşim: Başlığı Güçlendirin',
      message: `"${candidate.title}" henüz hiç tıklanmadı. Emojili ve net bir eylem çağrısı (CTA) eklemek tıklanma olasılığını 2 katına çıkarır.`,
      actionLabel: 'Başlığı Düzenle',
      actionType: 'edit_link',
      targetLinkId: candidate.id
    })
  }

  // 3. Kural: A/B Split Testi Kazananı Bildirimi
  const abTestLinks = activeLinks.filter(l => l.abTestEnabled)
  for (const abLink of abTestLinks) {
    const a = abLink.clicksA || 0
    const b = abLink.clicksB || 0
    const total = a + b
    if (total >= 4) {
      const leader = a > b ? 'A' : (b > a ? 'B' : 'Berabere')
      if (leader !== 'Berabere') {
        const leaderTitle = leader === 'A' ? abLink.title : (abLink.titleB || abLink.title)
        insights.push({
          id: `ab-winner-${abLink.id}`,
          type: 'ab_test_winner',
          priority: 'high',
          icon: 'Trophy',
          title: `A/B Testi Kazananı Belirlendi: Varyant ${leader}`,
          message: `"${abLink.title}" testinde Varyant ${leader} ("${leaderTitle}") %${Math.round((Math.max(a, b) / total) * 100)} oranla önde. Bu varyantı varsayılan yapabilirsiniz.`,
          actionLabel: `Varyant ${leader}'yı Uygula`,
          actionType: 'apply_ab_winner',
          targetLinkId: abLink.id,
          winningVariant: leader
        })
      }
    }
  }

  // 4. Kural: Çok fazla link varsa klasörleme / akordeon tavsiyesi
  if (activeLinks.length >= 7) {
    insights.push({
      id: 'grouping-advice',
      type: 'grouping',
      priority: 'low',
      icon: 'Folder',
      title: 'Akıllı Klasörleme ile Okunabilirliği Artırın',
      message: `${activeLinks.length} adet aktif bağlantınız var. Bağlantılarınızı kategorilere ayırarak veya Akordeon Klasörleme modunu açarak ziyaretçilerinizin dikkatini toplayabilirsiniz.`,
      actionLabel: 'Klasörlemeyi İncele',
      actionType: 'enable_grouping'
    })
  }

  return insights
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
router.post('/generate-bio', aiLimiter, async (req, res) => {
  try {
    const { role, skills, tone, keywords, currentBio } = req.body || {}

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

// POST /api/ai/copilot (Hedefe Göre Otomatik Bio & Buton Başlığı Üretimi)
router.post('/copilot', aiLimiter, async (req, res) => {
  try {
    const { goal, role, currentBio } = req.body || {}
    const recommendations = generateCopilotRecommendations({
      goal: goal || '',
      role: role || '',
      currentBio: currentBio || ''
    })

    res.json({
      success: true,
      data: recommendations,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Copilot hatası:', error)
    res.status(500).json({
      success: false,
      error: 'AI Copilot önerileri üretilirken hata oluştu.'
    })
  }
})

// POST /api/ai/insights (Link Tıklama Tahmini ve Tavsiyesi - Kural Motoru)
router.post('/insights', async (req, res) => {
  try {
    const { links = [], totalVisits = 0, analytics = {} } = req.body || {}
    const insights = generateSmartInsights({ links, totalVisits, analytics })

    res.json({
      success: true,
      insights,
      count: insights.length,
      evaluatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Insights hatası:', error)
    res.status(500).json({
      success: false,
      error: 'Akıllı tavsiyeler üretilirken hata oluştu.'
    })
  }
})

export default router
