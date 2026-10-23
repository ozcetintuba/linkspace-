# 🛡️ 06 - KODA MÜDAHALE VE GELİŞTİRME PROTOKOLÜ (INTERVENTION PROTOCOL)

> **ZORUNLU KURAL**: Bu projeye yapılacak her türlü kod müdahalesinde (hata düzeltme, refactoring, yeni özellik ekleme) bu protokol adım adım uygulanmak zorundadır.

---

## 🚦 AŞAMA 1: Müdahale Öncesi Kontrol (Pre-Intervention)

Projeye dokunmadan önce şu 4 adımı tamamlayın:

1. **Vault Haritasını İnceleyin**:
   - [`00_INDEX.md`](file:///c:/Users/ozcet/linktree-projem/.vault/00_INDEX.md) ve [`02_CURRENT_STATE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/02_CURRENT_STATE.md) dosyalarını okuyarak güncel durumu ve mevcut teknik borçları teyit edin.
2. **Veri Modeli Uyumu Kontrolü**:
   - Yapılacak değişiklik veri yapısını etkiliyorsa [`03_DATA_MODELS.md`](file:///c:/Users/ozcet/linktree-projem/.vault/03_DATA_MODELS.md) şemasına uygun olduğunu kontrol edin. Yeni bir alan ekleniyorsa önce modelde tanımlayın.
3. **Mimari ve Kodlama Standartları Kontrolü**:
   - Değişikliğin [`01_ARCHITECTURE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/01_ARCHITECTURE.md) ve [`04_CODING_STANDARDS.md`](file:///c:/Users/ozcet/linktree-projem/.vault/04_CODING_STANDARDS.md) kurallarına (Composition API, `<script setup>`, Pinia aksiyonları, Tailwind prensipleri) uyduğunu doğrulayın.
4. **Etki Alanı Analizi (Impact Analysis)**:
   - Değiştirilecek dosyanın diğer bileşenlerle bağlantısını (özellikle `linkStore`, `router` ve görünüm bağımlılıklarını) analiz edin.

---

## 🛠️ AŞAMA 2: Kod Müdahalesi (Implementation)

1. **Tek Sorumluluk**:
   - Yalnızca hedeflenen göreve odaklanın. İlgisiz dosyalarda rastgele değişiklikler yapmayın.
2. **Merkezi Durum Yönetimi**:
   - Asla bileşenler içinde bağımsız yerel mock veriler üretmeyin; her zaman `linkStore` üzerinden işlem yapın.
3. **Temiz Kod ve Güvenlik**:
   - XSS açıklarına yol açacak `v-html` kullanımından kaçının. Dış bağlantılarda güvenlik özniteliklerini (`rel="noopener noreferrer"`) koruyun.
4. **Çalışabilirlik Doğrulaması**:
   - Kod yazıldıktan sonra derleme veya çalışma hatalarını (`npm run build` / Vite konsol logları) kontrol edin.

---

## 📝 AŞAMA 3: Müdahale Sonrası Güncelleme (Post-Intervention)

Kod müdahalesi başarıyla tamamlandıktan sonra Vault güncellenmelidir:

1. **Mevcut Durumu Güncelleyin**:
   - Bir teknik borç çözüldüyse veya yeni bir bileşen eklendiyse [`02_CURRENT_STATE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/02_CURRENT_STATE.md) dosyasındaki durumu güncelleyin.
2. **Yol Haritasını İşaretleyin**:
   - Tamamlanan görevi [`05_ROADMAP_BACKLOG.md`](file:///c:/Users/ozcet/linktree-projem/.vault/05_ROADMAP_BACKLOG.md) dosyasında `[x]` olarak işaretleyin.
3. **Changelog'a Kaydedin**:
   - [`07_CHANGELOG.md`](file:///c:/Users/ozcet/linktree-projem/.vault/07_CHANGELOG.md) dosyasına yapılan değişikliği, tarihi ve mimari gerekçesini yazın.
