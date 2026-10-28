# 📊 03 - VERİ MODELLERİ VE ŞEMALARI (DATA MODELS)

Bu dokümanda projenin tüm veri yapıları, tipleri ve doğrulama kuralları tanımlanmıştır. Kod üzerinde veri alanları değiştirilirken veya yeni alanlar eklenirken bu şemaya sadık kalınmalıdır.

---

## 1. Profil Modeli (`Profile`)

Kullanıcının kimlik ve başlık bilgilerini tutar.

```typescript
interface ProfileBadge {
  id: string | number;     // Benzersiz rozet kimliği
  text: string;            // Rozet metni (örn: "Full-Stack Developer")
  icon?: string;           // Lucide ikon adı ('Code' | 'Sparkles' | 'MapPin' | 'Briefcase' | 'Heart' | 'Coffee' | 'Star' | 'Flame' | 'Zap' | 'Award' | 'Terminal')
  color?: string;          // Rozet renk stili ('default' | 'yellow' | 'emerald' | 'blue' | 'purple' | 'rose')
}

interface Profile {
  name: string;           // Görünen ad soyad (örn: "Tuba Gül")
  username: string;       // Kullanıcı adı (örn: "@tubagul")
  bio: string;            // Kısa açıklama veya unvan
  avatar: string;         // Profil resmi URL'i veya Base64 veri
  avatarShape?: string;   // Avatar şekli ('circle' | 'squircle' | 'rounded')
  avatarGlow?: string;    // Avatar parıltı rengi ('yellow' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'none')
  statusText?: string;    // Durum/çalışma rozeti metni (örn: "Yeni Projelere & Fırsatlara Açık")
  statusColor?: string;   // Durum rozeti rengi ('emerald' | 'amber' | 'blue' | 'purple' | 'none')
  isVerified?: boolean;   // Doğrulanmış profil onay rozeti (varsayılan: true)
  banner?: string;        // Profil kapağı görsel URL'i veya Base64 veri
  bannerPattern?: string; // Hazır kapak deseni ('none' | 'mesh' | 'cyberpunk' | 'aurora' | 'sunset' | 'grid' | 'dots' | 'waves' | 'carbon' | 'matrix' | 'luxury' | 'lines')
  badges?: ProfileBadge[]; // Dinamik yetenek ve ilgi alanı rozetleri
  socialLinks?: {         // Profil başlığı altındaki hızlı erişim sosyal medya bağlantıları
    github?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    email?: string;
    // Görünürlük & Aktiflik Kontrolleri
    githubActive?: boolean;    // GitHub butonu aktif/görünür mü
    linkedinActive?: boolean;  // LinkedIn butonu aktif/görünür mü
    instagramActive?: boolean; // Instagram butonu aktif/görünür mü
    twitterActive?: boolean;   // Twitter/X butonu aktif/görünür mü
    youtubeActive?: boolean;   // YouTube butonu aktif/görünür mü
    emailActive?: boolean;     // E-Posta butonu aktif/görünür mü
    // Bar & Şekillendirme Seçenekleri
    barVisible?: boolean;      // Sosyal medya barının genel görünürlüğü (varsayılan: true)
    shape?: string;            // 'rounded-full' | 'rounded-xl' | 'rounded-lg'
    style?: string;            // 'glass' | 'neon' | 'solid'
  };
  groupByCategory?: boolean;          // Profilde bağlantıları kategorilere göre klasörleme açma/kapama (varsayılan: false)
  foldersDefaultExpanded?: boolean;   // Klasörler açıkken varsayılan olarak açık mı kapalı mı başlasın (varsayılan: true)
  showBadges?: boolean;               // Profilde yetenek/rol rozetlerini göster/gizle (varsayılan: false)
}
```

### Varsayılan Değer:
```javascript
{
  name: 'Tuba Gül',
  username: '@tubagul',
  bio: 'Yazılım Mühendisliği Öğrencisi | Full-Stack Geliştirici Adayı 🚀',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  avatarShape: 'circle',
  avatarGlow: 'yellow',
  statusText: 'Yeni Projelere & Fırsatlara Açık',
  statusColor: 'emerald',
  isVerified: true,
  banner: '',
  bannerPattern: 'mesh',
  badges: [
    { id: 'badge-1', text: 'Full-Stack Developer', icon: 'Code', color: 'default' },
    { id: 'badge-2', text: 'Vue 3 & Express', icon: 'Sparkles', color: 'yellow' },
    { id: 'badge-3', text: 'İstanbul, TR', icon: 'MapPin', color: 'default' }
  ],
  socialLinks: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
    twitter: '',
    youtube: '',
    email: ''
  }
}
```

