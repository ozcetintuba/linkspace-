# 🔍 02 - MEVCUT DURUM VE TEKNİK BORÇ ANALİZİ (CURRENT STATE)

> **Son Güncelleme**: 23 Ekim 2026 (Zengin Link Türleri: Akıllı Embed Oynatıcı & Kilitli/Hassas Linkler - v0.31.0)  
> **Durum**: Full-Stack Mimari (Express + PostgreSQL + Vue 3) + Dribbble Sales CRM (#0C0C0B, #161616, #FFFF00) Tasarım Sistemi  
> **Proje Türü**: Full-Stack Linktree & Link Hub (CRM Dark & Light Edition)

---

## 1. Aktif Bileşenler ve Servisler

### A. `backend/` (Express.js REST API Servisi)
- **Sunucu Portu**: `:5000`
- **Uç Noktalar**:
  - `/api/profile`: Profil GET & PUT (sosyal medya bağlantıları `socialLinks JSONB` dahil).
  - `/api/profile/:username`: Ziyaretçiler için profil ve yalnızca aktif (`is_active = true`) bağlantılar (olmayan kullanıcıda 404 durumu, graceful fallback korumalı).
  - `/api/links`: CRUD, atomik tıklama artırma (`/click`), sıralama güncelleme (`PUT /reorder` & `POST /reorder`), sayaç sıfırlama (`/reset-clicks`). **Güvenli ve Geçerli URL Regex doğrulamalı (`isValidUrl`), XSS korumalı (`javascript:`, `data:` vb. engelleme)**. **Zaman Ayarlı / Süresi Dolan Bağlantı Desteği (`is_scheduled`, `schedule_start`, `schedule_end`, `show_countdown`)**; süresi dolan bağlantılar ziyaretçi sorgularında (`profileRoutes.js`) otomatik olarak filtrelenerek gizlenir. **Bağlantı Kategorileri & Klasörler (`category` VARCHAR)**: Bağlantıları klasörler altında gruplama, akordeon açılır/kapanır gösterim ve kategori filtreleme. **Zengin Link Türleri (Smart / Rich Links)**: Otomatik URL algılamalı mini oynatıcı embed desteği (`embed_type`, `show_embed` - YouTube, Spotify, SoundCloud) ve kilitli bağlantı koruması (`is_locked`, `lock_type`, `passcode`, `lock_warning` - 4 haneli PIN şifresi veya 18+ yaş onayı modalı).
  - `/api/ai/tones`, `/api/ai/generate-bio`: Yapay zeka biyografi metin üretim motoru. Kullanıcının unvanı, uzmanlık etiketleri ve ses tonuna göre 4 farklı stilde (Kurumsal, Samimi & Girişimci, Minimalist Siberpunk, Yaratıcı) karakter limitli (160 karaktere tam uyumlu) bio alternatifleri üretir. Kesintisiz çevrimdışı fallback mimarilidir.
  - `/api/settings/theme`: Tema okuma ve kaydetme (çevrimdışı bellek içi fallback korumalı).
  - `/api/settings/seo`: OpenGraph başlık, açıklama, görsel ve özel domain yapılandırması (GET public & PUT auth korumalı, çevrimdışı fallback korumalı).
  - `/api/settings/verify-domain`: Özel alan adı DNS CNAME ve A-kaydı doğrulama testi (POST auth korumalı).
  - `/api/auth/register`: Yeni kullanıcı kaydı (email, benzersiz kullanıcı adı kontrolü, bcrypt parola hashleme ve profil tohumlama).
  - `/api/auth/login`, `/api/auth/me`, `/api/auth/change-password`: JWT tabanlı oturum açma, doğrulama ve şifre değiştirme.
  - `/api/analytics`: Ziyaretçi ve QR cihaz analitiği (GET `/`, POST `/visit`, POST `/simulate`, POST `/reset`).
  - `/api/messages`: Ziyaretçi mesaj gönderimi (`POST /`), admin mesaj listesi ve okunmamış sayısı (`GET /`), okundu durumu güncelleme (`PATCH /:id/read`), mesaj silme (`DELETE /:id`), anlık demo mesaj simülasyonu (`POST /simulate`). Dayanıklı bellek içi fallback (offline-resilient in-memory fallback) korumalı.
  - `/api/docs`, `/api/docs/swagger.json`, `/api/docs/postman.json`: İnteraktif Swagger UI, raw OpenAPI 3.0 JSON ve indirilebilir Postman koleksiyonu.
  - `/api/health`: Canlılık kontrolü.
- **Üretim Dağıtım Mimarisi (Render & GitHub)**: Kök `package.json` ile tek komutta frontend ve backend derleme (`npm run build`), Express üzerinden `frontend/dist` statik SPA sunumu (`express.static` ve catch-all SPA router), `render.yaml` Blueprint ile tek tıkla PostgreSQL veritabanı + Node.js servisi orkestrasyonu.
- **Veritabanı Katmanı**:
  - `src/db.js`: PostgreSQL havuzu (`pg.Pool`).
  - `src/initDb.js`: `users`, `profiles`, `links`, `settings`, `visit_stats`, `messages` tablolarını kuran ve varsayılan verileri tohumlayan otomatik migration betiği (`links` tablosunda `is_scheduled`, `schedule_start`, `schedule_end`, `show_countdown` sütunları dahil).

### B. `frontend/` (Vue 3 SPA)
- **Durum Yönetimi (`linkStore.js` & `authStore.js`)**:
  - Hibrit API & LocalStorage senkronizasyonu: Backend API çalışırken tüm verileri PostgreSQL'den çeker ve PostgreSQL'e kaydeder; sunucu çevrimdışıyken tarayıcı LocalStorage'ına yumuşak geçiş yapar (`graceful fallback`).
  - `adminTheme` ('dark' | 'light') durumu ve 6 ziyaretçi teması.
  - `seoSettings` reaktif durumu, `updateSeoSettings`, `verifyCustomDomain` aksiyonları.
  - `generateBios(payload)` aksiyonu: AI biyografi üretim motoru, `AI_TONES`, `SUGGESTED_ROLES`, `SUGGESTED_SKILLS` sabitleri ve dayanıklı offline fallback algoritması.
  - `getScheduleStatus(link)` ve `formatForDatetimeInput(val)` zamanlama yardımcıları: Kalan süreyi gün/saat/dakika olarak hesaplar; `upcoming`, `active`, `expired` durumlarını belirler.
  - `authStore.login`, `authStore.register` ve `authStore.changePassword` aksiyonları ile tam kimlik doğrulama entegrasyonu.
  - Modernize edilmiş Vue Router navigation guard koruması (`return` tabanlı).
- **Kimlik Doğrulama Ekranı (`LoginView.vue`)**:
  - Giriş Yap ve Yeni Kayıt sekmeleri, e-posta format doğrulaması, demo doldurma butonu ve şık cam efektli kart tasarımı.
- **Yönetim Paneli (`AdminView.vue`)**:
  - **Orijinal Linktree Çift Sütunlu Düzen (Two-Column Split Layout)**:
    - **Sol Sütun**: Linktree sekme yapısı (**Bağlantılar**, **Görünüm & Tema**, **İstatistikler**, **Mesajlar**, **Ayarlar**).
    - **Sağ Sütun**: `sticky top-24` konumunda gerçek zamanlı canlı güncellenen iPhone 16 Pro çerçevesi (`PhonePreview.vue`).
    - **Mobil Yüzen Önizleme**: Mobil ekranlarda sağ altta yüzen `📱 Önizleme` butonu ve tam ekran kayan önizleme çekmecesi (drawer).
  - **Linktree Kart Tasarımı, Analitik & Zamanlama Rozetleri**:
    - Sürükleme tutamacı noktaları (`GripVertical`), iOS-stil yeşil aktif/pasif toggle switch, **küçük sayaç rozeti (`MousePointerClick`, tıklama sayısı ve toplam tıklamalar içindeki yüzde payı % CTR)**.
    - **Zaman Ayarlı Bağlantı Yönetimi (Ekleme & Düzenleme Modalı)**: Hızlı süre önayarları (`+24 Saat`, `+3 Gün`, `+1 Hafta`), `datetime-local` başlangıç/bitiş seçicileri ve canlı geri sayım gösterim toggle'ı.
    - **Bağlantı Kategorileri & Klasör Yönetimi**: Ekleme formu ve düzenleme modalında hızlı kategori çipleri (`🚀 Projeler & Kod`, `💼 Sosyal Medya & İletişim`, `🌐 Web & Portfolyo` vb.), serbest klasör adı girişi veya bağımsız link seçeneği.
    - **Yönetim Paneli Kategori Filtre Çubuğu**: Bağlantı listesi üzerinde "Tümü", aktif kategoriler ve "Bağımsız" filtre çipleri; her kartta klasör rozeti (`Folder` ikonu ile).
    - **Güvenli URL Girişi (Regex Doğrulaması)**: Yeni link eklerken ve düzenlerken `javascript:`, `data:` vb. tehlikeli URI şemaları engellenir; geçersiz URL formatlarında anlık kırmızı hata uyarısı (`AlertCircle`) gösterilir.
  - **Linktree Üst Bar & Paylaşım Çubuğu (Share Bar)**:
    - Yalın `linkspace` logosu, hızlı kopyalama butonu ve açılır dinamik SVG QR kod paylaşım modalı.
  - **Görünüm & Tema Sekmesi & AI Biyografi Asistanı**:
    - Profil kimliği (avatar, başlık, biyografi karakter sayacı), 6 profil teması ve yönetim paneli açık/koyu mod seçicileri.
    - **Yapay Zeka Biyografi Asistanı (`✨ AI ile Biyografi Yaz`)**: Biyografi alanının hemen yanında yer alan sihirli buton. Tıklandığında açılan modal üzerinden unvan seçimi/yazımı, popüler uzmanlık etiketleri, 4 farklı ses tonu (Kurumsal, Samimi & Girişimci, Minimalist Siberpunk, Yaratıcı) ve canlı bio üretim motoru. Üretilen biyografilerde anlık karakter sayacı, ton etiketleri, tek tıkla panoya kopyalama ve "Profile Uygula" butonu. Profil güncellendiğinde anında iPhone 16 Pro mockup'ına yansıma.
    - **Sosyal Medya İkon Barı Kişiselleştirmesi**: Genel bar görünürlük switch'i (`barVisible`), ikon şekil seçici (`rounded-full`, `rounded-xl`, `rounded-lg`), ikon görsel stili (`glass`, `neon`, `solid`), her platform için tekil aktif/pasif switch'i (GitHub, Instagram, LinkedIn, Twitter/X, YouTube, E-Posta) ve canlı iPhone 16 Pro önizleme senkronizasyonu.
  - **İstatistikler Sekmesi (Yüksek Kontrastlı Açık Tema Uyumu)**:
    - QR Kod Ziyareti ve Toplam Görüntülenme metrik rakamları beyaz temada koyu siyah (`text-black`), Mobil ve Masaüstü karşılaştırma kartları açık temada beyaz kart ve siyah başlıklarla tamamen okunabilir ve kontrastlı hale getirildi.
  - **Mesajlar Sekmesi (CRM Gelen Kutusu - Inbox)**:
    - Ziyaretçilerin profil sayfasından gönderdiği iletişim mesajlarının yönetildiği mini CRM paneli.
    - Okunmamış mesaj bildirim rozeti (`unreadMessagesCount`), 3'lü özet metrik kartı (Toplam Mesaj, Okunmamış, İncelenme Oranı), filtre sekmeleri (Tümü / Okunmamış / Okunmuş), tek tıkla "Örnek Mesaj Simüle Et" butonu, e-posta ile yanıtlama (`mailto:`), okundu/okunmadı durum toggle'ı ve silme eylemleri.
  - **Ayarlar Sekmesi & Sosyal Paylaşım Önizleme (SEO & OpenGraph Hub)**:
    - **Canlı Sosyal Kart Simülatörü**: WhatsApp (yeşil balon & küçük görsel), Twitter / X (büyük 16:9 banner & summary large image), LinkedIn (feed gönderi kartı) ve Telegram için 4 platformlu gerçekçi paylaşım kartı simülasyonu.
    - **Meta Tag Düzenleyici**: `og:title` ve `og:description` için canlı karakter limit sayaçları, `og:image` görsel linki ve tek tıkla hazır görsel şablonları (Avatar, Kapak, Kod & Teknoloji).
    - **Özel Alan Adı (Custom Domain) Entegrasyonu**: Kendi alan adını (örn: `tubagul.dev`) tanımlama, anlık DNS doğrulama testi (`POST /api/settings/verify-domain`), SSL aktivasyon durumu ve CNAME / A-kayıtları rehber tablosu (tek tıkla kopyalama).
    - Hesap ve oturum bilgileri, PostgreSQL bağlantı durumu, şifre değiştirme formu (`/api/auth/change-password`) ve oturumu sonlandırma.
- **Ziyaretçi Ekranı (`ProfileView.vue`)**:
  - **Dinamik OpenGraph & Meta Tag Senkronizasyonu**: Sayfa başlığı, `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` etiketleri sayfa açılışında anında dinamik olarak `<head>` içerisine işlenir.
  - **Özel Alan Adı ile Paylaşım**: Tanımlı ve doğrulanmış bir özel alan adı varsa Paylaşım Modalı içerisinden tek tıkla `https://tubagul.dev/` olarak paylaşabilme imkânı.
  - **İletişim & Mesaj Bırakma Formu (Lead Capture Modal)**:
    - Üst barda "İletişim" butonu ve linklerin hemen altında "Bana Mesaj Bırakın" etkileşimli davet kartı.
    - Tıklandığında açılan tam donanımlı modal: Ad Soyad, E-Posta, Mesaj alanları, canlı format doğrulamaları, animasyonlu gönderim durumu ve kutlama ikonlu başarı ekranı. Hem koyu hem de saf beyaz temada tam uyumlu.
  - **Dinamik Rota Kurulumu (`/:username`)**: `router/index.js` üzerinden `/:username` rotasını dinleyen dinamik profil bileşeni; `route.params.username` ile hedef kullanıcının profilini ve aktif linklerini çeker (`linkStore.fetchPublicProfile`).
  - **Uç Senaryo: Gelişmiş 404 Sayfası**: Olmayan bir username girildiğinde dinamik sayfa başlığı (`document.title = '404 - Profil Bulunamadı'`), `UserX` ikonu, açıklayıcı hata mesajı, "Ana Sayfaya Dön" ve "Giriş Yap / Kayıt Ol" aksiyonları sunan tam donanımlı 404 görünümü.
  - **Etkileşim Mantığı**: Butona tıklandığında asenkron olarak `/click` uç noktasına istek atar (`linkStore.trackClick`) ve hedef sekmeyi açar (`window.open(url, '_blank')`).
  - **Genişletilmiş Profesyonel Vitrin Hub'ı (Showcase Hub)**: Masaüstünde dar boşluğu gideren `max-w-2xl` genişlikte, ince sınır ve cam morfizmli (`#121212/85`, border `#262626`, `backdrop-blur-2xl`) ana kart tasarımı.
  - **Atmosferik Derinlik & Arka Plan**: Çift taraflı yumuşak neon ve amber ışık küreleri (`blur-[140px]`), dot-matrix teknolojik ızgara dokusu (`bg-ambient-grid`).
  - **Canlı Uygunluk Rozeti (Availability Badge)**: "🟢 Yeni Projelere & Fırsatlara Açık" animasyonlu zümrüt ping rozeti.
  - **Doğrulanmış Profil & Yetenek Çipleri**: İsim yanında sarı onay tiki (`CheckCircle2`), unvan, biyografi ve uzmanlık etiketleri (`Full-Stack Developer`, `Vue 3 & Node.js`, `İstanbul, TR`).
  - **Anlık Bağlantı Arama ve Filtreleme**: `searchQuery` ile anlık bağlantı arama çubuğu ve sıfır sonuç durum ekranı.
  - **Ziyaretçi Profil Teması Seçici Modalı (`Palette` Butonu)**: Ziyaretçilerin ve değerlendiricilerin profil sayfasından 6 farklı temayı (Minimalist Aydınlık dahil) anında deneyimlemesini sağlayan etkileşimli modal.
  - **Açık / Beyaz Tema Elektrik Sarı Kapsül Butonlar**: Beyaz temada (`pure-light`) Linktree link butonları tam yuvarlak kapsül (`rounded-full`), elektrik sarısı (`#FFFF00`) zemin, siyah başlık, siyah daire içinde sarı ikon ve siyah ok butonu ile render edilir; başlıkta `Yönetici` linki sade gri metin, `Paylaş` butonu ise elektrik sarısı kapsül olarak tasarlanmıştır.
  - **Yüzen Hızlı QR Butonu**: Ekranın sağ alt köşesinde kullanıcıyı takip eden zarif yüzen buton (`fixed bottom-5 right-5 sm:bottom-6 sm:right-6`). Beyaz temada yüksek kontrastlı elektrik sarısı kapsül olarak parlar.
  - **Sosyal Ağ Dock'u**: LinkedIn, GitHub, Instagram, Twitter, YouTube ve E-Posta butonları için kullanıcının seçtiği şekil (`rounded-full`, `rounded-xl`, `rounded-lg`) ve temaya (`glass`, `neon`, `solid`) duyarlı, pasif butonları gizleyen dinamik bar.
- **Canlı Mobil Önizleme Bileşeni (`PhonePreview.vue`)**:
  - iPhone 16 Pro gövdesi, Dynamic Island, 09:41/Wi-Fi/Pil durum çubuğu, gerçek zamanlı reaktif store bağlamı, beyaz temada sarı kapsül buton önizlemesi ve anında yansıyan sosyal medya buton konfigürasyonu.

### C. Konteyner Desteği (`docker-compose.yml`)
- Proje kökünde PostgreSQL 16 container tanımı ve kalıcı veri hacmi (`pgdata`) hazırlandı ve Docker üzerinde başarıyla ayağa kaldırıldı (`linktree-postgres`).

---

## 2. Teknik Durum ve Çözülen Görevler

| Başlık | Durum | Açıklama |
|:---|:---:|:---|
| **Pinia Store Entegrasyonu** | ✅ **ÇÖZÜLDÜ** | Tüm sayfalar merkezi reaktif store'a bağlandı. |
| **LocalStorage Kalıcılığı** | ✅ **ÇÖZÜLDÜ** | Sayfa yenilemelerinde yerel koruma sağlandı. |
| **Profil Düzenleme Arayüzü** | ✅ **ÇÖZÜLDÜ** | Görünüm sekmesinde avatar, isim, biyografi ve sosyal ağlar toplandı. |
| **Dinamik İkon Eşleme** | ✅ **ÇÖZÜLDÜ** | Domain bazlı Lucide ikon tespiti tamamlandı. |
| **Tıklama Sayacı & Analitik** | ✅ **ÇÖZÜLDÜ** | Tıklama takibi ve Linktree tarzı ilerleme çubuklu istatistik panosu kuruldu. |
| **Sıralama Değiştirme** | ✅ **ÇÖZÜLDÜ** | Yukarı/Aşağı ve sürükleme tutamaçları ile sıralama yönetimi tamamlandı. |
| **6 Çeşit Tema Sistemi** | ✅ **ÇÖZÜLDÜ** | Gece Moru, Zümrüt, Gün Batımı, Okyanus, Karbon ve Minimalist Aydınlık temaları eklendi. |
| **Express.js REST API Servisi**| ✅ **ÇÖZÜLDÜ** | `backend/` dizini altında tam teşekküllü REST API kuruldu. |
| **PostgreSQL Veritabanı Şeması**| ✅ **ÇÖZÜLDÜ** | `users`, `profiles`, `links`, `settings` tabloları ve migration oluşturuldu. |
| **Hibrit API/Yerel Senkronizasyon**| ✅ **ÇÖZÜLDÜ** | Frontend store API bağlantısına bağlandı, kesinti durumunda LocalStorage'a dayanır. |
| **Bağlantı Düzenleme Modalı** | ✅ **ÇÖZÜLDÜ** | Yönetim panelinde bağlantı başlığı, URL, ikon ve stil renk düzenleme modalı eklendi. |
| **JWT Kimlik Doğrulama & Hash**| ✅ **ÇÖZÜLDÜ** | Bcrypt parola şifreleme, JWT token üretimi ve `requireAuth` middleware'i tamamlandı. |
| **Yönetici Giriş Ekranı (Login)**| ✅ **ÇÖZÜLDÜ** | `LoginView.vue` ile şifreli giriş ekranı ve `/admin` için router navigation guard kuruldu. |
| **Özel İkon & Buton Renk Paleti** | ✅ **ÇÖZÜLDÜ** | 13 ikon, 7 özel buton stili, admin seçicileri ve ProfileView dinamik render desteği. |
| **Sosyal Medya İkon Barı** | ✅ **ÇÖZÜLDÜ** | `social_links` JSONB desteği, admin sosyal medya formları ve ProfileView dairesel buton barı. |
| **Yönetim Paneli Açık/Koyu Tema** | ✅ **ÇÖZÜLDÜ** | Güneş/Ay toggle butonu, Görünüm sekmesi kartları ve tam kapsamlı açık mod renk paleti. |
| **Linktree Çift Sütunlu Arayüz**| ✅ **ÇÖZÜLDÜ** | Masaüstünde sol kontroller / sağ iPhone canlı önizleme, mobilde yüzen önizleme çekmecesi. |
| **iPhone 16 Pro Canlı Mockup**  | ✅ **ÇÖZÜLDÜ** | Dynamic Island, durum çubuğu ve anlık store senkronizasyonlu `PhonePreview.vue`. |
| **Linktree iOS Switch & Kartları**| ✅ **ÇÖZÜLDÜ** | iOS tarzı aktif/gizli switch, sürükleme tutamaçları (`GripVertical`), tık sayaçları. |
| **HTML5 Drag & Drop Sıralama** | ✅ **ÇÖZÜLDÜ** | Kartları doğrudan fareyle tutup sürükleyerek sıralama (`reorderLinks`), görsel efektler ve `PUT /api/links/reorder` senkronizasyonu. |
| **Kayıt Olma (Register) Arayüzü**| ✅ **ÇÖZÜLDÜ** | `LoginView.vue` üzerinde sekmeli Giriş / Kayıt geçişi, form validasyonu ve otomatik giriş. |
| **Linktree Paylaş & QR Modalı** | ✅ **ÇÖZÜLDÜ** | `linktr.ee/kullaniciadi` üst hapı, tek tıkla kopyalama, QR kod ve yeni sekmede önizleme. |
| **Şifre Değiştirme Entegrasyonu**| ✅ **ÇÖZÜLDÜ** | Ayarlar sekmesinde `/api/auth/change-password` endpoint'i ile entegre şifre güncelleme formu. |
| **Profil & Kapak Yönetimi**     | ✅ **ÇÖZÜLDÜ** | Avatar ve banner dosya yükleme (Base64), hazır avatarlar, 6 kapak deseni, canlı telefon ve ziyaretçi görünümü senkronizasyonu. |
| **Dinamik Rozet & Etiket Yönetimi** | ✅ **ÇÖZÜLDÜ** | Biyografi altı uzmanlık/ilgi rozetleri (Badges), 12 Lucide ikonu, 6 renk stili, hızlı şablonlar, admin paneli yöneticisi, iPhone mockup ve ziyaretçi ekranı anlık reaktif yansıma. |
| **Genişletilmiş Kapak & Avatar/Durum Kişiselleştirme** | ✅ **ÇÖZÜLDÜ** | 12 hazır kapak deseni, 18 hazır avatar (4 kategori filtreli), 3 avatar çerçeve şekli, 6 avatar parıltı aurası, onay tiki aç/kapa, canlı durum/müsaitlik rozeti ve hızlı şablonlar. |
| **QR Tarama & Cihaz Analitiği (Mobil vs Tarayıcı)** | ✅ **ÇÖZÜLDÜ** | QR kodlara `?src=qr` parametre etiketlemesi, sayfa yüklendiğinde Mobil vs Masaüstü Tarayıcı tespiti, `/api/analytics` REST API rotaları, `visit_stats` tablosu, İstatistikler sekmesinde 4'lü CRM metrik kartları, mobil vs masaüstü karşılaştırma paneli, erişim kanalı dağılım çubuğu ve canlı test simülatörü. |
| **Zaman Ayarlı / Süresi Dolan Bağlantılar & Geri Sayım** | ✅ **ÇÖZÜLDÜ** | `is_scheduled`, `schedule_start`, `schedule_end`, `show_countdown` PostgreSQL ve REST API alanları, hızlı önayarlar (+24s, +3g, +1h), liste içi durum etiketleri ve ziyaretçi kartlarında canlı geri sayım rozetleri. |
| **Yapay Zeka Biyografi Asistanı (AI Bio Assistant)** | ✅ **ÇÖZÜLDÜ** | `/api/ai/tones` & `/api/ai/generate-bio` REST API motoru, 4 farklı ton (Kurumsal, Samimi, Siberpunk, Yaratıcı), rol ve uzmanlık etiketleri, anlık 160 karakter optimizasyonu, tek tıkla kopyalama, "Profile Uygula" ve çevrimdışı fallback mimarisi. |
| **Bağlantı Kategorileri & Akordeon Link Klasörleri** | ✅ **ÇÖZÜLDÜ** | `category` PostgreSQL ve REST API desteği, Admin kategori filtre çubuğu ve kart rozetleri, ProfileView ve PhonePreview üzerinde animasyonlu akordeon klasör kartları, dinamik link sayısı rozeti, arama senkronizasyonu ve açık/koyu mod uyumu. |

