# 🗺️ 05 - YOL HARİTASI VE GÖREV LİSTESİ (ROADMAP & BACKLOG)

Bu liste, projenin geliştirme fazlarını ve önceliklendirilmiş iş paketlerini içerir.

---

## 📌 Faz 1: Temel Durum ve Kalıcılık Entegrasyonu (TAMAMLANDI ✅)
- [x] **Görev 1.1: Pinia Store Entegrasyonu**
- [x] **Görev 1.2: LocalStorage Kalıcılığı**
- [x] **Görev 1.3: Şablon Temizliği**

---

## 📌 Faz 2: Zenginleştirilmiş Profil ve Bağlantı Yönetimi (TAMAMLANDI ✅)
- [x] **Görev 2.1: Profil Bilgilerini Düzenleme Arayüzü**
- [x] **Görev 2.2: Otomatik İkon Desteği**
- [x] **Görev 2.3: Toast Bildirimleri (Feedback UI)**
- [x] **Görev 2.4: Bağlantı Düzenleme Modalı (Inline Edit / Modal)**

---

## 📌 Faz 3: Tema ve Analitik (TAMAMLANDI ✅)
- [x] **Görev 3.1: Tıklama Sayacı (Click Counter / Analytics)**
- [x] **Görev 3.2: Sıralama Değiştirme (Yukarı / Aşağı Taşıma)**
- [x] **Görev 3.3: Tema Seçenekleri (5 Farklı Estetik Tema)**

---

## 📌 Faz 4: Backend ve Veritabanı Entegrasyonu (TAMAMLANDI ✅)
- [x] **Görev 4.1: Express.js REST API Servisi**
  - `backend/` dizininde modüler Express.js sunucusu oluşturuldu, CORS ve JSON middleware'leri kuruldu.
- [x] **Görev 4.2: PostgreSQL Veritabanı Modelleri ve Migration**
  - `profiles`, `links` ve `settings` tablolarını kuran ve varsayılan verileri tohumlayan `src/initDb.js` yazıldı.
- [x] **Görev 4.3: REST API Uç Noktaları (Endpoints)**
  - Profil (`/api/profile`), Ziyaretçi Aktif Profil (`/api/profile/:username`), Bağlantılar (`/api/links`), Tıklama (`/click`), Sıralama (`PUT /reorder` & `POST /reorder`) ve Tema (`/api/settings/theme`) rotaları tamamlandı.
- [x] **Görev 4.4: Frontend Hibrit Senkronizasyonu**
  - `linkStore.js` API'ye bağlandı; backend çevrimdışıyken LocalStorage modunda çalışmaya devam eden dayanıklı (resilient) mimari kuruldu.
- [x] **Görev 4.5: Docker Yapılandırması**
  - Kök dizinde `docker-compose.yml` PostgreSQL 16 hazırlandı.

---

## 📌 Faz 5: Kimlik Doğrulama ve Yönetici Güvenliği (Auth & JWT) (TAMAMLANDI ✅)
- [x] **Görev 5.1: Veritabanı Kullanıcı Tablosu ve Seed (`initDb.js`)**
  - `users` tablosu oluşturuldu (`email` alanı dahil) ve varsayılan `admin` kullanıcısı bcrypt ile tohumlandı.
- [x] **Görev 5.2: Backend JWT Kimlik Doğrulama Katmanı**
  - `authMiddleware.js` ve `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/change-password` rotaları hazırlandı.
- [x] **Görev 5.3: Hassas Rotaların Korunması**
  - Profil, linkler ve tema değişiklikleri için yetki doğrulaması (`requireAuth`) middleware'i uygulandı.
- [x] **Görev 5.4: Frontend Pinia `authStore.js` ve Rota Koruması (`router/index.js`)**
  - Giriş durumu yönetimi, `login`, `register`, `changePassword` aksiyonları ve `/admin` rotası için navigation guard koruması kuruldu.
- [x] **Görev 5.5: Modern Giriş ve Kayıt Ekranı (`LoginView.vue`) ve Çıkış Butonu**
  - Cam efektli estetik arayüzde "Giriş Yap" ve "Yeni Kayıt" sekmeleri, hata/başarı bildirimleri, demo doldurma butonu tamamlandı.

---

## 📌 Faz 6: Özel İkon ve Buton Görsel Özelleştirmeleri (TAMAMLANDI ✅)
- [x] **Görev 6.1: Veritabanı ve API Desteği (`custom_color` ve `icon`)**
  - `links` tablosuna `custom_color` alanı eklendi ve REST API rotaları güncellendi.
- [x] **Görev 6.2: İkon ve Renk Seçici Bileşeni / Arayüzü (`AdminView.vue`)**
  - Yeni link ekleme formuna ve link düzenleme modalına 13 zengin ikon listesi ve 7 buton renk paleti seçicisi entegre edildi.
- [x] **Görev 6.3: Profil Görünümü Dinamik Render (`ProfileView.vue`)**
  - `getLinkCardClass` ve `getLinkAccentText` ile özel ikonlar ve renk paletleri ziyaretçi profilinde dinamik yansıtıldı, cam efektli ikon kutusu eklendi.

---

## 📌 Faz 7: Linktree Mimarisi, Canlı Mobil Önizleme ve Paylaşım (TAMAMLANDI ✅)
- [x] **Görev 7.1: Yönetim Panelinde Canlı Mobil Cihaz Önizlemesi (Live Device Frame)**
  - Masaüstü modunda admin panelinde çift sütunlu yerleşim (`grid grid-cols-12`): Sol tarafta sekmeli kontroller, sağ tarafta `sticky top-24` iPhone 16 Pro mockup'ı (`PhonePreview.vue`).
  - Mobil cihazlar için sağ altta yüzen `📱 Önizleme` butonu ve tam ekran kayan önizleme çekmecesi (drawer/modal).
  - Dynamic Island, saat 09:41, Wi-Fi, Pil ve canlı senkronize kaydırılabilir profil önizlemesi.
- [x] **Görev 7.2: Linktree Paylaşım Çubuğu & QR Kod Modalı**
  - Üst barda `linktr.ee/kullaniciadi` hapı (pill), tek tıkla panoya kopyalama ve "Paylaş" aksiyon butonu.
  - Dinamik SVG QR kod oluşturan, harici tam ekran profil bağlantısı sunan açılır paylaşım modalı.
- [x] **Görev 7.3: Sosyal Medya İkon Barı (Header Social Links)**
  - PostgreSQL `profiles` tablosuna `social_links JSONB` eklendi, REST API rotaları güncellendi.
  - `AdminView.vue` Görünüm sekmesine GitHub, LinkedIn, Instagram, Twitter/X, YouTube ve E-Posta giriş alanları entegre edildi.
  - `ProfileView.vue` başlığı altına cam efektli, hover animasyonlu hızlı erişim dairesel sosyal medya buton barı kodlandı.