---

## 2. Bağlantı Modeli (`LinkItem`)

Her bir tıklanabilir profil bağlantısını temsil eder.

```typescript
interface LinkItem {
  id: number | string;      // Benzersiz kimlik (Date.now() veya UUID)
  title: string;            // Bağlantı başlığı (örn: "GitHub Projelerim")
  url: string;              // Tam bağlantı adresi (örn: "https://github.com/...")
  category?: string;        // Bağlantı kategorisi / klasör adı (örn: "🚀 Projeler & Kod", boş ise bağımsız kök bağlantı)
  isActive: boolean;        // Ziyaretçi ekranında gösterilip gösterilmeyeceği (varsayılan: true)
  icon?: string;            // İkon adı ('auto' | 'globe' | 'github' | 'linkedin' | 'instagram' | 'youtube' | 'twitter' | 'mail' | 'phone' | 'code' | 'music' | 'shopping-bag' | 'book')
  customColor?: string;     // Özel buton rengi ('default' | 'yellow' | 'charcoal' | 'emerald' | 'dark')
  clicks?: number;          // Tıklanma sayısı (analitik için)
  orderIndex?: number;      // Sıralama indeksi
  isScheduled?: boolean;    // Bağlantının zaman ayarlı olup olmadığı (varsayılan: false)
  scheduleStart?: string;   // Başlangıç tarihi / saati (ISO dizesi veya null)
  scheduleEnd?: string;     // Bitiş / yayından kalkma tarihi (ISO dizesi veya null)
  showCountdown?: boolean;  // Ziyaretçilere canlı geri sayım rozeti gösterilsin mi (varsayılan: true)
  // Smart Embed & Kilitli Link Alanları (v0.31.0)
  embedType?: string;       // 'none' | 'youtube' | 'spotify' | 'soundcloud'
  showEmbed?: boolean;      // Kart altında mini oynatıcı gösterimi (varsayılan: false)
  isLocked?: boolean;       // Korumalı / Kilitli bağlantı mı (varsayılan: false)
  lockType?: string;        // 'pin' (4 haneli şifre) | 'age' (18+ yaş onayı)
  passcode?: string;        // PIN şifresi (örn: "1234")
  lockWarning?: string;     // Kilit açma modalında gösterilecek özel uyarı mesajı
}

interface LinkFolderGroup {
  category: string;         // Klasör / Kategori adı
  items: LinkItem[];        // Bu kategoriye ait bağlantılar dizisi
}
```

### PostgreSQL Veritabanı Sütunları (`links`):
```sql
ALTER TABLE links ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '';
ALTER TABLE links ADD COLUMN IF NOT EXISTS embed_type VARCHAR(20) DEFAULT 'none';
ALTER TABLE links ADD COLUMN IF NOT EXISTS show_embed BOOLEAN DEFAULT false;
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE links ADD COLUMN IF NOT EXISTS lock_type VARCHAR(20) DEFAULT 'pin';
ALTER TABLE links ADD COLUMN IF NOT EXISTS passcode VARCHAR(50) DEFAULT '';
ALTER TABLE links ADD COLUMN IF NOT EXISTS lock_warning VARCHAR(255) DEFAULT '';
```

---

## 3. Tema Modeli (`ThemeOption`)

Profil sayfasının görsel atmosferini ve renk gradyanlarını belirler.

```typescript
interface ThemeOption {
  id: string;               // 'midnight' | 'emerald' | 'sunset' | 'ocean' | 'monochrome'
  name: string;             // Tema adı (örn: "Gece Moru")
  description: string;      // Tema açıklaması
  previewGradient: string;  // Önizleme gradyan sınıfı
  backgroundClass: string;  // Profil ana arka plan sınıfı
  cardClass: string;        // Bağlantı kartı cam ve kenarlık stili
  accentText: string;       // Vurgu metin rengi
  avatarGlow: string;       // Avatar etrafındaki parıltı gradyanı
  badgeClass: string;       // Rozet stil sınıfı
}
```

---

## 4. Kullanıcı ve Yetkilendirme Modeli (`AdminUser` & `AuthSession`)

Yönetim paneline erişim ve JWT oturum yapısını tanımlar.

