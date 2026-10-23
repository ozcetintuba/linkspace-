---
description: Projeye kod müdahalesi yapmadan önce Vault sistemini kontrol etme ve standartlara uyma kuralı
globs: ["**/*"]
---

# 🛡️ Vault Protokolü ve Koda Müdahale Kuralı

Bu depoda çalışan her yapay zekâ asistanı (AI Agent) ve geliştirici, kod üzerinde herhangi bir değişiklik yapmadan önce **Vault** sistemini referans almak zorundadır.

## 📋 Zorunlu İlk Adım (Pre-Intervention)
1. Kod yazmaya, refactoring yapmaya veya hata ayıklamaya başlamadan önce `.vault/00_INDEX.md` dosyasını ve ilgili Vault belgelerini inceleyin:
   - Mimari ve dizin yapısı için: `.vault/01_ARCHITECTURE.md`
   - Mevcut durum ve bilinen sorunlar için: `.vault/02_CURRENT_STATE.md`
   - Veri modelleri ve tipler için: `.vault/03_DATA_MODELS.md`
   - Kodlama standartları için: `.vault/04_CODING_STANDARDS.md`
   - Koda müdahale protokolü için: `.vault/06_INTERVENTION_PROTOCOL.md`

## ⚙️ Uygulama İlkeleri (Execution Rules)
- **Pinia Kullanımı**: Asla bileşenler içinde bağımsız yerel mock veriler tanımlamayın; tüm verileri ve eylemleri `src/stores/linkStore.js` üzerinden yönetin.
- **Vue 3 SFC**: Her zaman `<script setup>` ve Composition API kullanın.
- **Tasarım Bütünlüğü**: Tailwind CSS sınıflarını ve mevcut koyu tema/cam efekti estetiğini koruyun.

## 📝 Son Adım (Post-Intervention)
- Bir görev tamamlandığında, teknik bir borç çözüldüğünde veya yeni bir mimari karar alındığında:
  1. `.vault/02_CURRENT_STATE.md` belgesini güncelleyin.
  2. `.vault/05_ROADMAP_BACKLOG.md` belgesinde ilgili maddeyi `[x]` olarak işaretleyin.
  3. `.vault/07_CHANGELOG.md` belgesine yapılan değişikliği ekleyin.
