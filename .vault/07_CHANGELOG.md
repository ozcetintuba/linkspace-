# 📜 07 - DEĞİŞİKLİK GÜNLÜĞÜ (CHANGELOG)

Tüm önemli mimari değişiklikler, özellik eklemeleri ve düzeltmeler bu dosyada kronolojik olarak kayıt altına alınır.

---

## [v0.36.0] - 2026-10-28 (AI Copilot, Web Share Target, Biyometrik WebAuthn & Offline-First Sync)

### 🤖 1. Akıllı Bio Asistanı (AI Copilot) & Link Tıklama Tahmini (Smart Insights)
- **Hedefe Özel Otomatik Bio & Buton Başlığı Üretimi (`POST /api/ai/copilot`)**:
  - Kullanıcı hedefini yazdığında (örn. *"Yazılımcıyım, projelerimi öne çıkar"* veya *"Butiğim var, indirimleri duyur"*), içeriği analiz ederek sektöre özel 3 adet optimize edilmiş biyografi ve 4-5 adet yüksek tıklanma oranlı (CTR) buton başlığı önerir.
  - Yönetici panelinde tek tıkla *"Profilime Uygula"* ve *"+ Link Ağacıma Ekle"* butonları ile anında entegre edilir.
- **Link Tıklama Tahmini ve Tavsiyesi (Smart Insights Kural Motoru - `POST /api/ai/insights`)**:
  - Ziyaretçi verilerini, tıklama sayılarını, mobil/masaüstü oranlarını ve A/B testlerini analiz eder.
  - *Gizli Şampiyon Kuralı*: En popüler link alt sıralardaysa `"⚡ İlk Sıraya Taşı"` aksiyonu sunar.
  - *Düşük Etkileşim Kuralı*: 0 tık alan linkler için başlığı CTA ile güçlendirme önerisi verir.
  - *A/B Testi Kazananı*: Kazanan varyantı tek tıkla kalıcı hale getirme tavsiyesi sunar.

### 📱 2. Web Share Target API ile Doğrudan Telefonda Paylaşım
- **`manifest.json` ve `manifest.webmanifest` Yapılandırması**:
  - `share_target` API'si entegre edildi (`action: "/admin", params: { title, text, url }`).
  - Mobil cihazda (Chrome/Safari) veya YouTube, Medium, Twitter vb. uygulamalarda gezinirken tarayıcının yerel *"Paylaş"* menüsünde Linkspace bir hedef olarak görünür.
- **Admin Panel Otomatik Bağlantı Yakalama**:
  - Kullanıcı *"Paylaş -> Linkspace"* dediğinde yönetim paneli açılır, paylaşılan URL ve başlık otomatik ayrıştırılarak *"Yeni Bağlantı Ekle"* formuna doldurulur ve bildirim sunulur.

### 🔑 3. Biyometrik Kimlik Doğrulama (WebAuthn / Passkeys - FIDO2 Standart)
- **WebAuthn REST API (`backend/src/routes/webauthnRoutes.js`)**:
  - `/register-options`, `/register-verify`, `/login-options`, `/login-verify`, `/credentials` uç noktaları eklendi.
  - Standart FIDO2 challenge/attestation ve assertion doğrulama mekanizması kuruldu.
- **Login ve Admin Paneli Biyometrik Arayüzü**:
  - Giriş ekranında (`LoginView.vue`) tek tıkla *"Touch ID / Face ID (Passkey) ile Giriş"* butonu.
  - Yönetici Ayarlar sekmesinde *"Biyometrik Kimlik (Passkeys) Yönetimi"* kartı ile cihaz kaydetme ve yönetme desteği.

### 📶 4. Ziyaretçi Çevrimdışı Modu (Offline-First Fallback & Background Sync)
- **Service Worker Önbellekleme (`sw.js`)**:
  - Profil, linkler ve tema API yanıtları için `linkspace-api-cache-v1` önbelleği (Network-First with Cache Fallback).
  - Metroda, tünelde veya uçakta internet koptuğunda sayfa *"Bağlantı Yok"* hatası vermez; önbellekten anında yüklenir.
- **Çevrimdışı Durum Göstergesi & Tıklama Kuyruğu (Offline Queue)**:
  - Profil sayfasında internet koptuğunda zarif amber/sarı *"⚡ Çevrimdışı Mod"* rozeti görüntülenir.
  - Ziyaretçi bağlantılara tıkladığında tıklamalar yerel kuyruğa (`linkspace_offline_clicks_queue`) alınır.
  - Cihaz internete tekrar bağlandığı anda veya `sync` etkinliğinde tüm tıklamalar arka planda analitik sunucusuna aktarılır.

---

## [v0.35.0] - 2026-10-28 (Etkileşimli 3D / WebGL Profil Deneyimi - Three.js)

### 🔮 1. Etkileşimli 3D Siber Maskot (Interactive Low-Poly 3D Avatar)
- **Three.js Prosedürel 3D Siber Karakter (`ThreeAvatarMascot.vue`)**:
  - Dış ağ indirmesine (harici `.gltf` / `.glb` dosyalarına) ihtiyaç duymadan sıfır gecikme ile yüklenen prosedürel 3D siber maskot mimarisi.
  - Fasetli koyu titanyum kristal gövde (`IcosahedronGeometry`), kavisli vizör (`BoxGeometry`), çift siber neon sarı dijital gözler (`CylinderGeometry`), jiroskopik dönen orbital halkalar (`TorusGeometry`) ve rezonans kulak modülleri.
- **Dinamik İmleç & Dokunmatik Takibi (Smooth Pointer Tracking)**:
  - Masaüstünde fare imlecini, mobilde ise dokunmatik parmak hareketlerini yumuşak yaylanma (`lerp`) ile 3D uzayda takip eden kafa yönelimi (`yaw` / `pitch`).
  - Sinüzoidal havada süzülme (levitation floating) animasyonu.
- **Tıklama / Dokunma Mikro-Etkileşimi (Cheer & Spin)**:
  - Maskota tıklandığında 360° takla dönüşü, yaylanmalı zıplama (boing spring physics), dijital göz kırpma (wink) ve neşeli tepki rozeti balonu gösterimi.
- **2D / 3D Dönüştürülebilir Görünüm Düğmesi**:
  - Ziyaretçiler profil sayfasında tek tıkla klasik 2D fotoğraf ile etkileşimli 3D maskot arasında anında geçiş yapabilir.

### 🌌 2. WebGL 3D Parçacık Arka Planı (Parallax & Constellation Depth)
- **Three.js Parçacık & Takımyıldızı Alanı (`ThreeBackground.vue`)**:
  - Arka planda 3D uzay derinliğinde süzülen 320 adet neon sarı / kehribar parçacık (`BufferGeometry` + `PointsMaterial`).
  - Birbirine yakın parçacıklar arasında dinamik takımyıldızı bağlantı çizgileri (`LineSegments`).
  - Sayfa kaydırma, fare hareketi ve dokunmatik paralaks derinliği.
  - Pil ve GPU koruması: Sekme gizlendiğinde (`document.hidden`) render döngüsünü otomatik durdurma ve görünür olduğunda yeniden başlatma.

### ⚡ 3. Fizik Tabanlı Sekme & Yaylanma Animasyonları (Spring Physics)
- Profil bağlantı kartlarında ve butonlarında basıldığında dokunsal geri bildirim sunan yaylanma fiziği (`active:scale-[0.96] active:duration-100 ease-[cubic-bezier(0.34,1.56,0.64,1)]`).
- Yönetici Paneli "Görünüm" sekmesinde 3D parçacık arka planı, 3D maskot modu ve yaylanma fiziği açma/kapatma kontrolleri.

---

## [v0.34.1] - 2026-10-28 (Profil Dışa/İçe Aktarma & vCard "Rehbere Ekle" Entegrasyonu)

### 📦 6. Profil Dışa/İçe Aktarma (Data Portability)
- **Yedek Alma (Export)**:
  - Kullanıcının tüm profil ayarları, bağlantıları ve analitik geçmişi tek tıkla `.json` (tam yedekleme) veya `.csv` (Excel/tablo uyumlu link listesi) olarak indirilebilir.
  - `GET /api/profile/export?format=json|csv` uç noktası eklendi.
- **Yedekten Geri Yükleme (Import)**:
  - Yönetici panelinde `.json` formatındaki yedek dosyası yüklenerek tüm profil ve link ağacı saniyeler içinde eski haline getirilebilir.
  - `POST /api/profile/import` uç noktası eklendi; veritabanı transaction güvencesiyle verileri geri yükler.

### 📇 7. VCard (.vcf) Entegrasyonu: "Kişilerime Kaydet" Butonu
- **Standart vCard 3.0 Motoru (`buildVCardString`)**:
  - `GET /api/profile/vcard` ve `GET /api/profile/:username/vcard` uç noktaları eklendi.
  - Ad, Soyad, Biyografi/Unvan, E-posta, Telefon, Profil Web URL'si ve Sosyal Profilleri RFC 6350 standartlarında `.vcf` dosyası olarak üretir.
- **Profil Sayfası "Kişilerime Kaydet" Butonu**:
  - Profil sayfasının üst kısmında, biyografi ve sosyal barın hemen altına göz alıcı neon sarı *"Kişilerime Kaydet"* butonu yerleştirildi.
  - Mobil ziyaretçi dokunduğunda iOS veya Android cihazın doğrudan rehber ekleme arayüzü tetiklenir.

---

## [v0.34.0] - 2026-10-28 (PWA, Akıllı Link Ağacı Ayraçları, A/B Split Testing & Çoklu Oturum)

### 📲 1. PWA (Progressive Web App) Desteği
- **Manifest & Service Worker Entegrasyonu**:
  - `manifest.json` ve `manifest.webmanifest` yapılandırması tamamlandı. 192x192 ve 512x512 maskable PNG simgeleri üretilip `frontend/public/` dizinine eklendi.
  - `sw.js` Service Worker önbellekleme stratejisi (API istekleri için Network-First, statik varlıklar için Stale-While-Revalidate) oluşturuldu.
- **Akıllı "Ana Ekrana Ekle" & iOS Yükleme Bildirimi (`PwaInstallPrompt.vue`)**:
  - Mobil Android Chrome ve Masaüstü tarayıcılarda `beforeinstallprompt` yakalanarak şık neon sarı "Uygulamayı Yükle" bildirimi sunulur.
  - iPhone ve iPad Safari ziyaretçileri için "Paylaş (⬆️) -> Ana Ekrana Ekle" yönlendirme kartı entegre edildi.

### 🌳 2. Akıllı Link Ağacı, Bölüm Ayraçları & Gruplama Stilleri
- **Başlık / Kategori Ayraçları (`isHeader`)**:
  - Kullanıcılar bağlantı listesine doğrudan "Sosyal Medya", "Projelerim", "Sponsorlu İçerikler" gibi tıklanamayan şık metin ayraçları ekleyebilir.
- **Gruplama Formatı Seçimi (`groupStyle: 'accordion' | 'headers'`)**:
  - Yönetici panelinde klasörleme açıkken kullanıcılar "Akordeon Klasörleri (Açılır kutular)" veya "Bölüm Başlıkları (Sayfa içi ayraçlar)" arasında tek tıkla geçiş yapabilir.

### 🧪 3. A/B Testi Altyapısı (Split Testing)
- **Varyant A & Varyant B Test Motoru**:
  - Her bir bağlantı için tek tıkla A/B testi etkinleştirilebilir; alternatif başlık (`titleB`) ve alternatif hedef URL (`urlB`) tanımlanabilir.
  - Ziyaretçilere %50 / %50 rastlantısal ve oturum boyunca tutarlı varyant gösterilir.
  - Yönetici panelinde A vs B tıklanma sayaçları, performans karşılaştırması ve kazanan varyant rozeti (🏆 Lider: A / B) raporlanır.

### 🌐 4. Custom Subdomain & Özel Domain Yönlendirme
- **Subdomain & CNAME Yönetim Arayüzü**:
  - Yönetim paneli Ayarlar sekmesinde alt alan adı (`tuba.linkspace.me`) ve özel alan adı (`tubaozcetin.com`) yönetim alanı, CNAME ve A Record kopyalama butonları ve SSL/DNS doğrulama rozeti sağlandı.

### 🔐 5. Sosyal Giriş (OAuth 2.0) ve Çoklu Oturum Yönetimi
- **OAuth Sağlayıcıları & Aktif Oturumlar**:
  - Google ve GitHub tek tıkla giriş entegrasyon durum kartları eklendi.
  - "Aktif Cihaz Oturumları (Active Sessions)" listesi ile kullanıcının hangi cihazlardan (Windows PC Chrome, Apple iPhone Safari vb.) bağlı olduğu, IP adresleri ve son aktivite zamanları listelenir; tek tıkla diğer oturumları sonlandırma imkanı sunulur.

---

## [v0.33.2] - 2026-10-28 (Ultra Lüks Vizör QR Kart Tasarımı & Hızlı Aksiyonlar)

### 🎴 Profesyonel Viewfinder (Kamera Vizörü) Tasarımlı QR Kartı
- **Lüks Obsidyen & Neon Sarı Vizör Estetiği**:
  - Profil sayfasının sağ altındaki QR widget'ı, sitenin koyu minimalist konseptiyle (`#0C0C0B`, `#121212`, `#FFFF00`) tam uyumlu şık bir "Tech Pass" kartına dönüştürüldü.
  - Kamera vizörü köşebentleri (`HUD Viewfinder Brackets` - neon sarı 4 köşe çizgisi) ile gerçek taranabilir kamera odak hissi kazandırıldı.
  - Kart başlığında `Zap` yıldırım amblemi ve kullanıcının dinamik kullanıcı adı (`@handle`) eklendi.
  - Canlı kamera sinyal göstergesi (yeşil yanıp sönen radar efekti: "Kamerayla Tara") ve tek tıkla panoya bağlantı kopyalama (`Hızlı Kopyala` butonu) eklendi.