```typescript
interface AdminUser {
  id: number;               // Benzersiz kullanıcı kimliği
  username: string;         // Yönetici kullanıcı adı (örn: "admin")
  email?: string;           // Kullanıcı e-posta adresi (örn: "admin@linktree.local")
  passwordHash?: string;    // Bcrypt ile hashlenmiş parola (veritabanında)
  name: string;             // Yönetici tam adı (örn: "Tuba Gül")
  createdAt: string;        // Kayıt tarihi
}

interface AuthSession {
  token: string;            // JWT Bearer Token
  user: {
    id: number;
    username: string;
    email?: string;
    name: string;
  };
}

interface AdminSettings {
  adminTheme: 'dark' | 'light'; // Yönetim paneli arayüz modu (varsayılan: 'dark')
}
```

---

## 5. Doğrulama Kuralları (Validation Rules)

1. **URL Doğrulama**:
   - `url` boş olamaz.
   - `http://` veya `https://` ile başlamıyorsa otomatik olarak `https://` ön eki eklenmelidir.
2. **Başlık Doğrulama**:
   - `title` alanı minimum 2 karakter, maksimum 60 karakter olmalıdır.
   - Boşluklardan arındırıldığında (`trim()`) boş olamaz.
3. **Profil Alanları**:
   - `name`: Zorunlu, maks 50 karakter.
   - `username`: `@` ile başlamalı veya otomatik eklenmeli.
   - `bio`: Maks 160 karakter (Twitter/Instagram biyografi standardı).
   - `avatar`: Geçerli bir resim URL'si olmalıdır.

---

## 6. Ziyaretçi & QR Kod Cihaz Analitiği Modeli (`VisitAnalytics` & `VisitRecord`)

QR kod ile veya doğrudan gelen ziyaretçilerin cihaz türünü (mobil vs masaüstü tarayıcı) ve kaynaklarını saklar.

```typescript
type DeviceType = 'mobile' | 'desktop'; // Mobil cihaz (telefon/tablet) vs Masaüstü Tarayıcı
type TrafficSource = 'qr' | 'direct';   // QR Kod Taraması (?src=qr) vs Doğrudan Bağlantı

interface VisitRecord {
  id?: number;
  device: DeviceType;
  source: TrafficSource;
  userAgent?: string;
  createdAt?: string;
}

interface VisitAnalytics {
  totalVisits: number;      // Toplam sayfa görüntülenme
  qrVisits: number;         // QR kod okutularak yapılan toplam ziyaretler
  directVisits: number;     // Doğrudan bağlantı ile tarayıcıdan gelenler
  qrMobile: number;         // QR okutup MOBİLDEN girenler
  qrDesktop: number;        // QR okutup MASAÜSTÜ/TARAYICIDAN girenler
  totalMobile: number;      // Genel tüm mobil ziyaretler
  totalDesktop: number;     // Genel tüm masaüstü/tarayıcı ziyaretleri
  qrMobilePercent: number;  // QR ile gelenlerin mobil oranı (%0-100)
  qrDesktopPercent: number; // QR ile gelenlerin masaüstü oranı (%0-100)
}
```

### Varsayılan Başlangıç Değerleri:
```javascript
{
  totalVisits: 142,
  qrVisits: 84,
  directVisits: 58,
  qrMobile: 76,
  qrDesktop: 8,
  totalMobile: 105,
  totalDesktop: 37,
  qrMobilePercent: 90,
  qrDesktopPercent: 10
}
```

---

## 7. İletişim & Lead Capture Mesaj Modeli (`ContactMessage`)

Ziyaretçilerin profil sayfasındaki "Bana Mesaj Bırakın" formundan ilettiği talepleri saklar.

```typescript
interface ContactMessage {
  id: number;           // Benzersiz mesaj ID
  name: string;         // Gönderen Adı Soyadı (2-100 karakter)
  email: string;        // Gönderen E-posta adresi (regex doğrulamalı, maks 255 karakter)
  message: string;      // İletilen mesaj içeriği (5-2000 karakter)
  isRead: boolean;      // Admin tarafından okunup okunmadığı (varsayılan: false)
  createdAt: string;    // Gönderim zaman damgası (ISO string)
}
```