- [x] **Görev 7.4: Yönetim Paneli Açık / Koyu Tema Desteği ve Tema & Görünüm Entegrasyonu**
  - "Görünüm & Tema" sekmesi altına **Yönetim Paneli Arayüz Teması (Açık / Koyu)** interaktif seçim kartları entegre edildi.
  - Ziyaretçi profil temalarına yeni **"Minimalist Aydınlık (Açık Tema)"** şablonu eklendi ve `ProfileView.vue` üzerinde yüksek kontrastla desteklendi.
  - Pinia `linkStore.js` üzerinden `adminTheme` durumu, `setAdminTheme` aksiyonu ve LocalStorage kalıcılığı sağlandı.
- [x] **Görev 7.5: Linktree Kartları, iOS Switch ve Ayarlar Sekmesi**
  - Bağlantı kartlarında sürükleme noktaları (`GripVertical`), iOS tarzı aktif/gizli switch, tıklanma rozetleri.
  - Ayarlar sekmesinde `/api/auth/change-password` ile tam entegre şifre değiştirme formu.

---

## 📌 Faz 8: Profil Görseli & Özel Kapak Yönetimi (TAMAMLANDI ✅)
- [x] **Görev 8.1: Veritabanı ve REST API Katmanı (`banner` ve `banner_pattern`)**
  - PostgreSQL `profiles` tablosuna `banner TEXT` ve `banner_pattern VARCHAR(50) DEFAULT 'mesh'` sütunları eklendi.
  - `GET /api/profile`, `GET /api/profile/:username` ve `PUT /api/profile` rotalarına kapak desteği entegre edildi.
- [x] **Görev 8.2: Pinia Store & Reaktif Durum Yönetimi (`linkStore.js`)**
  - `DEFAULT_PROFILE` yapısına `banner` ve `bannerPattern` eklendi; `PRESET_AVATARS` (6 hazır avatar) ve `BANNER_PATTERNS` (6 hazır desen) tanımlandı.
- [x] **Görev 8.3: Yönetim Paneli Görünüm Sekmesi (`AdminView.vue`)**
  - Canlı kapak önizleme kartı, görsel yükleme (`FileReader` ile Base64), kapak URL girişi, 6 kapak deseni seçicisi ve kapak kaldırma aksiyonu.
  - Canlı avatar önizlemesi, "Görsel Yükle (Dosya Seç)" butonu, 6 adet tek tıkla seçilebilir hızlı hazır avatar galerisi ve doğrudan URL desteği.
- [x] **Görev 8.4: Canlı Mobil Telefon Önizlemesi (`PhonePreview.vue`) & Ziyaretçi Sayfası (`ProfileView.vue`)**
  - Profil başlığına zarif kapak (banner) alanı entegre edildi; avatarın kapağın alt sınırını yarı yarıya keserek taştığı modern katmanlı görünüm kodlandı.
  - CSS/SVG tabanlı 6 desen şablonu (`banner-mesh`, `banner-grid`, `banner-dots`, `banner-waves`, `banner-carbon`, `banner-none`) tanımlandı.

---

## 📌 Faz 9: Dinamik Yetenek & İlgi Alanı Rozetleri (Badges & Tags Personalization) (TAMAMLANDI ✅)
- [x] **Görev 9.1: Veri Modeli ve Veritabanı Şeması (`03_DATA_MODELS.md`, `initDb.js`, `profileRoutes.js`)**
  - `ProfileBadge` arayüzü tanımlandı. PostgreSQL `profiles` tablosuna `badges JSONB DEFAULT '[]'::jsonb` kolonu eklendi.
  - `GET /api/profile`, `GET /api/profile/:username` ve `PUT /api/profile` rotalarına badges JSONB desteği entegre edildi.
- [x] **Görev 9.2: Pinia Store Durumu & Aksiyonları (`linkStore.js`)**
  - `AVAILABLE_BADGE_ICONS` (12 Lucide ikonu) ve `BADGE_COLOR_STYLES` (6 tema renk paleti) tanımlandı.
  - `DEFAULT_PROFILE` tohum rozetleri eklendi. `addBadge` ve `removeBadge` aksiyonları yazıldı.
- [x] **Görev 9.3: Admin Görünüm Sekmesinde Rozet Yöneticisi (`AdminView.vue`)**
  - Aktif rozetlerin anlık listesi ve tek tıkla silme (`X`) butonu.
  - 7 popüler hazır rozet şablonu (Tek tıkla ekleme).
  - Özel rozet tanımlama formu (metin, 12 ikon seçici, 6 renk seçici, canlı mini önizleme ve ekleme butonu).
- [x] **Görev 9.4: Ziyaretçi Vitrini ve iPhone 16 Pro Canlı Önizlemesi Senkronizasyonu (`ProfileView.vue`, `PhonePreview.vue`)**
  - Ziyaretçi ekranında ve telefon mockup'ında bio altına dinamik rozetler ikon ve renk stilleriyle entegre edildi; anlık reaktif güncelleme sağlandı.

---

## 📌 Faz 10: Zenginleştirilmiş Kapak Desenleri & Avatar/Profil Kişiselleştirmesi (TAMAMLANDI ✅)
- [x] **Görev 10.1: Kapak Desenlerinin İki Katına Çıkarılması (6'dan 12'ye)**
  - `BANNER_PATTERNS` 12 zengin desene genişletildi: Cyberpunk Neon, Aurora Borealis, Sunset Terracotta, Matrix Green, Luxury Sapphire, Diagonal Lines vb.
  - `frontend/src/style.css` içerisinde yeni desen sınıfları (.banner-cyberpunk, .banner-aurora, vb.) CSS gradyan ve SVG ızgara desenleriyle tanımlandı.