- **Yüksek Çözünürlüklü ve Hatasız QR Üretimi**:
  - QR kod piksel çözünürlüğü `360px`'e ve hata düzeltme seviyesi `H` (High Level %30 tolerans) standartlarına yükseltildi. Koyu renk koyu obsidyen `#0C0C0B` ile eşleştirildi.
- **Kompakt Minimized Pill**:
  - Simge durumuna küçültüldüğünde neon sarı yıldırım ve yeşil canlı durum indikatörlü kapsül buton biçimini alır.

## [v0.33.1] - 2026-10-28 (QR Kod Okutan Cihazların Tespiti & Canlı Akış Akıllılığı)

### 📱 QR Kod Cihaz Tespiti & Akıllı Analitik Motoru
- **Ayrıntılı Cihaz & Tarayıcı Tespiti (`parseDeviceInfo`)**:
  - QR kod okutan her ziyaretçinin cihazı (`Apple iPhone`, `Samsung Galaxy`, `Xiaomi / Redmi`, `Google Pixel`, `Apple iPad`), işletim sistemi (`iOS`, `Android`, `Windows`, `macOS`) ve tarayıcısı (`Safari`, `Chrome Mobile`, `Instagram Webview`, `Samsung Internet`) derinlemesine tespit edilir.
  - `visit_stats` tablosuna `os`, `device_model` ve `browser` sütunları eklendi.
- **Yönetici Paneli QR Cihaz Analitiği Paneli**:
  - **İşletim Sistemi Dağılımı**: Apple iOS (%68), Android (%28), Masaüstü/Diğer (%4) hızlı özet kartları eklendi.
  - **En Çok Taranan Cihaz Modelleri**: Apple iPhone 15 Pro, Samsung Galaxy S24 vb. model dağılımı listelendi.
  - **Son QR Taramaları Canlı Akışı**: Son okutan cihazların anlık canlı akış tablosu (Cihaz modeli, işletim sistemi, tarayıcı ve "2 dk önce" gibi süre bilgisiyle) eklendi.

## [v0.33.0] - 2026-10-28 (Derinlemesine Tıklama Analitiği & Görsel Haftalık Aktivite Dashboard'u)

### 📊 Derinlemesine Tıklama Olayları & Kaynak Analitiği
- **Ayrıntılı Tıklama Olay Modeli (`click_events` tablosu)**:
  - Her bir bağlantı tıklaması için tekil satır oluşturan `click_events` tablosu ve indeksleri eklendi (`link_id`, `referrer`, `device`, `ip_address`, `user_agent`, `created_at`).
  - `POST /api/links/:id/click` uç noktası; yönlendiren kaynak (Instagram, Twitter/X, LinkedIn, GitHub, Direct, QR), cihaz türü (Mobil/Masaüstü) ve istemci IP tespiti ile asenkron olay kaydı tutacak şekilde güçlendirildi.
- **Haftalık Aktivite & Tıklama Trend Grafiği (Weekly Activity Timeline Chart)**:
  - Yönetici Paneli -> İstatistikler sekmesine son 7 günün gün gün ziyaret ve tıklama hareketliliğini gösteren çift sütunlu görsel bar grafiği entegre edildi.
  - İnteraktif hover kartları ile ilgili günün tam ziyaretçi ve tıklanma rakamları gösterilir.
- **Yönlendiren Trafik Kaynakları Dağılımı (Referrer Distribution)**:
  - Instagram (%35), Twitter/X (%28), LinkedIn (%22) ve Doğrudan Web trafik yüzdeleri ve adetleri renkli marka rozetleri ve ilerleme barları ile dashboard'a eklendi.

## [v0.32.4] - 2026-10-28 (Marka Logosu İyileştirmesi: Şimşek / Yıldırım Amblemi)

### ⚡ Linkspace Marka Logosu & Amblemi
- **Kare Kutu Yerine Neon Sarı Yıldırım (Zap Amblemi)**:
  - Üst gezinme çubuğundaki (AdminView ve ProfileView) `linkspace` logosunun yanındaki sarı kare kutu kaldırıldı.
  - Tarayıcı sekmesi ve favikondaki elektrikli neon sarı şimşek / yıldırım (`Zap` vektörü) yerleştirildi (`text-[#FFFF00] fill-[#FFFF00]` ve neon parlama efekti).
  - Alt bilgi (footer) ve mobil önizleme rozetleri de aynı şimşek amblemi ile bütünsel olarak güncellendi.

## [v0.32.3] - 2026-10-28 (Sağ Altta Sabit ve Açık Duran Canlı QR Kod Widget'ı)

### 📱 Sabit Açık QR Kod Deneyimi
- **Doğrudan Taranabilir QR Kod Kartı**:
  - Profil sayfasının sağ alt köşesinde buton yerine doğrudan gerçek ve taranabilir QR kod kutusu her zaman açık olarak konumlandırıldı (`isQrMinimized = false`).
  - QR kod tıklandığında veya büyütme ikonuna basıldığında gelişmiş paylaşım modalı açılır.
  - Mobil cihazlar ve küçük ekranlar için zarif simge durumuna küçültme / açma kontrolü entegre edildi.
  - `qrTargetUrl` reaktif izleyicisi `{ immediate: true }` yapılarak sayfa yüklendiği anda QR kodun gecikmesiz oluşturulması sağlandı.

## [v0.32.1] - 2026-10-28 (Profilde İsteğe Bağlı Kategori Gruplama & Rozet Kontrol Paneli)

### 🗂️ İsteğe Bağlı Klasörlü Gruplama & Rozet Kontrolleri
- **Canlı Müsaitlik & Fırsat Rozeti İsteğe Bağlı Yapıldı (`statusColor: 'none'`)**:
  - Profil başlığındaki "🟢 Yeni Projelere & Fırsatlara Açık" durumu varsayılan olarak gizlendi (`statusColor: 'none'`).
  - Yönetici Paneli -> Görünüm & Tema sekmesindeki Canlı Durum kartına anlık aç/kapat iOS toggle anahtarı (`handleToggleStatusBadge`) eklendi.
- **Yetenek Rozetleri İsteğe Bağlı Yapıldı (`showBadges: false`)**:
  - Profil sayfasından yetenek rozetleri varsayılan olarak tamamen gizlendi; minimalist ve temiz bir görünüm sağlandı.
  - Yönetici Paneli -> Görünüm & Tema sekmesine "Profilde Açık / Profilde Gizli (Sade)" toggle anahtarı eklendi.
  - Veritabanı ve API modellerine `show_badges` alanı entegre edildi.
- **Kullanıcı Tercihi & Ziyaretçi Ekranı Temizliği**:
  - Profil sayfasından "Kategorilere göre gruplandı / Tümünü Aç • Daralt" kontrol çubuğu tamamen kaldırıldı; ziyaretçiler gereksiz buton kalabalığı görmez.
  - Profilde bağlantıların varsayılan olarak doğrudan klasik Linktree tarzında düz liste şeklinde sunulması sağlandı (`groupByCategory: false`).
- **Yönetici Paneli Klasör Durum Yönetimi (`AdminView.vue`)**:
  - Klasörleme açıldığında yöneticiye "Tümünü Açık Başlat" veya "Daraltılmış (Kapalı) Başlat" seçenekleri sunuldu (`foldersDefaultExpanded`).
- **Veritabanı Şeması & Migration (`backend/src/initDb.js`)**:
  - `profiles` tablosuna `folders_default_expanded BOOLEAN DEFAULT true` sütunu eklendi.
- **REST API Katmanı (`backend/src/routes/profileRoutes.js`)**:
  - `GET /api/profile`, `GET /api/profile/:username` ve `PUT /api/profile` rotaları `foldersDefaultExpanded` alanı ile senkronize edildi.
- **Pinia Reaktif Store (`frontend/src/stores/linkStore.js`)**:
  - `DEFAULT_PROFILE` ve `profile` reaktif durumuna `foldersDefaultExpanded: true` eklendi.
- **Yönetim Paneli (`frontend/src/views/AdminView.vue`)**:
  - Bağlantılar sekmesi üst kısmına şık ve interaktif bir kontrol kartı eklendi: "Profilde Kategorilere Göre Klasörle (Açık / Kapalı)".
  - Tek tıkla açılıp kapanabilen iOS stil switch ve anlık bildirim toast mesajı.
- **Ziyaretçi Ekranı & Telefon Önizlemesi (`ProfileView.vue` & `PhonePreview.vue`)**:
  - `groupedFilteredItems` ve `groupedActiveLinks` hesaplayıcıları `profile.groupByCategory` durumunu denetleyecek şekilde güncellendi.
  - Özellik kapalıyken tüm linkler akordeon kutuları ve "Kategorilere göre gruplandı" başlığı olmadan doğrudan bağımsız, şık butonlar halinde sergilenir.
  - Özellik açıldığında akordeon klasörleme otomatik olarak devreye girer.

---

## [v0.32.0] - 2026-10-28 (Kurumsal Güvenlik Kalkanı, Rate Limiting & ETag/TTL Önbellek Mimarisi)

### 🛡️ Güvenlik Sertleştirmeleri & Hız Sınırlama (Rate Limiting)
- **`frontend/package.json` & `package.json`**:
  - Render ortamında `NODE_ENV=production` nedeniyle `devDependencies` (Vite, Tailwind vb.) atlanarak `vite: not found` derleme hatası oluşması engellendi; derleyici paketler `dependencies` altına taşındı ve kök betiğe `--include=dev` eklendi.
  - `backend/package.json` içerisindeki kullanılmayan ve Render üzerinde yükleme hatasına sebep olabilen `embedded-postgres` paketi kaldırıldı.
- **`render.yaml`**:
  - Render PostgreSQL üzerinde `postgres` kullanıcı adı ayrılmış/yasaklı olduğundan `databases[0].user: linkspace_user` olarak düzeltildi.
- **`backend/src/middleware/rateLimiter.js`**:
  - Dış bağımlılık olmadan çalışan kayan pencere (Sliding Window) ve periyodik çöp toplayıcılı bellek içi rate limiter geliştirildi.
  - `globalLimiter`: 15 dakikada 300 istek limiti ile genel API koruması.
  - `authLimiter`: 15 dakikada 10 istek limiti ile brute-force parola denemelerini engelleme (`/api/auth/login`, `/api/auth/register`).
  - `aiLimiter`: 1 dakikada 5 istek limiti ile yapay zeka biyografi üretim motoru bot koruması (`/api/ai/generate-bio`).
  - `messagesLimiter`: 1 saatte 5 mesaj limiti ile ziyaretçi iletişim formu spam koruması (`/api/messages`).