### PostgreSQL Veritabanı Tablosu (`messages`):
```sql
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### API İletişim Payload Örneği:
```json
{
  "name": "Can Demir",
  "email": "can@example.com",
  "message": "Merhaba, danışmanlık hizmetleriniz hakkında bilgi alabilir miyim?"
}
```

---

## 8. Özel Alan Adı & SEO / OpenGraph Modeli (`SeoSettings`)

Sosyal medya platformlarında (WhatsApp, Twitter, LinkedIn, Telegram) ve arama motorlarında profil linkinin nasıl görüneceğini ve özel domain DNS entegrasyonunu tanımlar.

```typescript
interface SeoSettings {
  metaTitle: string;        // Sayfa ve paylaşım başlığı (og:title, maks 60 karakter)
  metaDescription: string;  // Sayfa ve paylaşım açıklaması (og:description, maks 160 karakter)
  ogImage: string;          // Sosyal medya kart görseli URL'si (1200x630 önerilen)
  customDomain: string;     // Özel alan adı (örn: "tubagul.dev" veya "links.tubagul.com")
  domainVerified: boolean;  // DNS CNAME ve A-kaydının doğrulanıp doğrulanmadığı
}

interface DnsVerificationRecord {
  domain: string;
  verified: boolean;
  verifiedAt: string;
  cnameTarget: string;      // "cname.linkspace.me"
  ipTarget: string;         // "76.76.21.21"
  sslActive: boolean;
}
```

### PostgreSQL Veritabanı Depolama Biçimi (`settings` tablosunda):
```sql
-- key = 'seo'
-- value = JSONB string
INSERT INTO settings (key, value)
VALUES ('seo', '{"metaTitle":"Tuba Gül - Full-Stack Developer | linkspace","metaDescription":"Tuba Gül projeleri ve portfolyosu.","ogImage":"...","customDomain":"tubagul.dev","domainVerified":true}');
```

---

## 9. Yapay Zeka Biyografi Modeli (`AiBioAssistant`)

Biyografi metinlerinin yapay zeka tarafından kullanıcının unvanı, yetenekleri ve ton seçimine göre üretilmesini sağlayan veri yapılarıdır.

```typescript
type AiBioToneId = 'all' | 'professional' | 'casual' | 'minimal' | 'creative';

interface AiBioTone {
  id: AiBioToneId;
  name: string;        // Örn: "Kurumsal & Profesyonel"
  desc: string;        // Örn: "LinkedIn, portfolyo ve iş teklifleri için net ve güven veren üslup."
  icon: string;        // 'Briefcase' | 'Rocket' | 'Zap' | 'Palette' | 'Sparkles'
}

interface AiBioOption {
  id: string;          // Örn: "bio-1"
  text: string;        // Maks 160 karakter optimize edilmiş biyografi metni
  tone: string;        // 'professional' | 'casual' | 'minimal' | 'creative'
  toneLabel: string;   // '💼 Profesyonel' | '🚀 Samimi & Girişimci' | '⚡ Minimalist' | '🎨 Yaratıcı'
  tags: string[];      // İlgili anahtar kelimeler
}

interface AiBioGeneratePayload {
  role: string;        // Kullanıcının unvanı (örn: "Yazılım Mühendisliği Öğrencisi")
  skills: string[];    // Seçilen yetenekler (örn: ["Vue 3", "Node.js", "PostgreSQL"])
  tone: AiBioToneId;   // Hedef ses tonu ('all' | 'professional' | 'casual' | 'minimal' | 'creative')
  currentBio?: string; // Mevcut biyografi (varsa bağlam olarak)
}
```

### API Yanıt Örneği (`POST /api/ai/generate-bio`):
```json
{
  "success": true,
  "role": "Full-Stack Developer",
  "tone": "all",
  "count": 8,
  "bios": [
    {
      "id": "bio-1",
      "text": "Full-Stack Developer | Vue 3, Node.js & modern web mimarileri üzerine ölçeklenebilir çözümler geliştiriyorum.",
      "tone": "professional",
      "toneLabel": "💼 Profesyonel",
      "tags": ["Full-Stack Developer", "Vue 3", "Node.js"]
    },
    {
      "id": "bio-2",
      "text": "Kod yazıyor, ürün inşa ediyor ve her gün yeni şeyler deniyorum. 🚀 Vue 3 & Node.js ile fikirleri gerçeğe dönüştürme zamanı!",
      "tone": "casual",
      "toneLabel": "🚀 Samimi & Girişimci",
      "tags": ["Girişimci", "Vue 3", "Node.js"]
    }
  ]
}
```