- [x] **Görev 10.2: Avatar Çerçeve Şekli ve Parıltı/Aura Seçici**
  - 3 avatar geometrisi: Tam Yuvarlak (`rounded-full`), Modern Squircle (`rounded-2xl`), Hafif Kavisli (`rounded-xl`).
  - 6 avatar parıltı stili: Elektrik Sarısı (#FFFF00), Neon Zümrüt, Siber Mavi, Neon Mor, Gül Pembesi, Sade Mat.
- [x] **Görev 10.3: 18 Çeşit Kategorize Hazır Avatar Galerisi**
  - `PRESET_AVATARS` 18 profesyonel görsele çıkarıldı; 'Tümü', 'Portre', '3D', 'Siber', 'Stüdyo' sekmeleriyle anlık kategori filtrelemesi eklendi.
- [x] **Görev 10.4: Doğrulanmış Profil Rozeti (Onay İkonu) Aç/Kapa**
  - Profil başlığı yanındaki onay rozetini (`CheckCircle2`) isteğe bağlı olarak açıp kapatma toggle anahtarı (`isVerified`) entegre edildi.
- [x] **Görev 10.5: Canlı Durum & Müsaitlik Bildirimi (Status Badge)**
  - Özelleştirilebilir durum metni (`statusText`) ve sinyal rengi (`statusColor`: Zümrüt, Amber, Mavi, Mor, Kapalı).
  - 1 tıkla anında doldurulan hızlı durum şablonları (`STATUS_PRESETS`).
- [x] **Görev 10.6: Canlı Telefon Mockup'ı & Ziyaretçi Ekranı Eşzamanlılığı**
  - `PhonePreview.vue` ve `ProfileView.vue` bileşenlerine reaktif avatar geometrisi, parıltı aurası, durum rozeti ve onay tiki dinamik olarak bağlandı.
- [x] **Görev 10.7: PostgreSQL Veritabanı ve REST API Senkronizasyonu**
  - `profiles` tablosuna `avatar_shape`, `avatar_glow`, `status_text`, `status_color`, `is_verified` sütunları eklendi; API uç noktaları (`/api/profile`, `/api/profile/:username`) güncellendi.

---

## 📌 Faz 11: QR Kod Okutma & Cihaz Analitiği (Mobil vs Tarayıcı) (TAMAMLANDI ✅)
- [x] **Görev 11.1: Veri Modeli ve Veritabanı Tablosu (`03_DATA_MODELS.md`, `initDb.js`)**
  - `VisitAnalytics` ve `VisitRecord` modelleri tanımlandı. PostgreSQL `visit_stats` tablosu (`device`, `source`, `user_agent`, `created_at`) kuruldu ve gerçekçi başlangıç tohum verileri eklendi.
- [x] **Görev 11.2: Backend REST API Rotaları (`analyticsRoutes.js`, `server.js`)**
  - `GET /api/analytics`: Toplam ziyaret, QR ziyaretleri, QR mobil/masaüstü kırılımı ve yüzdeleri hesaplayan uç nokta.
  - `POST /api/analytics/visit`: Yeni ziyaret ve cihaz tespiti kaydı.
  - `POST /api/analytics/simulate`: Admin panelinden test için simülasyon ziyareti.
  - `POST /api/analytics/reset`: Ziyaretçi verilerini sıfırlama rotası.
- [x] **Görev 11.3: QR Kod URL'lerine Kaynak Parametresi Eklenmesi (`ProfileView.vue`, `AdminView.vue`)**
  - QR kod üretilirken URL sonuna otomatik olarak `?src=qr` parametresi eklendi.
- [x] **Görev 11.4: Ziyaretçi Sayfasında Cihaz Algılama ve Takip (`ProfileView.vue`)**
  - Sayfa yüklendiğinde `navigator.userAgent` ve ekran genişliği ile mobil/masaüstü tespiti; `route.query.src === 'qr'` ile kaynak kontrolü yapılıp arka plana `trackVisit` bildirimi gönderilmesi.
- [x] **Görev 11.5: Pinia Store Durumu & Dayanıklılık (`linkStore.js`)**
  - `analytics` reaktif durumu, `loadStoredData`, `DEFAULT_ANALYTICS`, LocalStorage kalıcılığı ve `fetchAnalytics`, `trackVisit`, `simulateVisit`, `resetAnalytics` aksiyonları yazıldı.
- [x] **Görev 11.6: Yönetim Paneli İstatistikler Sekmesi Dönüşümü (`AdminView.vue`)**
  - QR Kod Tarama & Cihaz Analitiği paneli: 4'lü CRM özet kartları, Mobil vs Masaüstü Tarayıcı karşılaştırma kartları, erişim kanalı segment çubuğu ve canlı test simülatörü butonları eklendi.## 📌 Faz 12: Sosyal Medya İkon Barı & Buton Şekil/Görünürlük Özelleştirmesi (TAMAMLANDI ✅)
- [x] **Görev 12.1: Veri Modeli ve Store Genişletmesi (`03_DATA_MODELS.md`, `linkStore.js`)**
  - `Profile.socialLinks` modeline `barVisible`, `shape`, `style` ve `githubActive`, `linkedinActive`, `instagramActive`, `twitterActive`, `youtubeActive`, `emailActive` flag'leri eklendi.
  - `SOCIAL_PLATFORMS`, `SOCIAL_SHAPES` (`rounded-full`, `rounded-xl`, `rounded-lg`) ve `SOCIAL_STYLES` (`glass`, `neon`, `solid`) sabitleri tanımlandı ve dışa aktarıldı.
- [x] **Görev 12.2: Admin Paneli İkon Kontrol Merkezi (`AdminView.vue`)**
  - Section 2 "Sosyal Medya İkonları Barı" yeniden tasarlandı:
    - Genel bar görünürlük anahtarı (`barVisible` iOS switch).
    - İkon şekli seçicisi (Tam Yuvarlak, Yumuşak Kare, Kompakt Köşeli).
    - İkon stili seçicisi (Buzlu Cam / Glass, Neon Sarı / Glow, Sade Koyu / Solid).
    - Her sosyal platform (GitHub, Instagram, LinkedIn, Twitter/X, YouTube, E-Posta) için ayrı ayrı aktif/gizli switch kartları.
    - URL değerlerinin buton gizlendiğinde silinmemesini garanti eden güvenli state yönetimi.
    - Canlı telefon önizlemesine form değişikliklerinin anında yansıması için `watch(profileForm.value.socialLinks)` derin watcher'ı.
- [x] **Görev 12.3: Ziyaretçi Ekranı ve Canlı iPhone 16 Pro Önizlemesi (`ProfileView.vue`, `PhonePreview.vue`)**
  - `activeSocialLinks` filtresine `barVisible !== false` ve per-platform aktiflik (`platform.activeKey !== false`) kontrolleri entegre edildi.
  - Dinamik şekil (`socialShapeClass`) ve stil (`socialStyleClass`) sınıfları dock konteynerına ve butonlara uygulandı.
- [x] **Görev 12.4: PostgreSQL ve Geriye Dönük Uyumluluk**
  - `socialLinks JSONB` sütunu üzerinden yeni konfigürasyon alanları sıfır migration ihtiyacıyla kalıcılaştırıldı.
  - Eski profiller için `!== false` kontrolleriyle %100 kesintisiz geriye dönük uyumluluk sağlandı.

---

## 📌 Faz 13 (Orijinal Faz 5): Test, İnce Ayar ve Sunum Hazırlığı (TAMAMLANDI ✅)
> **Hedef**: Staj raporunda ve mentor sunumunda öne çıkacak uç senaryoları, güvenlik kontrollerini ve dokümantasyonları tamamlamak.

- [x] **Görev 13.1: Uç Senaryo Kontrolleri**
  - **Olmayan bir `username` girildiğinde 404 sayfası gösterme**: `ProfileView.vue` üzerinde iki temayı destekleyen, `UserX` ikonu, dinamik sayfa başlığı (`document.title = '404 - Profil Bulunamadı | linkspace'`), "Ana Sayfaya Dön" ve "Giriş Yap / Kayıt Ol" yönlendirmeleri sunan modern 404 sayfası kodlandı.
  - **Hatalı veya güvensiz URL girişlerini engelleme (Regex doğrulaması)**:
    - `backend/src/routes/linksRoutes.js` içinde `isValidUrl` yardımcı fonksiyonu ile `javascript:`, `data:`, `vbscript:`, `file:` gibi tehlikeli XSS protokolleri kesinlikle engellendi; geçersiz linklerde HTTP `400 Bad Request` yanıtı döndürüldü.
    - `frontend/src/views/AdminView.vue` yeni link ve düzenleme modallarına anlık regex doğrulaması, kırmızı kenarlık ve `AlertCircle` hata bildirimleri entegre edildi.
- [x] **Görev 13.2: Raporlama ve Analitik Gösterimi**
  - **Yönetim paneline her linkin toplam kaç kez tıklandığını gösteren küçük sayaç rozeti**:
    - Her bağlantı kartına Linktree tarzı, tıklama sayısını (`MousePointerClick`) ve tüm tıklamalar içerisindeki tıklanma payını (`% CTR`) gösteren şık bir sayaç rozeti eklendi.
- [x] **Görev 13.3: Dokümantasyon (Staj Raporu ve Mentor Sunumu)**
  - **Veritabanı ER şemasını çıkarma**: `docs/DATABASE_ER_DIAGRAM.md` dosyasında `users`, `profiles`, `links`, `settings`, `visit_stats` tablolarının Mermaid görsel ER diyagramı, ilişkileri, veri tipleri, kısıtları ve dizinleme detayları hazırlandı.
  - **API uç noktalarını Postman/Swagger formatında hazırlama**:
    - `docs/swagger.json`: OpenAPI 3.0.3 formatında tüm Auth, Profile, Links, Settings ve Analytics uç noktaları, JWT Bearer şeması ve request/response modelleri çıkarıldı.
    - `docs/postman_collection.json`: Postman v2.1.0 formatında, değişkenleri (`{{baseUrl}}`, `{{token}}`) ve otomatik JWT test script'i hazır import edilebilir koleksiyon dosyası oluşturuldu.
    - `backend/src/server.js`: `/api/docs` üzerinden tarayıcıda canlı açılan modern Swagger UI arayüzü ve `/api/docs/swagger.json`, `/api/docs/postman.json` indirme rotaları eklendi.

---

## 📌 Faz 14: Ziyaretçi Profil Teması Seçici & Beyaz Tema Kapsül Buton Tasarımı (TAMAMLANDI ✅)
> **Hedef**: Ziyaretçilerin profil sayfasından temaları serbestçe değiştirebilmesi ve beyaz temada elektrik sarısı kapsül (pill) buton stilinin tüm arayüze uygulanması.

- [x] **Görev 14.1: Ziyaretçi Profil Teması Seçici Modalı (`ProfileView.vue`)**
  - Üst başlıkta "Tema" (`Palette`) butonu eklendi; modal içerisinden 6 tema canlı önizleme gradyanlarıyla sunuldu.
- [x] **Görev 14.2: Admin Paneli Ziyaretçi Temaları Buton Etkileşimi (`AdminView.vue`)**
  - "3. Ziyaretçi Profil Teması" altındaki temaların butonları aktifleştirildi (`@click.stop="handleSelectTheme(theme)"`); tıklandığında anında backend ve Pinia'ya kaydedilip telefon önizlemesine aktarılıyor.
- [x] **Görev 14.3: Açık / Beyaz Temada Elektrik Sarı Kapsül (Pill) Buton Tasarımı (`ProfileView.vue`, `PhonePreview.vue`, `linkStore.js`, `AdminView.vue`)**
  - Kullanıcı görselindeki `Çıkış Yap` yalın metin + `Paylaş` sarı kapsül buton stilini temel alarak:
    - Linktree bağlantı butonları beyaz temada tam yuvarlak kapsül (`rounded-full`), elektrik sarısı (`#FFFF00`) zemin, siyah metin ve siyah ikon dairesiyle tasarlandı.
    - Ziyaretçi üst başlığında `Yönetici` linki gri yalın metin, `Paylaş` butonu elektrik sarısı kapsül yapıldı.
    - Sağ alttaki yüzen QR butonu beyaz temada elektrik sarısı kapsül stiline uyarlandı.
    - Admin paneli üst sekme çubuğunda (`adminTheme === 'light'`) aktif sekme elektrik sarısı kapsül stilini devraldı.
    - Canlı telefon önizlemesi (`PhonePreview.vue`) beyaz temada aynı sarı kapsül ve siyah ikon dairelerini birebir gösterecek şekilde güncellendi.
- [x] **Görev 14.4: Açık/Beyaz Modda Soluk Sarı Metin ve Seçenek Butonlarının Yüksek Kontrasta Kavuşturulması (`AdminView.vue`)**
  - Görünüm sekmesindeki **Avatar Çerçeve Şekli** ("Tam Yuvarlak") ve **Avatar Parıltı Rengi** ("Elektrik") aktif butonları beyaz modda soluk neon sarı metin yerine **elektrik sarısı zemin üzerinde kalın siyah metin ve siyah şekil konturlarına (`border-yellow-400 bg-[#FFFF00] text-black font-extrabold shadow-sm`)** dönüştürüldü.
  - Hazır Kapak Desenleri, Durum Şablonları, Yetenek Rozetleri, Sosyal İkon Şekli/Stili, Ziyaretçi Teması "Aktif:" ve "Seçili" etiketleri ile Bağlantı Düzenleme/Ekleme modallarındaki soluk sarı metinler okunaklı siyah veya koyu amber tonlarına uyarlandı.

---

## 📌 Faz 15: İletişim & Mesaj Bırakma Formu (Lead Capture / CRM Inbox) (TAMAMLANDI ✅)
> **Hedef**: Ziyaretçilerin profil sayfasından doğrudan ad, e-posta ve mesaj bırakabilmesi; yöneticinin bu mesajları CRM gelen kutusunda yönetebilmesi.

- [x] **Görev 15.1: Veritabanı ve Migration Kurulumu (`backend/src/initDb.js`)**
  - `messages` tablosu (`id`, `name`, `email`, `message`, `is_read`, `created_at`) oluşturuldu.
  - Test ve demo için 2 adet gerçekçi başlangıç tohum mesajı eklendi.
- [x] **Görev 15.2: Backend REST API ve Esnek Çevrimdışı Bellek Deposu (`backend/src/routes/messagesRoutes.js` & `server.js`)**
  - `POST /api/messages`: Ziyaretçiler için açık lead toplama uç noktası (regex e-posta ve karakter uzunluk validasyonlu).
  - `GET /api/messages`: Admin korumalı mesaj listesi ve okunmamış mesaj sayısı.
  - `PATCH /api/messages/:id/read`: Okundu / okunmadı durum toggle'ı.
  - `DELETE /api/messages/:id`: Mesaj silme uç noktası.
  - `POST /api/messages/simulate`: Tek tıkla demo mesaj üreten simülasyon servisi.
  - PostgreSQL servisi çevrimdışıyken bile sistemin çökmesini engelleyen %100 dayanıklı bellek içi fallback (`mockMessages`) mekanizması kuruldu.
- [x] **Görev 15.3: Pinia Durum Yönetimi & LocalStorage Senkronizasyonu (`frontend/src/stores/linkStore.js`)**
  - `messages` reaktif dizisi, `unreadMessagesCount` computed özelliği.
  - `fetchMessages`, `sendMessage`, `markMessageAsRead`, `deleteMessage`, `simulateMessage` store aksiyonları.
  - LocalStorage senkronizasyonu ve derin izleyici (deep watcher).
- [x] **Görev 15.4: Ziyaretçi İletişim Arayüzü (`ProfileView.vue` & `PhonePreview.vue`)**
  - Üst barda zarif "İletişim" hap butonu.
  - Bağlantı listesinin hemen altında dikkat çekici interaktif "Bana Mesaj Bırakın" vitrin kartı.
  - Canlı validasyonlu, animasyonlu gönderim butonlu ve kutlama başarı ekranlı `<Teleport>` Contact Modalı.
  - Saf açık mod (`pure-light`) ve koyu mod için eksiksiz yüksek kontrast stil uyumu.
  - `PhonePreview.vue` canlı telefon maketine minyatür iletişim kartı entegrasyonu.
- [x] **Görev 15.5: Yönetim Paneli CRM Gelen Kutusu (`AdminView.vue`)**
  - Üst ve mobil sekme barına dinamik okunmamış bildirim rozetli "Mesajlar" sekmesi.
  - 3'lü özet metrik kartları: Toplam Mesaj, Okunmamış Mesajlar, İncelenme Oranı.
  - Filtreleme çipleri: Tümü, Okunmamış, Okunmuş.
  - Gelen kutusu mesaj kartları: Gönderen avatar/baş harf rozeti, yeni etiketi, e-posta adresi, tarih, tek tıkla `mailto:` yanıtlama, okundu durumu toggle butonu ve silme aksiyonu.
  - Canlı demo sunumları için "Örnek Mesaj Simüle Et" hızlı aksiyon butonu.

---

## 📌 Faz 16: Özel Domain & Sosyal Paylaşım Önizleme Hub'ı (OpenGraph & SEO) (TAMAMLANDI ✅)
> **Hedef**: Sosyal platformlarda (WhatsApp, Twitter/X, LinkedIn, Telegram) link paylaşıldığında kart tasarımının canlı simüle edilmesi, meta etiketlerinin yönetimi ve özel alan adı (Custom Domain) DNS rehberliği.

- [x] **Görev 16.1: Backend REST API & DNS Doğrulama Servisi (`backend/src/routes/settingsRoutes.js`)**
  - `GET /api/settings/seo`: Açık uç nokta, SEO ve sosyal kart konfigürasyonunu döner.
  - `PUT /api/settings/seo`: Yönetici korumalı, `settings` tablosunda `seo` anahtarıyla kalıcılaştırma sağlar.
  - `POST /api/settings/verify-domain`: Özel alan adı regex kontrolü, DNS CNAME/A-kayıt simülasyonu ve SSL aktivasyon yanıtı.
  - Kesintisiz çevrimdışı bellek içi fallback (`mockSettings.seo`) desteği.
- [x] **Görev 16.2: Pinia Store Durum Yönetimi (`frontend/src/stores/linkStore.js`)**
  - `DEFAULT_SEO` şablonu, `STORAGE_KEYS.SEO`, reaktif `seoSettings` durumu.
  - `updateSeoSettings` ve `verifyCustomDomain` store aksiyonları, LocalStorage senkronizasyonu.
- [x] **Görev 16.3: Yönetim Paneli Canlı Sosyal Kart Simülatörü (`AdminView.vue`)**
  - **4 Platformlu Kart Önizleyici**:
    - **WhatsApp**: Koyu/açık sohbet balonu, thumbnail, kalın başlık, açıklama ve domain etiketi.
    - **Twitter / X**: 16:9 geniş banner kapaklı Summary Large Image kartı.
    - **LinkedIn**: Profesyonel feed bağlantı kartı, gönderen profili, başlık ve domain.
    - **Telegram**: Telegram mesaj balonu, dikey şerit ve büyük görsel.
  - **Meta Tag Formu**: `og:title` (60 karakter sayacı), `og:description` (160 karakter sayacı), `og:image` URL girişi ve tek tıkla hazır görsel şablonları (Profil Avatarı, Kapak Resmi, Kod & Teknoloji).
  - **Özel Alan Adı (Custom Domain) & DNS Rehberi**:
    - Özel alan adı girişi (`tubagul.dev`), anlık "DNS Doğrula" butonu, yeşil SSL aktif onay rozeti.
    - Cloudflare / GoDaddy / Namecheap için CNAME ve A-Record hedef değerlerini tek tıkla kopyalama paneli.
- [x] **Görev 16.4: Ziyaretçi Ekranı & Dinamik Head Senkronizasyonu (`ProfileView.vue`)**
  - `syncSeoMetaTags`: `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` etiketleri sayfa açılışında anında dinamik olarak `<head>` içerisine işlenir.
  - Paylaşım Modalı içine doğrulanmış özel alan adı varsa doğrudan `https://tubagul.dev/` olarak paylaşma butonu entegre edildi.

---

## 📌 Faz 17: Zaman Ayarlı / Süresi Dolan Bağlantılar & Canlı Geri Sayım (TAMAMLANDI ✅)
> **Hedef**: Belirli bir başlangıç/bitiş tarihine sahip bağlantıların zamanlanması, süresi dolanların ziyaretçilere otomatik gizlenmesi, admin ve ziyaretçi kartlarında canlı geri sayım (countdown) rozetleri.

- [x] **Görev 17.1: PostgreSQL Migration & REST API Desteği (`backend/src/initDb.js`, `linksRoutes.js`, `profileRoutes.js`)**
  - `links` tablosuna `is_scheduled` (BOOLEAN), `schedule_start` (TIMESTAMP), `schedule_end` (TIMESTAMP) ve `show_countdown` (BOOLEAN) sütunları eklendi.
  - `GET /api/links`, `POST /api/links` ve `PUT /api/links/:id` rotalarında bu alanlar işlendi ve döndürüldü.
  - `GET /api/profile/:username` ziyaretçi rotasında `(is_scheduled = false OR schedule_end IS NULL OR schedule_end >= CURRENT_TIMESTAMP)` filtresi ile süresi dolmuş linkler veritabanı seviyesinde elendi.
- [x] **Görev 17.2: Reaktif Durum Yönetimi & Zamanlama Motoru (`frontend/src/stores/linkStore.js`)**
  - `getScheduleStatus(link)` hesaplayıcısı: Zaman damgasına göre `upcoming` (gelecekte başlayacak), `active` (yayında & geri sayım devam ediyor) ve `expired` (süresi doldu) durumlarını tespit eder; dinamik rozet metinlerini (`⏳ 1g 14s kaldı`, `🗓️ 3 gün sonra yayında`, `⌛ Süresi Doldu`) üretir.
  - `formatForDatetimeInput`: Date/ISO string'lerini `<input type="datetime-local">` formatına (`YYYY-MM-DDTHH:mm`) çeviren yardımcı.
  - `DEFAULT_LINKS` içine canlı geri sayım örneği (`🔥 Frontend & AI Workshop`) entegre edildi.
- [x] **Görev 17.3: Yönetim Paneli Zamanlama Arayüzü (`AdminView.vue`)**
  - Yeni Link Ekleme formu ve Bağlantı Düzenleme modalında "Zaman Ayarlı & Süresi Dolan Bağlantı" açılır-kapanır bloğu.
  - **Hızlı Süre Önayarları (Presets)**: `+24 Saat (1 Gün)`, `+3 Gün`, `+1 Hafta` butonları tek tıkla bitiş tarihini hesaplar.
  - `datetime-local` başlangıç ve bitiş seçicileri.
  - "Ziyaretçi Kartında Canlı Geri Sayım Göster (⏳ Kalan Süre)" checkbox'ı.
  - Bağlantı listesi kartlarında canlı rozetler: Sarı `⏳ Son 1g 14s`, mavi `🗓️ Yakında` veya kırmızı `⌛ Süresi Doldu`.
- [x] **Görev 17.4: Ziyaretçi Ekranı & Mobil Önizleme Senkronizasyonu (`ProfileView.vue`, `PhonePreview.vue`)**
  - `activeLinks` filtresinde süresi dolmuş linkler otomatik olarak filtrelendi.
  - Bağlantı kartlarında başlığın yanında zarif kapsül geri sayım rozeti: Siyah/sarı şık kontrastlı pill tasarımı (beyaz temada siyah kapsül sarı metin, koyu temalarda amber/cyan pulsate eden parlama).
  - Canlı telefon maketinde (`PhonePreview.vue`) anında yansıyan zamanlama etiketleri.

---

## 📌 Faz 18: Biyografi Yazısı İçin Yapay Zeka Metin Üretici (AI Bio Assistant) (TAMAMLANDI ✅)
> **Hedef**: Kullanıcının unvanına, uzmanlık alanlarına/anahtar kelimelerine ve seçilen ses tonuna göre 160 karakter sınırına tam uyumlu, etkileyici biyografi alternatifleri üreten, tek tıkla kopyalama ve profile uygulama imkânı sunan akıllı AI asistanı.

- [x] **Görev 18.1: Backend REST API & Metin Üretim Motoru (`backend/src/routes/aiRoutes.js`, `server.js`)**
  - `GET /api/ai/tones`: 4 ses tonunu (Kurumsal & Profesyonel, Samimi & Girişimci, Minimalist & Siberpunk, Yaratıcı & Meraklı) döner.
  - `POST /api/ai/generate-bio`: Rol, yetenek dizisi ve hedef tonu alarak kural tabanlı + bağlamsal şablon motoruyla anlık 6-8 alternatif bio üretir; 160 karaktere sığacak şekilde optimize eder.
  - PostgreSQL veya harici LLM servisleri çevrimdışı olsa bile %100 kesintisiz çalışan offline-resilient fallback mimarisi.
- [x] **Görev 18.2: Pinia Store Entegrasyonu & Çevrimdışı Üretim Motoru (`frontend/src/stores/linkStore.js`)**
  - `AI_TONES`, `SUGGESTED_ROLES`, `SUGGESTED_SKILLS` sabitleri ve `generateBiosContextually` algoritması.
  - `generateBios(payload)` store aksiyonu: API'ye istek atar, ağ hatasında anında yerel algoritmayı çalıştırarak kusursuz UX sağlar.
- [x] **Görev 18.3: Yönetim Paneli AI Asistan Modalı & Etkileşim Arayüzü (`frontend/src/views/AdminView.vue`)**
  - Görünüm & Tema sekmesinde Biyografi kutusunun hemen yanında `✨ AI ile Biyografi Yaz` sihirli butonu.
  - Açılır modal:
    - **Hızlı Rol Çipleri**: Tek tıkla "Full-Stack Developer", "Frontend Architect", "Yazılım Mühendisliği Öğrencisi", "UI/UX & Product Designer" seçimi ve serbest metin girişi.
    - **Yetenek & Anahtar Kelime Seçici**: 12 popüler teknoloji çipi (Vue 3, React, Node.js, Python, TypeScript, Tailwind CSS, PostgreSQL, AI & LLMs, Docker vb.) çoklu seçim toggle'ları.
    - **Ses Tonu Seçici**: 4 stil kartı (💼 Profesyonel, 🚀 Samimi, ⚡ Minimalist, 🎨 Yaratıcı) ve ✨ Tümü seçeneği.
    - **Biyografi Öneri Kartları**: Her kartta dinamik karakter sayacı (`112 / 160`), ton rozeti, anahtar kelime etiketleri, tek tıkla panoya kopyalama ve yeşil onaylı "Profile Uygula" butonu.
- [x] **Görev 18.4: Canlı Profil ve Telefon Mockup Senkronizasyonu (`PhonePreview.vue`)**
  - Seçilen bio doğrudan `profileForm.value.bio` alanına aktarılır, `linkStore.updateProfile()` çağrılır, anlık toast uyarısı verilir ve sağdaki iPhone 16 Pro ekranına anında yansır.

---

## 📌 Faz 19: Bağlantı Kategorileri & Akordeon Link Klasörleri (TAMAMLANDI ✅)
> **Hedef**: Çok sayıda bağlantısı olan kullanıcılar için linkleri klasörlere ayırma (Örn: "🚀 Projeler & Kod", "💼 Sosyal Medya & İletişim", "🌐 Web & Portfolyo", "📚 Kaynaklar & Yayınlar"), akordeon açılır/kapanır kart desteği, arama motoru ile entegre otomatik açılma ve yönetim panelinde kategori bazlı filtreleme.

- [x] **Görev 19.1: Veritabanı ve REST API Katmanı (`backend/src/initDb.js`, `linksRoutes.js`, `profileRoutes.js`)**
  - PostgreSQL `links` tablosuna `category VARCHAR(100) DEFAULT ''` sütunu eklendi (`ALTER TABLE links ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '';`).
  - `GET /api/links`, `POST /api/links` ve `PUT /api/links/:id` rotalarında `category` alanı seçildi, doğrulandı ve güncellendi.
  - Ziyaretçi rotası `GET /api/profile/:username` için `COALESCE(category, '') AS "category"` sorgusu entegre edildi.
- [x] **Görev 19.2: Pinia Store Durumu & Kategori Hesaplayıcıları (`frontend/src/stores/linkStore.js`)**
  - `DEFAULT_CATEGORIES` (6 hazır kategori), `DEFAULT_LINKS` kategori eşlemeleri eklendi.
  - `allCategories` ve `usedCategories` computed özellikleri tanımlanıp dışa aktarıldı.
  - `loadStoredData`, `fetchFromApi`, `fetchPublicProfile` ve `addLink` fonksiyonları kategori desteğiyle senkronize edildi.
- [x] **Görev 19.3: Yönetim Paneli Kategori Seçimi & Filtreleme Barı (`AdminView.vue`)**
  - Yeni Link Ekleme formu ve Bağlantı Düzenleme modalında:
    - 6 adet tek tıkla seçilebilir hızlı kategori çipi (`FolderPlus`).
    - Serbest metin kategori/klasör girişi (`datalist` önerili).
  - Bağlantı listesi üstünde dinamik Kategori Filtre Barı ("Tümü", aktif kategoriler ve adet sayıları, "Bağımsız Linkler").
  - Bağlantı kartlarında sarı/gri klasör etiketi (`Folder` ikonu + kategori adı).
- [x] **Görev 19.4: Ziyaretçi Ekranında Akordeon Klasör Grupları (`ProfileView.vue`)**
  - `groupedFilteredItems` hesaplayıcısı ile kategorili bağlantılar klasör kartları altına, bağımsız bağlantılar kök seviyeye ayrıldı.
  - Yumuşak CSS animasyonlu akordeon açılır/kapanır kartlar, klasör içi link sayacı hapı, dönen ok ikonu (`ChevronDown`) ve sol kesikli rehber çizgisi.
  - Canlı arama yapıldığında eşleşen klasörlerin otomatik olarak açık gelmesi (`isFolderOpen`).
  - Açık tema (Pure-Light) ve koyu tema için yüksek kontrastlı kapsül ve neon detaylar.
- [x] **Görev 19.5: Canlı Telefon Mockup'ı Senkronizasyonu (`PhonePreview.vue`)**
  - iPhone 16 Pro mockup'ına tam uyumlu mini akordeon klasör kartları entegre edildi.
  - Klasör açma/kapama durumları telefon önizlemesinde interaktif olarak test edilebilir hale getirildi.

---

## 📌 Faz 20: Zengin Link Türleri (Smart / Rich Links) (TAMAMLANDI ✅)
> **Hedef**: Düz URL butonları yerine içerik türünü otomatik algılayan akıllı kartlar: Spotify, YouTube ve SoundCloud mini oynatıcı (Iframe Player) embed desteği; 4 haneli PIN şifresi (`lockType: 'pin'`) veya 18+ yaş onayı (`lockType: 'age'`) isteyen kilitli/hassas bağlantılar.

- [x] **Görev 20.1: Veritabanı ve REST API Katmanı (`backend/src/initDb.js`, `linksRoutes.js`, `profileRoutes.js`)**
  - PostgreSQL `links` tablosuna `embed_type`, `show_embed`, `is_locked`, `lock_type`, `passcode`, `lock_warning` sütunları eklendi.
  - `GET /api/links`, `POST /api/links`, `PUT /api/links/:id` ve `GET /api/profile/:username` rotalarında yeni alanlar seçildi ve güncellendi.
- [x] **Görev 20.2: Pinia Store Embed Algılama ve Otomatik Çözümleme (`linkStore.js`)**
  - `detectEmbed(url)` ve `getEmbedUrl(link)` yardımcı fonksiyonları geliştirildi (YouTube shorts/watch/youtu.be, Spotify track/album/playlist/episode, SoundCloud iframe widget desteği).
  - `DEFAULT_LINKS` listesine Spotify Lo-Fi ve 1234 PIN kilitli VIP bağlantı örnekleri eklendi.
- [x] **Görev 20.3: Yönetim Paneli Embed ve Kilit Yapılandırması (`AdminView.vue`)**
  - URL yazıldığında otomatik algılanan embed banner'ı ve tek tıkla oynatıcı açma toggle'ı.
  - Kilitli bağlantı ayar bloğu: PIN veya 18+ koruma modu, 4 haneli şifre girişi ve özel uyarı metni.
  - Bağlantı listesinde `Play` (YouTube, Spotify, SoundCloud) ve `Lock` (PIN / 18+) rozetleri.
- [x] **Görev 20.4: Ziyaretçi Ekranında İnteraktif Oynatıcı & Kilit Açma Modalı (`ProfileView.vue`)**
  - Kilitli bağlantılara tıklandığında açılan yüksek kontrastlı Pure-Light & Dark uyumlu Kilit Açma Modalı (`Teleport to="body"`).
  - PIN doğrulandığında veya 18+ onaylandığında oturum süresince kilit açılır ve bağlantı açılır / embed genişletilir.
  - Akordeon tarzı açılır mini embed kartı: YouTube (aspect-video), Spotify (152px), SoundCloud (166px), "Orijinal Platformda Aç ↗" butonu ve kapatma butonu.
- [x] **Görev 20.5: Canlı Telefon Mockup'ı Senkronizasyonu (`PhonePreview.vue`)**
  - iPhone 16 Pro mockup ekranında kilit rozetleri, interaktif PIN/18+ modalı ve canlı mini iframe oynatıcı desteği.

---

## 📌 Faz 21: Kurumsal Güvenlik Kalkanı, Rate Limiting & ETag/TTL Önbellek Mimarisi (TAMAMLANDI ✅)
> **Hedef**: Express REST API üzerinde brute-force, DDoS ve spam saldırılarına karşı akıllı rate limiting; HTTP güvenlik başlıkları (HSTS, No-Sniff, Clickjacking koruması); sık okunan public uç noktalar (`/profile`, `/theme`, `/seo`) için 60 saniyelik ETag ve conditional HTTP 304 önbellek mekanizması ve Admin Ayarlar sekmesinde canlı önbellek yönetim paneli.

- [x] **Görev 21.1: Hafif Bellek İçi Kayan Pencere Rate Limiter'ı (`backend/src/middleware/rateLimiter.js`)**
  - Sıfır dış bağımlılıkla çalışan bellek içi `InMemoryRateLimiter` sınıfı kodlandı.
  - 4 farklı limit profili tanımlandı:
    - `globalLimiter`: Genel API koruması (15 dakikada 300 istek).
    - `authLimiter`: Giriş/Kayıt brute-force engelleme (15 dakikada 10 deneme).
    - `aiLimiter`: Biyografi bot suistimal koruması (1 dakikada 5 istek).
    - `messagesLimiter`: İletişim mesaj kutusu spam koruması (1 saatte 5 mesaj).
- [x] **Görev 21.2: HTTP Güvenlik Sertleştirmeleri (`backend/src/middleware/securityHeaders.js`)**
  - X-Content-Type-Options: `nosniff`, X-Frame-Options: `SAMEORIGIN`, X-XSS-Protection, Strict-Transport-Security (HSTS - 1 yıl), Referrer-Policy ve X-Powered-By gizleme middleware'i devreye alındı.
- [x] **Görev 21.3: ETag & TTL Tabanlı In-Memory Önbellek Servisi (`backend/src/middleware/cacheService.js`)**
  - `GET /api/profile`, `/api/profile/:username`, `/api/settings/theme`, `/api/settings/seo` için 60 saniye TTL önbellekleme.
  - Tarayıcı `If-None-Match` başlığı gönderdiğinde gereksiz veri transferini engelleyen `304 Not Modified` yanıtı.
  - Link veya profil güncellendiğinde (`POST/PUT/DELETE /api/links`, `PUT /api/profile`, `PUT /api/settings/seo`) önbelleği otomatik tazeleyen `invalidateCache` mekanizması.
- [x] **Görev 21.4: Önbellek Yönetim API Uç Noktaları (`backend/src/routes/settingsRoutes.js`)**
  - `GET /api/settings/cache/stats`: RAM önbellek metrikleri (isabet oranı %, hit/miss sayıları, aktif anahtarlar ve kalan TTL süreleri).
  - `POST /api/settings/cache/clear`: Tek tıkla tüm önbelleği temizleme rotası (yalnızca yetkili yönetici).
- [x] **Görev 21.5: Pinia Store ve Admin Arayüzü Entegrasyonu (`linkStore.js` & `AdminView.vue`)**
  - `cacheStats`, `fetchCacheStats` ve `clearServerCache` aksiyonları eklendi.
  - Admin Ayarlar sekmesine Dribbble Sales CRM (#0C0C0B / #161616 / #FFFF00) uyumlu "Güvenlik Kalkanı & Performans Önbelleği" paneli eklendi:
    - Canlı metrik kartları (Hit Rate %, RAM'den yanıtlanan istekler, taze sorgular, aktif TTL anahtarları).
    - Tek tıkla metrikleri yenileme ve önbellek temizleme butonları.

---

## 📌 Faz 22: PWA, Akıllı Link Ağacı, A/B Split Testing & Veri Taşınabilirliği (TAMAMLANDI ✅)
- [x] **Görev 22.1: PWA Desteği**: `manifest.json`, `sw.js` ve `PwaInstallPrompt.vue` ile masaüstü ve mobil ana ekrana ekleme.
- [x] **Görev 22.2: Akıllı Link Ağacı & Bölüm Ayraçları**: `isHeader` bölüm başlıkları ve akordeon/klasörleme modları.
- [x] **Görev 22.3: A/B Testi Altyapısı**: Bağlantı başlık ve URL varyant split testi, %50/%50 gösterim ve kazanan varyant analizi.
- [x] **Görev 22.4: Profil Dışa/İçe Aktarma**: JSON/CSV yedek dışa aktarma ve JSON yedekten geri yükleme.
- [x] **Görev 22.5: vCard (.vcf) "Kişilerime Kaydet" Entegrasyonu**: Tek tıkla telefona rehber kişisi olarak kaydetme.

---

## 📌 Faz 23: Etkileşimli 3D / WebGL Profil Deneyimi & Yaylanma Fiziği (TAMAMLANDI ✅)
- [x] **Görev 23.1: Prosedürel 3D Siber Maskot (`ThreeAvatarMascot.vue`)**:
  - Three.js tabanlı, harici ağ indirmesi gerektirmeyen düşük poligonlu siber karakter.
  - Yumuşak imleç ve dokunmatik takip lerp yönelimi (`yaw` / `pitch`), sinüzoidal havada süzülme animasyonu.
  - Tıklama ile 360° spin, yaylanmalı zıplama ve neşeli tepki rozeti.
  - Ziyaretçi için 2D/3D geçiş butonu (`⚡ 3D Maskot` / `👤 2D Foto`).
- [x] **Görev 23.2: WebGL 3D Parçacık Arka Planı (`ThreeBackground.vue`)**:
  - 320 süzülen neon parçacık, takımyıldızı bağlantı çizgileri ve fare/dokunmatik paralaks derinliği.
  - `document.hidden` olayında otomatik duraklatma ile pil ve GPU koruması.
- [x] **Görev 23.3: Sekme & Yaylanma Fiziği (Spring Physics Micro-Interactions)**:
  - Buton ve link kartlarında dokunsal yaylanma ve sekme mikro-mekanikleri (`active:scale-[0.96] active:duration-100 ease-[cubic-bezier(0.34,1.56,0.64,1)]`).
- [x] **Görev 23.4: Yönetici Paneli Görünüm Kontrolleri (`AdminView.vue`)**:
  - 3D parçacık arka planı açma/kapama, avatar sunum modu seçimi (Dönüştürülebilir / Daima 3D / Daima 2D) ve sekme fiziği toggle switch'leri.

---

## 📌 Sıradaki Aday Fazlar (Gelecek Yol Haritası)
- **Faz 24**: Çoklu Profil / Sayfa Yönetimi (Multi-Tenant Profile Switching).
- **Faz 25**: Canlı Entegrasyonlar ve Webhook'lar (Discord / Telegram / Slack anlık bildirimleri).