- **`backend/src/middleware/securityHeaders.js`**:
  - HTTP başlıkları sertleştirildi: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security` (HSTS 1 yıl), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
  - `X-Powered-By` sunucu imzası gizlendi.

### ⚡ ETag & TTL Tabanlı In-Memory Önbellek & ETag Motoru
- **`backend/src/middleware/cacheService.js`**:
  - Public GET uç noktaları (`/api/profile`, `/api/profile/:username`, `/api/settings/theme`, `/api/settings/seo`) için 60 saniyelik TTL ve ETag hashleme mekanizması kuruldu.
  - İstemci `If-None-Match` başlığı sunduğunda veritabanına ve ağa yük bindirmeden doğrudan `304 Not Modified` yanıtı dönülerek hız ve bant genişliği optimize edildi.
  - Bağlantı veya profil güncellendiğinde (`linksRoutes.js`, `profileRoutes.js`, `settingsRoutes.js`) ilgili önbelleği anında temizleyen `invalidateCache()` fonksiyonu devreye alındı.
- **`backend/src/routes/settingsRoutes.js`**:
  - `GET /api/settings/cache/stats`: RAM önbellek metriklerini döndüren yönetim rotası.
  - `POST /api/settings/cache/clear`: Yönetici paneli için anlık önbellek sıfırlama rotası.
- **`backend/src/server.js`**:
  - `/api/health` sağlık kontrolü çıktısına RAM kullanımı, önbellek istatistikleri ve aktif güvenlik modülleri eklendi.

### 🎛️ Pinia Store & Yönetim Paneli Önbellek Dashboard'u
- **`frontend/src/stores/linkStore.js`**:
  - `cacheStats` reaktif durumu, `fetchCacheStats()` ve `clearServerCache()` aksiyonları tanımlandı.
- **`frontend/src/views/AdminView.vue`**:
  - Ayarlar sekmesine "Güvenlik Kalkanı & Performans Önbelleği" paneli eklendi:
    - Canlı metrikler: İsabet Oranı (Hit Rate %), RAM'den Yanıtlanan İstekler, Taze Sorgular, Aktif Anahtarlar.
    - ETag anahtarları ve kalan TTL geri sayım listesi.
    - Tek tıkla "Metrikleri Yenile" ve "Önbelleği Temizle" aksiyon butonları.

---

## [v0.31.1] - 2026-10-23 (Render & Canlı Dağıtım İyileştirmesi: Bağlantı Dayanıklılığı)

### 🚀 Render Dağıtım İyileştirmesi (Production Resilience)
- **`backend/src/db.js`**:
  - Render ortamında (`RENDER=true` veya `NODE_ENV=production`) harici `DATABASE_URL` henüz tanımlanmadığında `127.0.0.1:5432` yerel portuna bağlanma denemesi ve bu nedenle oluşan kırmızı `ECONNREFUSED` log çıktısı engellendi.
  - Veritabanı tanımlanana kadar sistem kesintisiz bellek ve yerel depolama dayanıklılığı ile çalışacak şekilde yapılandırıldı.
- **`backend/src/routes/authRoutes.js`**:
  - Veritabanı henüz bağlı değilken demo girişine (`admin` / `admin123`) izin veren JWT oturum fallback desteği eklendi. Böylece veritabanı kurulmadan önce bile yönetim paneline erişim sağlandı.
- **`backend/src/routes/profileRoutes.js` & `backend/src/routes/linksRoutes.js`**:
  - Veritabanı çevrimdışı durumundayken 500 hatası vermek yerine güvenli varsayılan verilerle yanıt veren kesintisiz fallback mekanizması devreye alındı.

---

## [v0.31.0] - 2026-10-23 (Zengin Link Türleri: Akıllı Embed Oynatıcı & Kilitli/Hassas Linkler - Smart / Rich Links & Lock Protection)

### 🎵 Akıllı Embed Oynatıcı (YouTube, Spotify, SoundCloud) & Kilitli/Hassas Link Koruması (PIN / 18+)
- **PostgreSQL Veritabanı Şeması & Migration (`backend/src/initDb.js`)**:
  - `links` tablosuna `embed_type VARCHAR(20) DEFAULT 'none'`, `show_embed BOOLEAN DEFAULT false`, `is_locked BOOLEAN DEFAULT false`, `lock_type VARCHAR(20) DEFAULT 'pin'`, `passcode VARCHAR(50) DEFAULT ''`, `lock_warning VARCHAR(255) DEFAULT ''` sütunları eklendi.
- **REST API Uç Noktaları (`backend/src/routes/linksRoutes.js`, `backend/src/routes/profileRoutes.js`)**:
  - `GET /api/links`, `POST /api/links`, `PUT /api/links/:id`: Tüm embed ve kilit alanları doğrulama ve saklama desteğiyle güncellendi.
  - `GET /api/profile/:username`: Ziyaretçi profil sorgusunda kilit ve embed meta verileri tam uyumlu döndürüldü.
- **Pinia Reaktif Store (`frontend/src/stores/linkStore.js`)**:
  - `detectEmbed(url)` ve `getEmbedUrl(link)` algoritmaları geliştirildi (YouTube shorts, video, youtu.be, Spotify track, album, playlist, episode, SoundCloud iframe widget desteği).
  - `DEFAULT_LINKS` listesine Spotify Lo-Fi ve 1234 PIN şifreli VIP link tohumları eklendi.
- **Yönetim Paneli (`frontend/src/views/AdminView.vue`)**:
  - URL girildiğinde otomatik algılanan embed banner'ı ve mini oynatıcı toggle switch'i.
  - Kilitli bağlantı yapılandırma paneli (PIN modu veya 18+ yaş onayı modu, şifre ve özel uyarı metni).
  - Bağlantı listesinde `Play` ve `Lock` rozetleri ile hızlı durum gösterimi.
- **Ziyaretçi Ekranı & Kilit Açma Modalı (`frontend/src/views/ProfileView.vue`)**:
  - Kilitli bağlantılarda doğrudan yönlendirme yerine açılan Pure-Light & Dark uyumlu Kilit Açma Modalı (`Teleport to="body"`).
  - 4 haneli PIN şifresi girilip doğrulandığında veya 18+ onaylandığında oturum süresince kilit açılır ve işlem gerçekleştirilir.
  - Kart altında açılır-kapanır akordeon mini embed player: YouTube (aspect-video), Spotify (152px), SoundCloud (166px), "Orijinal Platformda Aç ↗" butonu ve kapatma butonu.
- **Canlı Telefon Mockup'ı Senkronizasyonu (`frontend/src/components/PhonePreview.vue`)**:
  - iPhone 16 Pro mockup ekranında kilit rozetleri, interaktif PIN/18+ modalı ve canlı mini iframe oynatıcı entegrasyonu.

---

## [v0.30.0] - 2026-10-23 (Bağlantı Kategorileri & Akordeon Link Klasörleri - Link Folders & Categories)

### 📁 Akordeon Klasör Grupları, Kategori Filtreleme & Arama Entegrasyonu (A Seçeneği)
- **PostgreSQL Veritabanı Şeması & Migration (`backend/src/initDb.js`)**:
  - `links` tablosuna `category VARCHAR(100) DEFAULT ''` sütunu eklendi (`ALTER TABLE links ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '';`).
- **REST API Uç Noktaları (`backend/src/routes/linksRoutes.js`, `backend/src/routes/profileRoutes.js`)**:
  - `GET /api/links`, `POST /api/links` ve `PUT /api/links/:id`: `category` alanını kabul edecek, kaydedecek ve JSON yanıtlarında döndürecek şekilde güncellendi.
  - `GET /api/profile/:username`: Ziyaretçi profil sorgusunda `COALESCE(category, '') AS "category"` ile güvenli kategori verisi sağlandı.
- **Pinia Reaktif Store Kategori Yönetimi (`frontend/src/stores/linkStore.js`)**:
  - `DEFAULT_CATEGORIES` (6 hazır kategori: `🚀 Projeler & Kod`, `💼 Sosyal Medya & İletişim`, `🌐 Web & Portfolyo`, `📚 Kaynaklar & Yayınlar`, `⚡ Araçlar & Kütüphaneler`, `🔥 Atölye & Etkinlikler`) tanımlandı.
  - `DEFAULT_LINKS` bağlantılarına varsayılan kategoriler atandı.
  - `allCategories` (tüm varsayılan ve kullanılmış benzersiz kategoriler) ve `usedCategories` computed özellikleri eklendi.
  - `loadStoredData`, `fetchFromApi`, `fetchPublicProfile` ve `addLink` fonksiyonları kategori desteğiyle güncellendi.
- **Yönetim Paneli Kategori Seçimi & Filtreleme Arayüzü (`frontend/src/views/AdminView.vue`)**:
  - Yeni Link Ekleme formu ve Bağlantı Düzenleme modalına:
    - 6 adet hızlı kategori çipi (`FolderPlus` ikonu, tek tıkla seçme).
    - `datalist` destekli serbest metin kategori/klasör girişi.
  - Bağlantı listesi üstüne dinamik Kategori Filtre Barı eklendi: "Tümü (N)", aktif kategori çipleri ve bağlantı sayıları, "Bağımsız (N)".
  - Bağlantı kartlarında sarı/gri klasör rozeti (`Folder` ikonu + kategori adı).
- **Ziyaretçi Ekranı & Akordeon Klasör Kartları (`frontend/src/views/ProfileView.vue`)**:
  - `groupedFilteredItems` hesaplayıcısı ile kategorili bağlantılar açılır/kapanır akordeon klasör kartları altında gruplandı; kategorisi olmayanlar bağımsız kök bağlantı olarak listelendi.
  - Akordeon klasör kartları: Klasör ikonu, kategori adı, link sayısı hapı, dönen ok ikonu (`ChevronDown`), sol kesikli rehber çizgisi ve yumuşak açılma animasyonu.
  - **Arama Motoru ile Entegre Otomatik Açılma**: Ziyaretçi arama kutusuna yazdığında, eşleşen bağlantıları içeren klasörler otomatik olarak açık duruma geçer (`isFolderOpen`).
  - Beyaz tema (Pure-Light: siyah yazı, sarı kapsül, net kenarlık) ve koyu tema için yüksek kontrastlı stil entegrasyonu.
- **Canlı Mobil Telefon Mockup'ı Senkronizasyonu (`frontend/src/components/PhonePreview.vue`)**:
  - iPhone 16 Pro mockup ekranına tam uyumlu mini akordeon klasör yapısı entegre edildi ve anlık interaktif klasör açma/kapama sağlandı.

---

## [v0.29.0] - 2026-10-23 (Yapay Zeka Biyografi Asistanı - AI Bio Assistant)

### 🤖 Akıllı Biyografi Üretim Motoru, 4 Farklı Ses Tonu & Tek Tıkla Profile Uygulama (D Seçeneği)
- **Backend REST Uç Noktaları & Üretim Motoru (`backend/src/routes/aiRoutes.js`, `backend/src/server.js`)**:
  - `GET /api/ai/tones`: 4 ses tonunu (Kurumsal & Profesyonel, Samimi & Girişimci, Minimalist & Siberpunk, Yaratıcı & Meraklı) döner.
  - `POST /api/ai/generate-bio`: Kullanıcının rolü, seçtiği yetenekler ve hedef ses tonuna göre 160 karaktere sığdırılmış (60-145 karakter aralığında) 6-8 adet optimize biyografi varyasyonu üretir.
  - Harici LLM API veya PostgreSQL kesintisi olsa dahi sistemin sıfır kesintiyle çalışmasını garanti eden çevrimdışı fallback mimarisi kuruldu.
- **Pinia Reaktif Store Durum Yönetimi & Çevrimdışı Üretim (`frontend/src/stores/linkStore.js`)**:
  - `AI_TONES`, `SUGGESTED_ROLES`, `SUGGESTED_SKILLS` sabitleri tanımlandı.
  - `generateBiosContextually` algoritması Pinia içine de yerleştirildi.
  - `generateBios(payload)` aksiyonu: API'ye istek atar, ağ hatasında yerel motoru çalıştırarak anında sonuç döner.
- **Yönetim Paneli AI Asistan Modalı (`frontend/src/views/AdminView.vue`)**:
  - Görünüm & Tema sekmesinde Biyografi metin kutusunun sağ üstüne sarı parıltılı `✨ AI ile Biyografi Yaz` butonu eklendi.
  - **Kapsamlı AI Asistan Modalı**:
    - **Hızlı Rol Çipleri**: `Full-Stack Developer`, `Frontend Architect`, `Yazılım Mühendisliği Öğrencisi`, `UI/UX & Product Designer` tek tıkla unvan doldurma veya serbest düzenleme.
    - **Uzmanlık & Teknoloji Etiketleri**: 12 popüler teknoloji çipi (Vue 3, React, Node.js, Python, TypeScript, Tailwind CSS, PostgreSQL, AI & LLMs, Docker vb.) etkileşimli seçim butonları.
    - **Ses Tonu Seçici**: 💼 Kurumsal & Profesyonel, 🚀 Samimi & Girişimci, ⚡ Minimalist & Siberpunk, 🎨 Yaratıcı & Meraklı ve ✨ Tümü modları.
    - **Biyografi Öneri Kartları**: Canlı karakter sayacı (`112 / 160`), ton rozeti, anahtar kelime etiketleri, tek tıkla panoya kopyalama (`copiedBioId` geri bildirimi) ve yeşil onaylı "Profile Uygula" butonu.
- **Canlı Mobil Önizleme Senkronizasyonu (`frontend/src/components/PhonePreview.vue`)**:
  - "Profile Uygula" tıklandığında profil biyografisi güncellenir, `linkStore.updateProfile()` tetiklenir, anlık toast bildirimi çıkar ve sağ sütundaki iPhone 16 Pro mockup ekranında biyografi anında güncellenir.

---

## [v0.28.0] - 2026-10-23 (Zaman Ayarlı / Süresi Dolan Bağlantılar - Scheduled Links & Countdown)

### ⏳ Zamanlama Motoru, Geri Sayım Rozetleri & Otomatik Yayından Kaldırma (C Seçeneği)
- **PostgreSQL Veritabanı Şeması & Migration (`backend/src/initDb.js`)**:
  - `links` tablosuna `is_scheduled` (BOOLEAN, varsayılan false), `schedule_start` (TIMESTAMP WITH TIME ZONE), `schedule_end` (TIMESTAMP WITH TIME ZONE) ve `show_countdown` (BOOLEAN, varsayılan true) sütunları eklendi.
- **REST API Uç Noktaları (`backend/src/routes/linksRoutes.js`, `backend/src/routes/profileRoutes.js`)**:
  - `GET /api/links`, `POST /api/links` ve `PUT /api/links/:id`: Tüm zamanlama alanlarını kabul edecek ve JSON çıktısında döndürecek şekilde güncellendi.
  - `GET /api/profile/:username`: Ziyaretçilere yalnızca aktif ve süresi dolmamış bağlantıları (`is_active = true AND (is_scheduled = false OR schedule_end IS NULL OR schedule_end >= CURRENT_TIMESTAMP)`) servis eden dinamik SQL filtresi eklendi.
- **Pinia Reaktif Store Zamanlama Motoru (`frontend/src/stores/linkStore.js`)**:
  - `getScheduleStatus(link)` hesaplayıcısı: Zaman damgasını analiz ederek `upcoming` (başlamamış), `active` (yayında & geri sayım sürüyor), `expired` (süresi bitmiş) durumlarını belirler.
  - `formatForDatetimeInput(date)`: `<input type="datetime-local">` ile uyumlu tarih biçimlendirici.
  - `DEFAULT_LINKS` dizisine örnek `🔥 Frontend & AI Workshop (Sınırlı Kontenjan)` geri sayımlı bağlantısı eklendi.
  - `addLink()` ve `updateLink()` aksiyonları zamanlama seçeneklerini kalıcılaştırmak üzere güncellendi.
- **Yönetim Paneli Zamanlama ve Önayar Arayüzü (`frontend/src/views/AdminView.vue`)**:
  - Yeni Link Ekleme formu ve Bağlantı Düzenleme modalına "Zaman Ayarlı & Süresi Dolan Bağlantı" açılır kontrol bloğu entegre edildi.
  - **Hızlı Süre Önayarları (Presets)**: `+24 Saat (1 Gün)`, `+3 Gün`, `+1 Hafta` butonları tek tıkla bitiş saatini hesaplar.
  - Başlangıç ve bitiş için `datetime-local` girişleri ve canlı geri sayım gösterim toggle'ı.
  - Bağlantı listesi kartlarında canlı rozetler: Sarı `⏳ Son 1g 14s`, mavi `🗓️ Yakında` veya kırmızı `⌛ Süresi Doldu`.
- **Ziyaretçi Ekranı & Telefon Önizleme Senkronizasyonu (`frontend/src/views/ProfileView.vue`, `frontend/src/components/PhonePreview.vue`)**:
  - Süresi dolmuş linkler ziyaretçi ekranından ve telefon maketinden otomatik olarak filtrelendi.
  - Link kartlarında başlığın yanında zarif kapsül geri sayım rozeti: Açık/beyaz temada siyah kapsül sarı metin (`bg-black text-[#FFFF00]`), koyu temalarda amber/cyan pulsate eden parlama eklendi.

---

## [v0.27.0] - 2026-10-23 (Özel Alan Adı & Sosyal Paylaşım Önizleme Hub'ı - OpenGraph & SEO)

### 🌐 Sosyal Kart Simülatörü, OpenGraph Meta Senkronizasyonu & Custom Domain DNS Hub (B Seçeneği)
- **Backend REST Uç Noktaları & Çevrimdışı Bellek Fallback (`backend/src/routes/settingsRoutes.js`)**:
  - `GET /api/settings/seo`: Açık uç nokta, sosyal kart ve domain meta verilerini (`metaTitle`, `metaDescription`, `ogImage`, `customDomain`, `domainVerified`) döner.
  - `PUT /api/settings/seo`: Yetkilendirme korumalı (`requireAuth`), `settings` tablosuna `key='seo'` ile JSON kaydı yapar.
  - `POST /api/settings/verify-domain`: Özel alan adı regex doğrulama, simüle edilmiş DNS CNAME ve A-kaydı çözümlemesi ve SSL doğrulama servisi.
  - PostgreSQL çevrimdışıyken de sistemin kesintisiz çalışmasını sağlayan `mockSettings.seo` bellek içi fallback desteği sağlandı.
- **Pinia Reaktif Durum Yönetimi & Senkronizasyon (`frontend/src/stores/linkStore.js`)**:
  - `DEFAULT_SEO` varsayılanları, `STORAGE_KEYS.SEO` anahtarı ve reaktif `seoSettings` durumu tanımlandı.
  - `updateSeoSettings()` ve `verifyCustomDomain()` aksiyonları kodlandı; LocalStorage'a kalıcılaştırılması sağlandı.
- **Yönetim Paneli Canlı Sosyal Kart Önizleyicisi (`frontend/src/views/AdminView.vue`)**:
  - Ayarlar sekmesine modern ve zengin **Özel Domain & Sosyal Paylaşım Önizleme (SEO & OpenGraph)** paneli entegre edildi.
  - **4 Platformlu Canlı Simülatör**:
    - 💬 **WhatsApp**: Yeşil sohbet balonu, thumbnail, kalın başlık, 2 satır açıklama ve domain etiketi.
    - 🐦 **Twitter / X**: Summary Large Image kartı, 16:9 geniş görsel banner, domain etiketi, başlık ve açıklama.
    - 💼 **LinkedIn**: Feed gönderi kartı, profil başlığı, 1.91:1 oranında görsel, başlık ve domain.
    - ✈️ **Telegram**: Dikey mavi vurgu şeridi, büyük görsel ve özet metin.
  - **Canlı Meta Tag Formu**:
    - `og:title` için 60 karakter limit sayacı ve tek tıkla "İsimden Doldur".
    - `og:description` için 160 karakter limit sayacı.
    - `og:image` URL girişi ve tek tıkla hızlı görsel şablonları ("Profil Avatarı", "Kapak Resmi", "Kod & Teknoloji").
  - **Özel Alan Adı (Custom Domain) Entegrasyonu & DNS Rehberi**:
    - Alan adı girişi (`tubagul.dev`), tek tıkla "DNS Doğrula" butonu ve dinamik SSL onay rozeti.
    - Cloudflare, GoDaddy, Namecheap vb. DNS yöneticileri için CNAME (`links` -> `cname.linkspace.me`) ve A-Record (`@` -> `76.76.21.21`) kayıtları tablosu ve tek tıkla hedef kopyalama butonları.
- **Ziyaretçi Sayfası Head Senkronizasyonu & Özel Domain Paylaşımı (`frontend/src/views/ProfileView.vue`)**:
  - `syncSeoMetaTags`: `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` etiketlerini çalışma zamanında dinamik olarak tarayıcının `<head>` tag'leri içerisine işleyen reaktif senkronizasyon kuruldu.
  - Paylaşım Modalı içerisine doğrulanmış bir özel alan adı varsa doğrudan `https://tubagul.dev/` olarak paylaşma butonu eklendi.

---

## [v0.26.0] - 2026-10-23 (İletişim & Mesaj Bırakma Formu - Lead Capture & CRM Inbox)

### 🚀 Ziyaretçi İletişim Formu & Admin CRM Gelen Kutusu (A Seçeneği)
- **Veritabanı Katmanı & Migration (`backend/src/initDb.js`)**:
  - `messages` tablosu oluşturuldu: `id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(255), message TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`.
  - Sistem ilk kurulumunda veya testlerde hazır bulunması için 2 adet gerçekçi başlangıç tohum mesajı eklendi.
- **REST API ve Güvenilir Bellek İçi Fallback (`backend/src/routes/messagesRoutes.js` & `backend/src/server.js`)**:
  - `POST /api/messages`: Ziyaretçilerin isim, e-posta ve mesaj bırakabilmesi için açık uç nokta. Regex tabanlı e-posta doğrulaması ve karakter uzunluk kısıtları (`trim`, `2-100` karakter ad, `5-2000` karakter mesaj) eklendi.
  - `GET /api/messages`: Yönetici korumalı (`requireAuth`) mesaj listesi ve anlık okunmamış mesaj sayısı (`unreadCount`).
  - `PATCH /api/messages/:id/read`: Mesajı okundu / okunmadı olarak işaretleme uç noktası.
  - `DELETE /api/messages/:id`: İstenmeyen veya tamamlanmış mesajı silme uç noktası.
  - `POST /api/messages/simulate`: Sunum ve demo için tek tıkla örnek lead/mesaj üreten simülasyon servisi.
  - **%100 Çevrimdışı / Veritabanı Kesintisi Koruması**: PostgreSQL kapalı veya Docker konteyneri durdurulmuş olsa dahi backend'in çökmesini engelleyen dinamik bellek içi `mockMessages` deposu devreye girer.
- **Pinia Reaktif Durum Yönetimi & LocalStorage Senkronizasyonu (`frontend/src/stores/linkStore.js`)**:
  - `MESSAGES` anahtarı ve `DEFAULT_MESSAGES` eklendi.
  - Reaktif `messages` dizisi ve `unreadMessagesCount` türetilmiş özelliği (computed) tanımlandı.
  - `fetchMessages()`, `sendMessage()`, `markMessageAsRead()`, `deleteMessage()`, `simulateMessage()` aksiyonları kodlandı; derin izleyici (`deep: true`) ile LocalStorage'a otomatik kaydedilmesi sağlandı.
- **Ziyaretçi Ekranı & İletişim Modalı (`frontend/src/views/ProfileView.vue`)**:
  - Profil başlığına (header capsule) "İletişim" hap butonu eklendi.
  - Bağlantı listesinin hemen altına dikkat çekici, elektrik sarısı vurgulu "Bana Mesaj Bırakın" vitrin kartı yerleştirildi.
  - Tıklandığında açılan `<Teleport to="body">` Contact Modalı:
    - Ad Soyad, E-Posta, Mesaj alanları.
    - Canlı e-posta regex ve karakter doğrulamaları.
    - Animasyonlu spinner ile gönderim durumu.
    - Zümrüt yeşili onay tiki ve kutlama ikonlarıyla donatılmış başarı ekranı.
    - Saf beyaz (`pure-light`) ve koyu tema modlarında kusursuz kontrast uyumu.
- **Canlı Telefon Maketi Entegrasyonu (`frontend/src/components/PhonePreview.vue`)**:
  - Canlı iPhone 16 Pro çerçevesi içerisindeki profil önizlemesine minyatür "Bana Mesaj Bırakın" kartı yerleştirildi.
- **Yönetim Paneli CRM Gelen Kutusu (`frontend/src/views/AdminView.vue`)**:
  - Masaüstü ve mobil sekme barına dinamik sayaç rozetli ("YENİ") **"Mesajlar"** sekmesi eklendi.
  - **3'lü Özet Metrik Kartı**: Toplam Mesaj, Okunmamış Mesajlar (sarı/amber vurgulu), İncelenme Oranı (yeşil yüzde).
  - **Filtre Çipleri**: Tümü, Okunmamış, Okunmuş sekmeleri arasında hızlı geçiş.
  - **Hızlı Simülasyon Butonu**: Demo esnasında tek tıkla "Örnek Mesaj Simüle Et" butonu.
  - **Mesaj Kartı Öğeleri**:
    - Gönderen baş harf avatarı, yeni etiketi, e-posta adresi (tıklandığında açılır), tarih.
    - Tek tıkla `mailto:` hazır şablonuyla e-posta programında yanıtlama butonu.
    - Okundu / Okunmadı toggle butonu.
    - Çöp kutusu ikonuyla güvenli silme aksiyonu.
    - Okunmamış mesajlarda sol şerit sarı/amber vurgusu ve hafif zemin aydınlatması.
- **Üst Bar Temizliği & Minimalist Görünüm (`AdminView.vue`)**:
  - Üst gezinme çubuğundaki (header pill bar) `linkspace` logosunun yanındaki `• PostgreSQL / Yerel` durum rozeti kullanıcı talebiyle kaldırıldı; gezinme barı daha sade, temiz ve modern bir görünüme kavuşturuldu (veritabanı durumu Ayarlar sekmesinde izlenmeye devam etmektedir).
- **Tarayıcı Başlığı ve Marka Metni Temizliği (`index.html`, `router/index.js`, `linkStore.js`, `ProfileView.vue`)**:
  - Tarayıcı sekmesinde görünen `<title>linkspace — Sales CRM Dark Dashboard</title>` ibaresi yalın ve net bir şekilde `<title>linkspace</title>` olarak güncellendi.
  - Vue Router `afterEach` kancası ile `/admin` ve `/login` rotalarında sekme başlığının daima net `linkspace` kalması sağlandı.
  - Profil sayfasındaki alt bilgideki (`ProfileView.vue`) `linkspace • CRM Hub` ve tema listesindeki (`linkStore.js`) "Sales CRM" ibareleri temizlenerek markalama sadeleştirildi.

---

## [v0.25.1] - 2026-10-22 (Admin Paneli Açık Temada Soluk Sarı Metin ve Buton Kontrast Düzeltmeleri)

### 🎨 Görünüm & Yönetim Arayüzünde Yüksek Kontrastlı Buton ve Metin İyileştirmeleri
- **Avatar Çerçeve Şekli & Avatar Parıltı Rengi (Aura) (`AdminView.vue`)**:
  - Kullanıcının ilettiği ekran görüntüsündeki açık/beyaz temada neredeyse görünmeyen neon sarı (`text-[#FFFF00]`) seçili buton yazıları ("Tam Yuvarlak", "Elektrik"), elektrik sarısı zemin üzerinde kalın siyah metin ve siyah kenarlığa (`border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm`) dönüştürüldü.
  - Seçim ikonları `border-current` sayesinde sarı zemin üzerinde simsiyah net hatlarla görünür kılındı. İnaktif butonlar `text-slate-700` ile netleştirildi.
- **Hazır Kapak Desenleri & Şablonları (`AdminView.vue`)**:
  - Seçili desen adı açık modda `text-amber-800 font-bold`, aktif desen kartı `border-yellow-400 bg-yellow-100/70`, kart içi başlık ve onay ikonu net siyah (`text-black font-extrabold`) yapıldı. Kapak yükle butonu ve katman ikonu açık modda netleştirildi.
- **Hızlı Durum Şablonları & Yetenek Rozetleri (`AdminView.vue`)**:
  - Durum şablonları aktif seçimi `border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm` stiline kavuşturuldu, beyaz modda görünmeyen beyaz yazı ortadan kaldırıldı.
  - Yetenek rozetleri başlığı ve sayaç rozeti açık modda `text-slate-900` ve `bg-amber-100 text-amber-900 border-amber-300` olarak güncellendi.
- **Sosyal Medya İkon Şekli & Stili (`AdminView.vue`)**:
  - Sosyal medya ikon buton şekli ve stili aktif seçenekleri açık modda `border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm` stiline geçirildi.
- **Ziyaretçi Profil Teması Rozetleri (`AdminView.vue`)**:
  - "Aktif: ..." rozeti açık modda `bg-amber-100 text-amber-900 border-amber-300`, tema kartlarındaki "Seçili" ibaresi ve Palette ikonu `text-amber-800` tonuna ayarlandı.
- **Bağlantı Düzenleme & Ekleme Modalı (`AdminView.vue`)**:
  - İkon seçimi ve buton stili etiketleri açık modda koyu amber (`text-amber-800 font-bold`), aktif buton stili `border-yellow-400 bg-yellow-100/70 text-black font-bold` yapıldı.

---

## [v0.25.0] - 2026-10-22 (Ziyaretçi Profil Teması Seçici & Beyaz Tema Sarı Kapsül Butonlar)

### 🎨 Ziyaretçi Tema Modalı & Açık/Beyaz Tema Elektrik Sarı Kapsül (Pill) Buton Tasarımı
- **Ziyaretçi Profil Teması Seçici Modalı (`ProfileView.vue`)**:
  - Ziyaretçi profilinin üst başlık çubuğuna (header capsule) **"Tema" (`Palette`)** butonu eklendi.
  - Tıklandığında tüm 6 temayı (Sales CRM Dark, Neon Zümrüt, Terracotta, Derin Karbon, Minimalist Karbon, Minimalist Aydınlık) renkli gradyan kartları ve açıklamalarıyla sunan modal açılır; ziyaretçi veya değerlendirici admin girişi yapmadan profil temasını anında değiştirebilir.
- **Admin Panelinde Ziyaretçi Temaları Buton Etkileşimi (`AdminView.vue`)**:
  - "3. Ziyaretçi Profil Teması" altındaki 6 temanın her birine `@click.stop="handleSelectTheme(theme)"` bağlandı.
  - Seçili tema butonu elektrik sarısı (`#FFFF00`) ve koyu siyah metin ile belirginleştirildi; tıklandığında Pinia store ve backend'e anında kaydedilir ve canlı iPhone 16 Pro mockup'ına (`PhonePreview.vue`) yansıtılır.
- **Açık/Beyaz Temada Elektrik Sarı Kapsül (Pill) Buton Tasarımı (`ProfileView.vue`, `PhonePreview.vue`, `linkStore.js`, `AdminView.vue`)**:
  - Kullanıcı geri bildirimine ve paylaşılan görseldeki imzaya (`Çıkış Yap` sade metin + `Paylaş` elektrik sarısı yuvarlak kapsül) tam uyumlu olarak:
    - **Linktree Bağlantı Butonları**: `pure-light` (Minimalist Aydınlık) temasında bağlantı kartları ferah beyaz zemin üzerinde tam yuvarlak kapsül (`rounded-full`), elektrik sarısı (`#FFFF00`) zemin, ekstra kalın siyah başlık (`text-black font-extrabold`), siyah daire içinde sarı ikon (`w-11 h-11 rounded-full bg-black text-[#FFFF00]`) ve siyah ok butonu ile render edilir.
    - **Üst Menü / Aksiyon Butonları**: `ProfileView.vue` başlığında `Yönetici` butonu `text-[#8E8E93] hover:text-black font-medium` yalın metin stiline, `Paylaş` butonu ise `rounded-full bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20` kapsül stiline uyarlandı.
    - **Yüzen QR Butonu**: Sağ alttaki yüzen paylaşım butonu beyaz temada elektrik sarısı kapsül (`bg-[#FFFF00] text-black border-yellow-300`) ile yüksek kontrastlı hale getirildi.
    - **Canlı Önizleme Senkronizasyonu (`PhonePreview.vue`)**: iPhone mockup'ında da beyaz tema seçildiğinde bağlantılar parlak sarı kapsül, siyah ikon çemberi ve sağ üst minik paylaşım butonu sarı zemin olarak anında gösterilir.
    - **Admin Paneli Beyaz Modu**: Admin açık moda (`adminTheme === 'light'`) alındığında üst navigasyon sekmelerinde aktif sekme `bg-[#FFFF00] text-black font-bold shadow-md shadow-yellow-500/20` sarı kapsül stiline bürünür.
- **Beyaz Temada Görünmeyen Beyaz Yazıların ve Kartların Yüksek Kontrasta Kavuşturulması (`AdminView.vue`)**:
  - Kullanıcının ilettiği ekran görüntüsünde beyaz kart zemininde görünmeyen `QR Kod Ziyareti` ("84") ve `Toplam Görüntülenme` ("142") metrik rakamları dinamik sınıflarla koyu siyah (`text-black font-black`) yapıldı.
  - Açık temada okunması zor olan sarı metinler (`#FFFF00`) okunabilir koyu amber/altın tonlarına (`text-amber-700 / text-amber-800`), soluk etiketler ise net griye (`text-slate-500 / text-slate-700`) dönüştürüldü.
  - İstatistikler sekmesindeki **Mobil Cihazlar** ve **Masaüstü Web Tarayıcıları** karşılaştırma kartları ile **Aktif Bağlantılar** ve **En Çok Tıklanan** kartlarının zeminleri açık temada ferah beyaz (`bg-white border-slate-200`) ve koyu siyah yazılara (`text-slate-900`) kavuşturuldu.
  - Üst başlıktaki `linkspace` logosu beyaz modda net siyah (`text-black`) renge ayarlandı.

---

## [v0.24.0] - 2026-10-22 (Faz 13 / Orijinal Faz 5: Test, İnce Ayar ve Sunum Hazırlığı)

### 🧪 Uç Senaryo Kontrolleri, Güvenlik, Sayaç Rozetleri & Sunum Dokümantasyonu
- **Uç Senaryo: Gelişmiş 404 Sayfası (`ProfileView.vue`)**:
  - `/:username` rotasında sistemde bulunmayan bir profil açılmak istendiğinde dinamik sayfa başlığı (`404 - Profil Bulunamadı | linkspace`), `UserX` ikonu, açıklayıcı metin, hem açık hem koyu tema uyumu, "Ana Sayfaya Dön" ve "Giriş Yap / Kayıt Ol" eylem butonları sunan tam donanımlı 404 ekranı oluşturuldu.
- **Hatalı & Güvensiz URL Girişlerini Engelleme (Regex Doğrulaması)**:
  - `backend/src/routes/linksRoutes.js` içinde `isValidUrl` regex doğrulaması eklendi; `javascript:`, `data:`, `vbscript:` gibi tehlikeli XSS şemaları kesinlikle engellendi ve HTTP 400 Bad Request döndürüldü.
  - `frontend/src/views/AdminView.vue` yeni link ve link düzenleme formlarına regex kontrolü, kırmızı kenarlık vurgusu ve `AlertCircle` hata mesajları eklendi.
- **Yönetim Panelinde Bağlantı Tıklama Sayacı Rozeti (`AdminView.vue`)**:
  - Her bağlantı kartına Linktree tarzı, toplam tıklamayı (`MousePointerClick`) ve genel tıklamalara oranını (`% CTR`) hesaplayan şık, interaktif bir sayaç rozeti entegre edildi.
- **Veritabanı ER Şeması (`docs/DATABASE_ER_DIAGRAM.md`)**:
  - Staj raporu ve mentor sunumuna hazır formatta Mermaid görsel ER diyagramı, `users`, `profiles`, `links`, `settings`, `visit_stats` tablolarının veri sözlüğü, kısıtları, ilişkileri ve indeksleme detayları çıkarıldı.
- **OpenAPI / Swagger & Postman Dokümantasyonu (`docs/swagger.json`, `docs/postman_collection.json`, `backend/src/server.js`)**:
  - OpenAPI 3.0.3 formatında `swagger.json` oluşturuldu.
  - Postman v2.1.0 formatında doğrudan import edilebilir `postman_collection.json` hazırlandı.
- **Marka Kimliği & Favicon Teması (`favicon.svg`)**:
  - Tarayıcı sekmesindeki varsayılan Vite mor logosu kaldırıldı; projenin Dribbble Sales CRM temasına tam uyumlu **Obsidiyen Koyu Zemin (`#0C0C0B`), Elektrik Siber Sarısı (`#FFFF00`) Şimşek ve Linkspace İmzası Sarı Kare Çipi** ile modern bir favicon tasarlandı.

---

## [v0.23.0] - 2026-10-22 (Faz 12: Sosyal Medya İkon Barı & Buton Şekil/Görünürlük Özelleştirmesi)

### 🚀 Sosyal Medya Butonları Görünürlük Kontrolü & Şekil/Stil Özelleştirmesi (`linkStore.js`, `AdminView.vue`, `PhonePreview.vue`, `ProfileView.vue`, `03_DATA_MODELS.md`)
- **İkonları Aktif/Pasif Yapma (Görünürlük Kontrolü)**:
  - Kullanıcı yönetim panelinden GitHub, Instagram, LinkedIn, Twitter/X, YouTube ve E-Posta butonlarını tek tıkla gizleyebilir veya aktif edebilir.
  - Linki pasif yapmak URL'yi silmez; kullanıcının girdiği URL korunur, sadece ziyaretçi sayfasında ve canlı önizlemede gizlenir.
- **Tüm Barı Açma / Kapatma Anahtarı (`barVisible`)**:
  - Sosyal medya ikon barını tamamen açıp kapatmayı sağlayan ana iOS switch eklendi.
- **İkon Şekli Seçici (`shape`)**:
  - 3 farklı buton şekli seçeneği sunuldu:
    - `rounded-full` (Tam Yuvarlak)
    - `rounded-xl` (Yumuşak Kare / Squircle)
    - `rounded-lg` (Kompakt Köşeli)
- **İkon Teması / Stili Seçici (`style`)**:
  - 3 farklı görsel stil sunuldu:
    - `glass` (Buzlu Cam / Glassmorphism)
    - `neon` (Neon Sarı Vurgulu Kenarlık & Parıltı)
    - `solid` (Sade Koyu Slate)
- **Anlık Canlı Önizleme Eşzamanlılığı**:
  - `AdminView.vue` içine `profileForm.value.socialLinks` üzerinde çalışan derin watcher entegre edildi. Kullanıcı admin panelinde bir switch'i değiştirdiği veya şekil seçtiği anda sağdaki iPhone 16 Pro mockup'ı (`PhonePreview.vue`) kaydetmeye gerek kalmadan anında güncellenir.
- **Ziyaretçi Sayfası Uyumluluğu (`ProfileView.vue`)**:
  - Ziyaretçi profilinde seçilen buton şekli, stili ve sadece aktif olan sosyal platformlar gösterilir.
- **PostgreSQL Kalıcılığı & Kesintisiz Geriye Dönük Uyumluluk**:
  - `socialLinks JSONB` formatı sayesinde yeni ayarlar veritabanı şemasını değiştirmeden kalıcı olarak saklanır; eski hesaplar varsayılan olarak tüm butonları aktif görür (`!== false` koruması).

---

## [v0.22.0] - 2026-10-22 (Faz 11: QR Kod Okutma & Cihaz Analitiği - Mobil vs Tarayıcı)

### 📊 QR Kod ve Ziyaretçi Cihaz Analitiği Sistemi (`AdminView.vue`, `ProfileView.vue`, `linkStore.js`, `analyticsRoutes.js`, `initDb.js`, `server.js`)
- **QR Kod URL'lerine Akıllı Kaynak Etiketi (`?src=qr`)**:
  - `AdminView.vue` ve `ProfileView.vue` paylaşım modallarında üretilen tüm QR kodlarının URL'leri otomatik olarak `?src=qr` parametresi ile damgalandı.
- **Ziyaretçi Sayfasında Cihaz & Kaynak Algılama (`ProfileView.vue`)**:
  - `navigator.userAgent` ve ekran genişliği analizi ile gelen ziyaretçinin **Mobil Cihaz** mı (telefon/tablet) yoksa **Masaüstü Web Tarayıcısı** mı olduğu tespit edilir.
  - URL'de `?src=qr` parametresi bulunduğunda ziyaret kaynağı `'qr'` olarak, bulunmadığında `'direct'` (doğrudan web) olarak kaydedilir ve store'a aktarılır.
- **Backend Analitik API Katmanı (`analyticsRoutes.js`, `initDb.js`, `server.js`)**:
  - PostgreSQL veritabanında `visit_stats` tablosu (`id`, `device`, `source`, `user_agent`, `created_at`) oluşturuldu ve gerçekçi tohum verileri eklendi.
  - `/api/analytics` (GET), `/api/analytics/visit` (POST), `/api/analytics/simulate` (POST), `/api/analytics/reset` (POST) rotaları kodlandı; veritabanı çevrimdışıyken kesintisiz graceful fallback sağlandı.
- **Pinia Reaktif Store Entegrasyonu (`linkStore.js`)**:
  - `analytics` reaktif durumu, `loadStoredData`, `DEFAULT_ANALYTICS`, LocalStorage senkronizasyonu.
  - `fetchAnalytics`, `trackVisit`, `simulateVisit` ve `resetAnalytics` aksiyonları yazıldı.
- **Yönetim Paneli "İstatistikler" Sekmesi Dönüşümü (`AdminView.vue`)**:
  - **4'lü Hızlı CRM Metrik Kartları**: Toplam QR Ziyareti, 📱 QR Mobil Giriş, 💻 QR Tarayıcı Giriş ve Toplam Sayfa Görüntülenme.
  - **İki Büyük Karşılaştırma Kartı**: Mobil Cihazlar (% ve adet, zümrüt gradyan çubuk) vs Masaüstü Web Tarayıcıları (% ve adet, siber mavi gradyan çubuk).
  - **Erişim Kanalı Dağılım Çubuğu**: QR Kod Taramaları ile Doğrudan Web Bağlantılarının iki renkli segmentli oran çubuğu.
  - **Canlı Test Simülatörü Araç Çubuğu**: Tek tıkla `+1 Mobil QR Girişi`, `+1 Tarayıcı QR Girişi` ve `+1 Doğrudan Web` ziyareti simüle etme ve test etme butonları.

---

## [v0.21.0] - 2026-10-22 (Faz 10: Zenginleştirilmiş Kapak Desenleri & Avatar/Profil Kişiselleştirmesi)

### 🎨 Genişletilmiş Kapak Desenleri & Avatar Özelleştirme Paketi (`linkStore.js`, `style.css`, `AdminView.vue`, `PhonePreview.vue`, `ProfileView.vue`, `initDb.js`, `profileRoutes.js`)
- **12 Adet Hazır Kapak Deseni & Şablonu**:
  - `BANNER_PATTERNS` 6'dan 12'ye çıkarıldı: CRM Neon & Asit Mesh, Siberpunk Neon & Cyan, Kuzey Işıkları (Aurora), Sıcak Sunset & Terracotta, Siber Izgara, Dot Matrix, Neon Dalgalar, Karbon Fiber, Yeşil Matrix Kodu, Kozmik Safir & Gece Mavisi, Retro Diagonal Çizgiler, Sade/Kapsız Mod.
  - `style.css` dosyasına yeni desenlerin gradyan, ızgara ve parlama efektleri eklendi.
- **Avatar Çerçeve Şekli Seçicisi (Avatar Shape Selector)**:
  - 3 farklı estetik geometri: Tam Yuvarlak (`rounded-full`), Modern Squircle (`rounded-2xl`), Hafif Kavisli (`rounded-xl`).
  - Hem yönetim paneli önizlemesinde, hem canlı iPhone 16 Pro mockup'ında (`PhonePreview.vue`), hem de ziyaretçi vitrininde (`ProfileView.vue`) anında reaktif yansıma.
- **Avatar Parıltı Rengi (Aura / Glow Selector)**:
  - 6 aura seçeneği: Elektrik Sarısı (#FFFF00), Neon Zümrüt & Lime, Siber Mavi & Cyan, Neon Mor & Pembe, Gül Pembesi & Amber, Parıltısız Sade Mat.
  - Avatar arkasındaki gradyan ışık halkasını ve kenarlık tonunu dinamik olarak değiştirir.
- **18 Adet Profesyonel Hazır Avatar & Kategori Filtresi**:
  - `PRESET_AVATARS` 6'dan 18'e yükseltildi.
  - 'Tümü', 'Portre', '3D', 'Siber', 'Stüdyo' sekmeleri ile kullanıcı tek tıkla kategoriye göre avatarları filtreleyip seçebilir.
- **Doğrulanmış Profil Rozeti (Onay İkonu) Aç/Kapa Toggle'ı**:
  - `isVerified` özelliği eklendi; kullanıcı profil başlığının yanındaki resmi onay tikini isteğe bağlı açıp kapatabilir.
- **Canlı Durum & Müsaitlik Bildirimi (Status Badge)**:
  - Biyografi üstünde sergilenen yanıp sönen animasyonlu sinyal rozeti.
  - Özel metin girişi (`statusText`) ve 5 sinyal seçeneği (`statusColor`: Zümrüt Yeşili, Amber/Turuncu, Safir Mavi, Mor/Fırtına, Rozeti Gizle).
  - 4 adet tek tıkla uygulanan popüler durum şablonu (`STATUS_PRESETS`).
- **Veritabanı Şeması ve REST API Güncellemesi**:
  - PostgreSQL `profiles` tablosuna `avatar_shape`, `avatar_glow`, `status_text`, `status_color`, `is_verified` sütunları eklendi.
  - `/api/profile` ve `/api/profile/:username` uç noktaları güncellendi; sunucu çevrimdışıyken LocalStorage modunda kesintisiz çalışır.

---

## [v0.20.0] - 2026-10-22 (Faz 9: Dinamik Yetenek & İlgi Alanı Rozetleri Kişiselleştirmesi - Badges & Tags)

### 🏷️ Gelişmiş Kullanıcı Arayüzü Kişiselleştirmesi (`linkStore.js`, `AdminView.vue`, `PhonePreview.vue`, `ProfileView.vue`)
- **Dinamik Rozet Veri Modeli ve Veritabanı (`03_DATA_MODELS.md`, `initDb.js`, `profileRoutes.js`)**:
  - `ProfileBadge` arayüzü eklendi (`id`, `text`, `icon`, `color`).
  - PostgreSQL `profiles` tablosuna `badges JSONB DEFAULT '[]'::jsonb` kolonu eklendi ve tohum verileri oluşturuldu.
  - `GET /api/profile`, `GET /api/profile/:username` ve `PUT /api/profile` uç noktalarında rozet desteği ve kesintisiz çevrimdışı fallback sağlandı.
- **Pinia Reaktif Durum ve Aksiyonları (`linkStore.js`)**:
  - 12 Lucide ikonundan oluşan `AVAILABLE_BADGE_ICONS` (`Code`, `Sparkles`, `MapPin`, `Briefcase`, `Heart`, `Coffee`, `Star`, `Flame`, `Zap`, `Award`, `Terminal`, `Globe`).
  - 6 farklı renk paletinden oluşan `BADGE_COLOR_STYLES` (Antrasit Cam, Elektrik Sarı `#FFFF00`, Neon Zümrüt, Siber Mavi, Neon Mor, Gül Pembesi).
  - `addBadge` ve `removeBadge` store aksiyonları ile anlık reaktif güncelleme ve LocalStorage senkronizasyonu.
- **Yönetim Paneli Rozet Yöneticisi (`AdminView.vue`)**:
  - "Görünüm & Tema" sekmesine özel **Yetenek & İlgi Alanı Rozetleri** paneli entegre edildi.
  - Mevcut rozetlerin anlık silme butonlu (`X`) canlı listesi.
  - 7 hazır önerilen etiket şablonu (Tek tıkla ekleme).
  - Özel rozet tanımlama alanı: Metin girişi, 12 ikon seçici, 6 renk seçici ve dinamik canlı mini önizleme.
- **Canlı Önizleme ve Ziyaretçi Vitrini Uyumu (`PhonePreview.vue` & `ProfileView.vue`)**:
  - Ziyaretçi sayfasındaki eski statik etiketler kaldırılarak dinamik `profile.badges` döngüsüne bağlandı.
  - iPhone 16 Pro mockup'ına (`PhonePreview.vue`) biyografi altına ölçeklenmiş reaktif rozetler entegre edildi; admin panelinde yapılan her ekleme/silme işlemi anında canlı telefonda ve vitrinde görünür kılındı.

---

## [v0.19.0] - 2026-10-21 (Faz 4 / Public Bio: Genel Profil Sayfası, Dinamik Rota ve Tıklama Takibi)

### 🚀 Dinamik Rota ve Genel Profil Sayfası (`ProfileView.vue`, `linkStore.js`, `profileRoutes.js`)
- **Dinamik Rota Kurulumu (`/:username`)**:
  - `ProfileView.vue` bileşeni `vue-router`'ın `/:username` parametresini dinleyecek şekilde entegre edildi (`loadProfileData(route.params.username)`).
  - Kullanıcı parametresi değiştiğinde reaktif `watch` ile profil ve aktif linkler anında yeniden çekilir.
  - Pinia store'a `fetchPublicProfile(targetUsername)` eklendi; backend API (`GET /api/profile/:username`) üzerinden hedef profil ve yalnızca aktif (`is_active = true`) bağlantılar çekilir.
- **Yükleme ve 404 Hata Ekranı**:
  - Profil yüklenirken şık neon sarı döner animasyonlu spinner (`isLoadingProfile`) gösterilir.
  - Tanımsız veya bulunamayan bir profil arandığında (`profileNotFound`), `UserX` ikonlu, detaylı açıklamalı ve tek tıkla "Ana Sayfaya Dön" butonuna sahip modern bir 404 sayfası sunulur.
- **Etkileşim Mantığı & Tıklama Takibi**:
  - Bağlantı kartları buton elementine (`<button type="button" @click="openLink(link)">`) dönüştürüldü.
  - Tıklandığında asenkron olarak `/api/links/:id/click` uç noktasına istek atılarak sayaç artırılır (`linkStore.trackClick`).
  - Hedef bağlantı güvenli bir şekilde yeni sekmede açılır (`window.open(targetUrl, '_blank', 'noopener,noreferrer')`).
- **Backend Çevrimdışı Dayanıklılığı (Resilience)**:
  - `POST /api/links/:id/click` rotası veritabanı kesintisinde istemci tarafını kilitlememek için graceful fallback JSON'ı döner.

---

## [v0.18.0] - 2026-10-21 (Faz 9: Profesyonel Vitrin Hub'ı & Atmosferik Ziyaretçi Ekranı - Showcase Hub)

### 🎨 Ziyaretçi Ekranı Dönüşümü (`ProfileView.vue` & `style.css`)
- **Genişletilmiş Profesyonel Vitrin Hub'ı (Showcase Hub)**:
  - Eski dar ve boş hissettiren tek sütunlu (`max-w-md` 448px) düzen yerine, modern geliştirici portfolyosu hissi veren ferah `max-w-2xl` genişliğinde, kavisli (`rounded-[36px]`), antrasit (`#121212/85`), ince kenarlıklı (`border-[#262626]`) ve cam morfizmli (`backdrop-blur-2xl`) vitrin kapsülü oluşturuldu.
- **Atmosferik Derinlik & Arka Plan Dokusu**:
  - Arka plandaki aşırı siyah boşluğu kırmak için çift taraflı yumuşak neon ve amber ışık küreleri (`blur-[140px]`) ve CSS tabanlı dot-matrix radyal ızgara dokusu (`.bg-ambient-grid`) eklendi.
- **Canlı Uygunluk Rozeti (Availability Badge)**:
  - Profil başlığına "🟢 Yeni Projelere & Fırsatlara Açık" metinli, yanıp sönen zümrüt ping animasyonlu profesyonel uygunluk rozeti eklendi.
- **Doğrulanmış Profil & Profesyonel Yetenek Çipleri**:
  - İsim yanına elektrik sarısı onay tiki (`CheckCircle2`), unvan, biyografi ve uzmanlık etiketleri (`Full-Stack Developer`, `Vue 3 & Node.js`, `İstanbul, TR`) entegre edildi.
- **Sadeleştirilmiş Profil Hiyerarşisi**:
  - Profil sayfasını kalabalıklaştıran 3'lü mini metrikler kutusu (Aktif Link / Tıklanma / Canlılık) kaldırılarak doğrudan biyografi, sosyal ağlar ve bağlantılara odaklanan daha rafine ve temiz bir düzen sağlandı.
- **Anlık Bağlantı Arama ve Filtreleme**:
  - Çok sayıda bağlantı arasında anında filtreleme sağlayan `v-model="searchQuery"` arama çubuğu ve sıfır sonuç durum ekranı eklendi.
- **Zenginleştirilmiş Bağlantı Kartları (Rich Link Cards)**:
  - Kartların altına domain ve kategori alt başlıkları (`getLinkSubtitle`), elektrik sarısı ikon kutuları, tıklanma sayaçları ve Dribbble tarzı `ArrowUpRight` aksiyon ikonları yerleştirildi.
- **Canlı Telefon Önizlemesi (`PhonePreview.vue`) Uyumu**:
  - İsmin yanına onay tiki eklendi, kalan eski mavi/cyan vurgular Dribbble CRM sarısı `#FFFF00` ve mat antrasit `#161616` ile hizalandı.
- **Linkspace Marka & Bağlantı Güncellemesi**:
  - Ziyaretçi üst kapsül menüsündeki ve paylaşım modallarındaki eski `linktr.ee/` kalıntıları `linkspace/` olarak güncellendi.
  - Ziyaretçi ekranı üst barındaki kullanıcı adı alanı (`linkspace/@tubagul`), tıklandığında bağlantıyı panoya kopyalayan (`copyProfileLink`) ve anlık geri bildirim veren interaktif bir hap butona dönüştürüldü.

---

## [v0.17.0] - 2026-10-21 (Faz 8: Profil Görseli & Özel Kapak Yönetimi - Banner Customizer & Preset Avatars)

### 🎨 Tasarım ve Yeni Özellikler (Profil Kapağı & Avatar Yönetimi)
- **Profil Kapağı (Banner) & Özel Arka Plan Desenleri**:
  - `AdminView.vue` Görünüm sekmesine canlı kapak önizleme kartı, bilgisayardan dosya seçerek görsel yükleme (`FileReader` ile Base64 data URL), kapak URL girişi ve kapak görselini kaldırma butonları eklendi.
  - 6 adet hazır kapak deseni ve şablonu tanımlandı (`BANNER_PATTERNS`):
    1. **CRM Neon & Asit Mesh**: Siyah zemin üzerinde elektrik sarısı ve mor derin radyal mesh gradyan.
    2. **Siber Izgara (Cyber Grid)**: Antrasit zemin üzerinde neon sarı siber ızgara deseni.
    3. **Dot Matrix Noktalar**: Minimalist teknolojik nokta matrisi.
    4. **Neon Dalgalar (Waves)**: Canlı akışkan neon ve amber dalga gradyanı.
    5. **Karbon Fiber Doku**: Mat antrasit endüstriyel lüks doku.
    6. **Sade / Kapsız Mod**: Klasik minimal Linktree profili (kapak gizlenir).
- **Profil Avatarı & Hızlı Hazır Avatarlar**:
  - Bilgisayardan avatar görseli yükleme (`FileReader` ile Base64) ve doğrudan URL desteği.
  - 6 adet tek tıkla seçilebilir popüler hazır avatar seçeneği (`PRESET_AVATARS` - Tuba Gül Orijinal, Modern Yazılımcı, Cyberpunk Neon, 3D Memoji, Dark Studio, Yaratıcı Sanat).
- **Canlı Mobil Telefon Önizlemesi (`PhonePreview.vue`) & Ziyaretçi Sayfası (`ProfileView.vue`)**:
  - Kapak aktifken avatar kapağın alt sınırını yarı yarıya keserek taştığı modern katmanlı görünüm uygulandı (`-mt-9` / `-mt-12`), parıldayan halo halkası ile zenginleştirildi.
- **Veritabanı ve REST API Entegrasyonu**:
  - PostgreSQL `profiles` tablosuna `banner TEXT` ve `banner_pattern VARCHAR(50) DEFAULT 'mesh'` sütunları eklendi.
  - `GET /api/profile`, `GET /api/profile/:username` ve `PUT /api/profile` rotaları kapak verilerini destekleyecek şekilde güncellendi.
- **Dinamik Ağ (Wi-Fi) IP Desteği**:
  - `localWifiIp` değişkeni dinamik `window.location.hostname` çözümlemesine geçirilerek yerel ağ IP'si otomatik algılanır kılındı.
- **Sağ Altta Sabit Yüzen QR Kod Butonu (`ProfileView.vue`)**:
  - Profil başlığı altında biyografiyi kesen buton kaldırıldı; ekranın sağ alt köşesinde kullanıcıyla birlikte kayan zarif yüzen buton (`fixed bottom-5 right-5 sm:bottom-6 sm:right-6`) oluşturuldu.

---

## [v0.16.0] - 2026-10-21 (Sales Team CRM Dark Dashboard & Mobile App Arayüz Dönüşümü - Birebir Renk Paleti)

### 🎨 Tasarım ve Arayüz Değişiklikleri (Dribbble CRM Dark Estetiği)
- **Dribbble Referansından Piksel Piksel Renk Analizi ve Uygulaması**:
  - Dribbble referans görseli (`crm_shot.png` - Maria Osadcha Sales Team CRM) doğrudan taranarak tasarımın ana imza renkleri tespit edildi ve uygulandı:
    1. **Ana Tuval & Zemin**: Mat Jet Siyahı (`#0C0C0B` / `#0A0A0A`).
    2. **Kart ve Panel Yüzeyleri**: Derin Koyu Antrasit Slate (`#161616` / `#181818`) ve ince sınırlar (`#282828`).
    3. **İmza Vurgusu & Aksiyon Rengi**: İkonik Elektrik Limon/Asit Sarısı (`#FFFF00` / `#FEFF00`) ve üzerine saf siyah (`text-black font-bold`).
    4. **Navigasyon Hapı**: Koyu antrasit kapsül (`#161616`) içinde beyaz aktif hap (`bg-white text-black font-bold`).
- **Yönetim Paneli (AdminView.vue)**:
  - Üst gezinme barında Dribbble'ın beyaz `Dashboard` hap stili uygulandı.
  - İstatistik sekmesine Dribbble'daki sarı **"Deals pipeline"** kartı (`bg-[#FFFF00] text-black` ve ↗ butonu) ile koyu **"Leads Month"** kartı (`#181818` zemin ve sarı ↗ butonu) uyarlandı.
  - "Yeni Bağlantı Ekle", form onay butonları ve "Paylaş" aksiyonu canlı `#FFFF00` elektrik sarısına dönüştürüldü.
- **Canlı Telefon Önizlemesi (PhonePreview.vue)**:
  - iPhone 16 Pro çerçevesi Dribbble'daki koyu titanyum gövde (`#0C0C0B` ve ince `#242424` çerçeve) ile uyarlandı.
- **Ziyaretçi Profili (ProfileView.vue) & Giriş Ekranı (LoginView.vue)**:
  - Profil kartları, dinamik QR kod paylaşım modalları ve kimlik doğrulama formları birebir `#0C0C0B`, `#181818` ve `#FFFF00` paletine geçirildi.
- **İçerik Bütünlüğü**:
  - Kullanıcının tüm mevcut verileri, biyografisi, linkleri, sıralama işlevi ve QR kod özellikleri %100 eksiksiz korundu.

---

## [v0.15.1] - 2026-10-21 (Gerçek Taranabilir QR Kod & Yerel Ağ (Wi-Fi) Telefon Erişimi)

### 🚀 Eklenenler & İyileştirmeler
- **Gerçek Dinamik QR Kod Entegrasyonu (`qrcode` kütüphanesi)**:
  - Mock statik SVG yerine istemci tarafında gerçek zamanlı üretilen dinamik QR kod entegre edildi.
- **Yerel Ağ / Wi-Fi Desteği (`--host`)**:
  - Vite dev sunucusu `--host` parametresiyle ağa açılarak yerel IP adresi (`http://192.168.1.25:5173/`) üzerinden telefonların erişebileceği şekilde yapılandırıldı.
- **Profil Ziyaretçi Sayfasında Linktree Tarzı Paylaşım & QR Kod Modalı (`ProfileView.vue`)**:
  - Üst menü barındaki "Paylaş" butonu ve profil başlığı altındaki yeni "QR Kodu Göster" butonu ile ziyaretçilerin sayfayı arkadaşlarıyla QR kod ile anında paylaşabilmesi sağlandı.
  - Teleport destekli açılır pencerede profil resmi, `@username`, taranabilir dinamik QR kod, tek tıkla kopyalama ve Wi-Fi / yerel tarayıcı seçenekleri sunuldu.
  - `router/index.js` rotalarına `/:username` eklenerek hem kök dizin (`/`) hem de kullanıcı adı URL'leri (`/@username` / `username`) desteklendi.

---

## [v0.15.0] - 2026-10-21 (Şartname Faz 3: Frontend Yönetim Paneli, HTML5 Drag & Drop Sıralama & Canlı Önizleme)

### 🚀 Eklenenler & İyileştirmeler
- **HTML5 Drag and Drop API ile Sıralama Desteği**:
  - `AdminView.vue` bağlantı kartlarına yerel HTML5 sürükle-bırak (`draggable="true"`, `@dragstart`, `@dragover`, `@dragleave`, `@drop`, `@dragend`) entegre edildi.
  - Sürüklenen öğe için şeffaflaşma ve mor kesikli çizgi (`opacity-30 border-dashed ring-2 ring-purple-500`), hedef öğe için pembe vurgulu parıltı (`ring-2 ring-pink-500 bg-purple-500/10 scale-[1.01]`) görsel geribildirimleri sağlandı.
  - Sürükleme tutamacı (`GripVertical`) `cursor-grab active:cursor-grabbing` ile interaktif kılındı; alternatif olarak yukarı/aşağı butonları korunarak erişilebilirlik sağlandı.
  - Pinia `linkStore.js` mağazasına `reorderLinks(fromIndex, toIndex)` aksiyonu eklenerek hem reaktif arayüz hem de `PUT /api/links/reorder` arka uç senkronizasyonu tamamlandı.
- **Canlı Mobil Önizleme (Live Preview) Reaktif Entegrasyonu**:
  - Kullanıcı yönetim panelinde link eklediğinde, sildiğinde, aktiflik durumunu (`is_active` iOS switch) değiştirdiğinde veya sürükle-bırak ile sırasını değiştirdiğinde sağ taraftaki iPhone 16 Pro mockup'ı anlık olarak senkronize edilir.

---

## [v0.14.0] - 2026-10-21 (Şartname Faz 1 & Faz 2 %100 Tamamlama: Register, PUT Reorder & Profile:username)

### 🚀 Eklenenler & İyileştirmeler
- **Yeni Kullanıcı Kaydı (Register API & UI)**:
  - `POST /api/auth/register`: E-posta format doğrulaması, şifre uzunluk kontrolü, benzersiz kullanıcı adı ve e-posta denetimi, bcrypt hashleme, kullanıcıya özel profil tohumlama ve JWT token üretimi.
  - PostgreSQL `users` tablosuna `email VARCHAR(255) UNIQUE` sütunu eklendi (`initDb.js`).
  - Pinia `authStore.js` mağazasına `register({ name, username, email, password })` aksiyonu entegre edildi.
  - `LoginView.vue` arayüzüne cam efektli, sekmeli "Giriş Yap" ve "Yeni Kayıt" mod geçişi, form alanları ve başarı bildirimleri kodlandı.
- **Toplu Sıralama `PUT /api/links/reorder` Desteği**:
  - Şartnameye uygun olarak `PUT /api/links/reorder` uç noktası eklendi; geriye dönük uyumluluk için `POST /api/links/reorder` da korunarak transaction içinde `order_index` toplu güncellemesi sağlandı.
  - `POST /api/links` uç noktası `orderIndex` ve `isActive` opsiyonel parametrelerini destekleyecek şekilde güncellendi.
- **Ziyaretçiler İçin Dinamik Profil & Aktif Linkler (`GET /api/profile/:username`)**:
  - Dışarıdan gelen `:username` parametresine göre profil bilgilerini ve yalnızca ziyaretçilere açık aktif bağlantıları (`WHERE is_active = true`) tek bir JSON yanıtında dönen genel uç nokta kodlandı.
  - Veritabanı çevrimdışıyken kesintisiz test ve kullanım için `tubagul` ve `admin` kullanıcıları için akıllı graceful fallback koruması eklendi.
- **Modern Navigation Guard**:
  - `router/index.js` içerisindeki `beforeEach` yetkilendirme kontrolü Vue Router'ın modern return tabanlı syntax'ına geçirilerek deprecation uyarıları temizlendi.

---

## [v0.13.0] - 2026-10-16 (Orijinal Linktree Kapsül App Bar & Üst Duyuru Bandı Tasarımı)

### 🚀 Eklenenler & İyileştirmeler
- **Linktree Kapsül (Floating Pill) App Bar (`AdminView.vue` & `ProfileView.vue`)**:
  - Düz ve köşeli üst bar yerine, Linktree resmi web sitesindeki gibi merkezlenmiş, yüzen ve `rounded-full` kapsül şeklinde şık beyaz/koyu cam efektli (`backdrop-blur-md`) menü barı uygulandı.
  - **Sol Alan**: Kullanıcı talebine uygun olarak amblem kaldırılarak doğrudan yalın ve modern **`linkspace`** tipografik logosu yerleştirildi.
  - **Orta Alan**: Linktree web sitesindeki navigasyon hiyerarşisi gibi sekmeler (`Bağlantılar`, `Görünüm`, `İstatistikler`, `Ayarlar`) doğrudan kapsülün merkezine yerleştirildi. Aktif sekme için yumuşak hap vurgusu sağlandı.
  - **Sağ Alan**: `Profili Gör` hızlı bağlantısı, `Çıkış Yap` yalın metin butonu ve Linktree'nin `Sign up free` tarzı siyah/koyu yuvarlak kapsül **`Paylaş`** butonu yerleştirildi.
- **Kırmızı Linktree Üst Duyuru Bandı (Announcement Banner)**:
  - Sayfanın en üstünde Linktree'nin imza bordo renginde (`bg-[#780016]`) dismissible (`✕` butonlu) duyuru bandı eklendi.
- **Ziyaretçi Sayfası Uyumluluğu (`ProfileView.vue`)**:
  - `ProfileView.vue` en üstüne de aynı Linktree kapsül app barı entegre edildi: sol logo, orta `linktr.ee/kullaniciadi`, sağ yönetici girişi ve hızlı paylaşım hapı.

---

## [v0.12.0] - 2026-10-16 (Faz 7 Tam Kapsamlı Linktree Mimarisi, Çift Sütunlu Arayüz & Canlı Telefon Mockup'ı)

### 🚀 Eklenenler & İyileştirmeler
- **Orijinal Linktree Çift Sütunlu Bölünmüş Ekran (Split Screen Layout)**:
  - Masaüstünde `grid grid-cols-12` düzeni: Sol sütun (`col-span-8`) yönetim kontrolleri, sağ sütun (`col-span-4`) `sticky top-24` canlı güncellenen iPhone 16 Pro telefon ekranı.
  - Mobilde sağ altta yüzen `📱 Önizleme` butonu ile açılan tam ekran canlı önizleme çekmecesi.
- **Canlı iPhone 16 Pro Mockup Bileşeni (`PhonePreview.vue`)**:
  - Dynamic Island, üst durum çubuğu (09:41, Wi-Fi, Pil), metalik kenarlıklar ve kaydırılabilir canlı profil akışı.
  - Kullanıcı yönetim panelinde bağlantı eklediğinde, sildiğinde veya tema değiştirdiğinde telefon ekranı anında reaktif olarak güncellenir.
- **Linktree Sekme Yapısı ve Organizasyonu (`AdminView.vue`)**:
  - `Bağlantılar`: Link ekleme ve listeleme kartları.
  - `Görünüm & Tema`: Profil kimliği (avatar, isim, 160 karakter biyografi), sosyal medya barı, 6 ziyaretçi teması ve açık/koyu panel seçimi.
  - `İstatistikler`: Toplam tıklanma, aktif link oranı, en popüler link ve tıklama dağılımı ilerleme çubukları.
  - `Ayarlar`: Oturum bilgileri, PostgreSQL durumu ve `/api/auth/change-password` şifre güncelleme formu.
- **Linktree Kart Tasarımı & iOS Tarzı Toggle Switch**:
  - Bağlantı kartlarında sürükleme tutamaçları (`GripVertical`), iOS tarzı yeşil aktif/gizli switch ve tıklanma sayaçları.
- **Linktree Üst Bar & Paylaşım Çubuğu (Share Bar)**:
  - `linktr.ee/kullaniciadi` hapı (pill), tek tıkla kopyalama ve açılır dinamik SVG QR kod paylaşım modalı.
- **Auth Store Şifre Değiştirme Aksiyonu (`authStore.js`)**:
  - `changePassword(currentPassword, newPassword)` aksiyonu eklenerek JWT korumalı backend endpoint'i ile bağlandı.

---

## [v0.11.0] - 2026-10-16 (Faz 7.4 Yönetim Paneli ve Profil Açık / Koyu Tema Desteği)

### 🚀 Eklenenler & İyileştirmeler
- **Tema & Görünüm Sekmesi Entegrasyonu (`AdminView.vue`)**:
  - "Tema & Görünüm" sekmesine iki bölümlü tasarım uygulandı:
    1. **Bölüm 1: Yönetim Paneli Arayüz Teması**: Açık Tema (Güneş) ve Koyu Tema (Ay) seçim kartları eklenerek doğrudan bu sekmeden arayüz modu kontrol edilebilir kılındı.
    2. **Bölüm 2: Ziyaretçi Profil Teması**: Ziyaretçi ekranı için renk paletleri listesi.
- **Ziyaretçi Ekranına "Minimalist Aydınlık" (Açık Tema) Şablonu**:
  - `THEMES` dizisine 6. tema olarak `pure-light` (Minimalist Aydınlık Açık Tema) eklendi (`linkStore.js`).
  - `ProfileView.vue` üzerinde açık zeminlerde metinler, cam kartlar ve ikon kutuları için yüksek kontrastlı (`text-slate-900`, `bg-white/90`, `border-slate-300`) stil desteği sağlandı.
- **Merkezi Durum Yönetimi & Kalıcılık (`linkStore.js`)**:
  - `adminTheme` reaktif durumu (`'dark' | 'light'`), `toggleAdminTheme` ve `setAdminTheme` aksiyonları tanımlandı.
  - `STORAGE_KEYS.ADMIN_THEME` (`linktree_admin_theme`) ile kullanıcının tema tercihi LocalStorage üzerinde saklanır ve sayfa yenilemelerinde korunur.
- **Üst Bar Sadeleştirildi**: Üst bardaki tema geçiş butonu kaldırılarak görünüm temizlendi; tüm tema kontrolleri merkezi olarak "Tema & Görünüm" sekmesinde toplandı.
- **Tam Kapsamlı Açık Mod Renk Paleti ve Tipografi**:
  - `themeClasses` computed yapısı ile ana zemin, üst bar, sekmeler, analitik panoları, yeni link ekleme formu, kayıtlı link kartları, tema seçim kartları, profil formu ve açılır düzenleme modalı hem açık (`slate-100/white`) hem koyu (`slate-950/slate-900`) modlara tam uyumlu hale getirildi.

---

## [v0.10.0] - 2026-10-16 (Faz 7.3 Hızlı Erişim Sosyal Medya İkon Barı)

### 🚀 Eklenenler & İyileştirmeler
- **Veritabanı ve REST API Katmanı**:
  - PostgreSQL `profiles` tablosuna `social_links JSONB DEFAULT '{}'` sütunu eklendi (`initDb.js`).
  - `GET /api/profile` ve `PUT /api/profile` rotaları `socialLinks` alanını kabul edecek ve döndürecek şekilde güncellendi.
- **Frontend Store & Reaktif Durum Yönetimi**:
  - `linkStore.js` `DEFAULT_PROFILE` ve yerel depolama okuyucusu `socialLinks` alanını içerecek şekilde normalize edildi.
  - `updateProfile` aksiyonu hem PostgreSQL API'ye hem de LocalStorage'a sosyal medya bağlantılarını çift yönlü kaydeder.
- **Yönetim Paneli Sosyal Medya Form Alanları (`AdminView.vue`)**:
  - Profil Bilgileri sekmesine GitHub, LinkedIn, Instagram, Twitter/X, YouTube ve E-Posta adresleri için özel ikonlu giriş alanları eklendi.
  - Form verileri reaktif `watch` ile API senkronizasyonunda otomatik güncellenir.
- **Profil Ziyaretçi Görünümü Dairesel İkon Barı (`ProfileView.vue`)**:
  - Biyografi metninin hemen altında, doldurulmuş sosyal bağlantılar için cam efektli (`bg-white/5 border-white/10 backdrop-blur-md`) dairesel buton barı oluşturuldu.
  - Her bir platform için özel marka hover renkleri (GitHub beyazı, LinkedIn mavisi, Instagram pembesi, X gökyüzü mavisi, YouTube kırmızısı, E-Posta amberi) ve büyüme animasyonu (`hover:scale-110 active:scale-95`) uygulandı.

---

## [v0.9.0] - 2026-10-16 (Faz 6 Özel İkon ve Buton Görsel Özelleştirmeleri)

### 🚀 Eklenenler & İyileştirmeler
- **Veritabanı ve REST API Desteği**:
  - `links` tablosuna `custom_color` sütunu eklendi (`ALTER TABLE links ADD COLUMN IF NOT EXISTS custom_color VARCHAR(50) DEFAULT 'default'`).
  - `GET /api/links`, `POST /api/links` ve `PUT /api/links/:id` rotalarında `customColor` alanı desteklendi.
- **İkon ve Renk Seçici Arayüzü (`AdminView.vue`)**:
  - 13 zengin Lucide ikon seçeneği (`Sparkles`, `Globe`, `Github`, `Linkedin`, `Instagram`, `Youtube`, `Twitter`, `Mail`, `Phone`, `Code`, `Music`, `ShoppingBag`, `BookOpen`) entegre edildi.
  - 7 farklı buton renk stili (Tema Varsayılanı, Mor Işıltı, Zümrüt Yeşili, Okyanus Mavisi, Gün Batımı Kızılı, Amber Altın, Minimal Karbon) yeni link formuna ve düzenleme modalına eklendi.
  - Bağlantı listesinde özel renk rozetleri (`Palette` ikonu ile) ve dinamik ikonlar gösterildi.
- **Profil Ziyaretçi Ekranı Dinamik Render (`ProfileView.vue`)**:
  - `getLinkCardClass` ve `getLinkAccentText` fonksiyonları kodlanarak buton renk stilleri ve tema renkleri uyumlu hale getirildi.
  - İkonlar şık, cam efektli (`bg-white/10 border-white/10`) kutucuk içerisine alınarak estetik görsel hiyerarşi oluşturuldu.
  - `linkStore.js` veri normalizasyonu ile API'den gelen `customColor` ve `icon` verilerinin tam güvenliği sağlandı.

---

## [v0.8.0] - 2026-10-16 (Faz 5 Kimlik Doğrulama ve Yönetici Güvenliği)

### 🚀 Eklenenler & İyileştirmeler
- **Backend JWT & Bcrypt Güvenlik Katmanı**:
  - `backend/` paketlerine `jsonwebtoken` ve `bcryptjs` eklendi.
  - Veritabanına `users` tablosu eklendi ve varsayılan yönetici hesabı (`admin` / `admin123`) bcrypt ile hashlenerek tohumlandı.
  - `authMiddleware.js` (`requireAuth`) ile Authorization Bearer token doğrulama mekanizması yazıldı.
  - Hassas backend rotaları (`PUT /api/profile`, `POST /api/links`, `PUT /api/links/:id`, `DELETE /api/links/:id`, `POST /api/links/reorder`, `POST /api/links/reset-clicks`, `PUT /api/settings/theme`) yetkilendirme koruması altına alındı; ziyaretçi rotaları (`GET /profile`, `GET /links`, `POST /links/:id/click`, `GET /settings/theme`) herkese açık tutuldu.
  - Yeni kimlik doğrulama uç noktaları: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`.
- **Frontend Pinia `authStore.js` & Token Yönetimi**:
  - `token`, `user`, `isAuthenticated` durumları tanımlandı; token `localStorage` ile kalıcı kılındı.
  - `linkStore.js` mutasyon isteklerine otomatik JWT `Authorization` başlığı eklendi.
- **Modern Yönetici Giriş Sayfası (`LoginView.vue`)**:
  - Cam efektli (glassmorphism), karanlık tema uyumlu şık giriş arayüzü kodlandı.
  - Şifre göster/gizle ikonu, dinamik hata bildirim kutusu ve tek tıkla demo doldurma (`admin` / `admin123`) desteği sağlandı.
- **Vue Router Navigation Guard Koruması (`router/index.js`)**:
  - `/admin` rotasına `requiresAuth` meta kuralı eklendi; yetkisiz erişimler otomatik olarak `/login?redirect=/admin` sayfasına yönlendirilir.
  - Giriş yapmış kullanıcılar `/login` sayfasına gittiğinde doğrudan `/admin` paneline aktarılır.
  - `AdminView.vue` başlığına "Çıkış Yap" (Logout) butonu yerleştirildi.

---

## [v0.7.0] - 2026-10-16 (Faz 2.4 Bağlantı Düzenleme Modalı Tamamlandı)

### 🚀 Eklenenler & İyileştirmeler
- **Bağlantı Düzenleme Modalı (`AdminView.vue`)**:
  - Her bir bağlantı kartına `Pencil` ikonu ile düzenleme butonu eklendi.
  - Açılır modalda (`Teleport`) başlık ve URL güncellenebilir hale getirildi.
  - Form doğrulama, arka plan bulanıklığı (`backdrop-blur-sm`), `Escape` tuşu ve dışa tıklama ile kapatma desteği sağlandı.
  - `linkStore.updateLink` ile hem Pinia ve LocalStorage hem de arka uç PostgreSQL API (`PUT /api/links/:id`) çift yönlü senkronize edildi.
- **Backend Güçlendirmesi (`backend/src/routes/linksRoutes.js`)**:
  - `PUT /api/links/:id` uç noktasında URL'lerin protokol kontrolü (`http://` veya `https://`) otomatik güvenceye alındı.

---

## [v0.6.1] - 2026-10-16 (Docker PostgreSQL ve Canlı Servisler Aktif)

### 🚀 Eklenenler & İyileştirmeler
- **Docker PostgreSQL 16 Konteyneri Ayağa Kaldırıldı**:
  - `docker compose up -d` ile `linktree-postgres` konteyneri oluşturuldu ve çalıştırıldı.
  - Veritabanı tabloları (`profiles`, `links`, `settings`) migration scripti ile oluşturulup tohumlandı.
- **Canlı Full-Stack Entegrasyonu**:
  - Backend API (`http://localhost:5000`) ve Frontend Vite geliştirme sunucusu (`http://localhost:5173`) başlatıldı.
  - Frontend, yerel LocalStorage modundan PostgreSQL API bağlantısına sorunsuz geçiş yaptı.

---

## [v0.6.0] - 2026-10-16 (Faz 4 Backend & PostgreSQL Mimarisi)

### 🚀 Eklenenler & İyileştirmeler
- **Node.js & Express.js REST API Servisi (`backend/`)**:
  - `backend/` dizini altında tam teşekküllü API servisi kuruldu (`npm install` ile `express`, `pg`, `cors`, `dotenv` paketleri yüklendi).
  - Port `5000` üzerinde çalışan ve istekleri kaydeden Express sunucusu (`server.js`) kodlandı.
- **PostgreSQL Veritabanı ve Şema Yönetimi**:
  - `src/db.js` üzerinden `pg.Pool` bağlantı havuzu oluşturuldu.
  - `src/initDb.js` ile `profiles`, `links` ve `settings` tablolarını otomatik oluşturan ve tohum verilerini yükleyen migration sistemi hazırlandı.
- **Tam Kapsamlı REST Rotaları**:
  - Profil yönetimi: `GET /api/profile`, `PUT /api/profile`
  - Bağlantı yönetimi: `GET /api/links`, `POST /api/links`, `PUT /api/links/:id`, `DELETE /api/links/:id`
  - Analitik & Tıklama: `POST /api/links/:id/click` (atomik sayaç artırıcı)
  - Sıralama: `POST /api/links/reorder` (transaction destekli toplu sıra güncelleme)
  - Tema: `GET /api/settings/theme`, `PUT /api/settings/theme`
- **Konteyner Desteği (`docker-compose.yml`)**:
  - Tek komutla ayağa kaldırılabilen PostgreSQL 16 container tanımı kök dizine eklendi.
- **Frontend Hibrit Entegrasyonu**:
  - `frontend/src/stores/linkStore.js` API ile senkronize çalışacak şekilde güncellendi.
  - Backend çevrimdışıyken kesintisiz olarak LocalStorage üzerinde çalışmayı sürdüren `graceful fallback` mimarisi kuruldu.
  - `AdminView.vue` başlığına canlı bağlantı durumu (PostgreSQL API Bağlı / Yerel Mod) rozeti yerleştirildi.

---

## [v0.5.0] - 2026-10-16 (Faz 3.3 Çoklu Tema ve Arka Plan Sistemi)

### 🚀 Eklenenler & İyileştirmeler
- **Merkezi Tema Altyapısı (`THEMES`, `currentTheme`, `activeTheme`)**:
  - 5 adet tema şablonu (Gece Moru, Zümrüt Yeşili, Gün Batımı, Derin Okyanus, Minimalist Karbon) eklendi.
- **Yönetim Paneli Tema Seçim Sekmesi**:
  - `AdminView.vue` içerisine canlı gradyan önizlemeli "Tema & Görünüm" sekmesi eklendi.

---

## [v0.4.0] - 2026-10-16 (Faz 3.2 Sıralama Değiştirme Entegrasyonu)
- `moveLinkUp` ve `moveLinkDown` ile yukarı/aşağı sıralama butonları eklendi.

---

## [v0.3.0] - 2026-10-16 (Faz 3.1 Tıklama Analitiği & Sayaç Entegrasyonu)
- Gerçek zamanlı tıklama takibi ve yönetim panelinde analitik panosu kuruldu.

---

## [v0.2.0] - 2026-10-16 (Faz 1 & Faz 2 Temel Entegrasyonları)
- Pinia mağazası ve LocalStorage kalıcılığı kuruldu.

---

## [v0.1.0] - 2026-10-16 (Vault Sistemi Kurulumu ve Proje Analizi)
- Proje için merkezi Vault kuruldu (`00_INDEX.md` - `07_CHANGELOG.md`).
