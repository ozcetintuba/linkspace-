# 📐 04 - KODLAMA STANDARTLARI VE PRENSİPLER (CODING STANDARDS)

Bu kurallar projedeki kod bütünlüğünü, güvenliğini ve okunabilirliğini korumak için belirlenmiştir. Yapılan tüm kod katkıları bu standartlara uygun olmalıdır.

---

## 1. Vue 3 ve SFC Kuralları

- **`<script setup>` Kullanımı**: Tüm bileşenlerde modern Vue 3 `<script setup>` sözdizimi zorunludur. Options API kesinlikle kullanılmaz.
- **Reaktivite**:
  - İlkel ve karmaşık nesneler için `ref()` veya uygun durumlarda `reactive()` tercih edilir.
  - Bağımlı hesaplamalar için mutlaka `computed()` kullanılmalıdır.
- **Store Entegrasyonu**:
  - Bileşenler içinde yerel mock veri dizileri üretilmemelidir.
  - Tüm veri okuma ve yazma işlemleri `linkStore` üzerinden yapılmalıdır.
  - Store eylemleri (Actions) aracılığıyla state mutasyonları gerçekleştirilmelidir.
- **Güvenlik (XSS Koruması)**:
  - Kullanıcı girdileri için kesinlikle `v-html` kullanılmamalıdır; `v-text` veya `{{ }}` enterpolasyonu kullanılmalıdır.
  - Dış bağlantı içeren `<a>` etiketlerinde `target="_blank"` ile birlikte mutlaka `rel="noopener noreferrer"` öznitelikleri bulunmalıdır.

---

## 2. Tailwind CSS ve Tasarım Standartları

- **Utility Sınıfları**: Stil tanımlamalarında öncelik her zaman Tailwind sınıflarıdır. Zorunlu olmadıkça `style=""` inline tanımları veya özel CSS yazılmamalıdır.
- **Renk Uyumu**:
  - Arka planlar: `bg-slate-900`, `bg-slate-950`
  - Vurgular: `purple-600`, `purple-500`, `pink-500`
  - Metinler: `text-white`, `text-slate-300`, `text-slate-400`
  - Durumlar: Aktif/Başarılı için `emerald-400`, Silme/Hata için `rose-400`
- **Etkileşim (Micro-interactions)**:
  - Tıklanabilir buton ve kartlarda `transition-all duration-200`, `hover:scale-[1.02]`, `active:scale-[0.98]` gibi mikro animasyonlar korunmalıdır.
  - Cam efekti için `backdrop-blur-md` ve `bg-white/10` standart kalıbı kullanılmalıdır.

---

## 3. İsimlendirme Kuralları (Naming Conventions)

- **Bileşen Dosyaları**: PascalCase (örn: `ProfileView.vue`, `AdminView.vue`, `LinkCard.vue`)
- **Store & Yardımcı Dosyalar**: camelCase (örn: `linkStore.js`, `formatUrl.js`)
- **Değişken ve Fonksiyonlar**: camelCase (örn: `newLink`, `handleLinkClick`, `toggleLinkStatus`)
- **Sabitler**: UPPER_SNAKE_CASE (örn: `DEFAULT_AVATAR_URL`)

---

## 4. İkon Standartları
- Projede ikon kütüphanesi olarak `lucide-vue-next` kullanılmaktadır.
- Farklı bir ikon kütüphanesi (FontAwesome vb.) eklenmemeli, Lucide ailesi tutarlı şekilde sürdürülmelidir.
