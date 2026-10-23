# 🤖 AGENTS & DEVELOPER GUIDELINES

Hoş geldiniz! Bu proje katı bir **Vault Yönetim Protokolü** ile yönetilmektedir.

## 🚨 ÖNEMLİ KURAL: Koda Müdahale Öncesi Vault Kontrolü
Bu projede kod yazmadan, dosya eklemeden veya mevcut kodu değiştirmeden önce **MUTLAKA** `.vault/` dizinindeki dokümantasyonu kontrol edin:

- 🗂️ **Ana İndeks**: [`.vault/00_INDEX.md`](file:///c:/Users/ozcet/linktree-projem/.vault/00_INDEX.md)
- 🏗️ **Mimari ve Dizinler**: [`.vault/01_ARCHITECTURE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/01_ARCHITECTURE.md)
- 🔍 **Mevcut Durum ve Teknik Borçlar**: [`.vault/02_CURRENT_STATE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/02_CURRENT_STATE.md)
- 📊 **Veri Modelleri**: [`.vault/03_DATA_MODELS.md`](file:///c:/Users/ozcet/linktree-projem/.vault/03_DATA_MODELS.md)
- 📐 **Kodlama Standartları**: [`.vault/04_CODING_STANDARDS.md`](file:///c:/Users/ozcet/linktree-projem/.vault/04_CODING_STANDARDS.md)
- 🗺️ **Yol Haritası ve Görevler**: [`.vault/05_ROADMAP_BACKLOG.md`](file:///c:/Users/ozcet/linktree-projem/.vault/05_ROADMAP_BACKLOG.md)
- 🛡️ **Müdahale Protokolü (Checklist)**: [`.vault/06_INTERVENTION_PROTOCOL.md`](file:///c:/Users/ozcet/linktree-projem/.vault/06_INTERVENTION_PROTOCOL.md)
- 📜 **Değişiklik Günlüğü**: [`.vault/07_CHANGELOG.md`](file:///c:/Users/ozcet/linktree-projem/.vault/07_CHANGELOG.md)

---

### Temel Prensipler
1. **Asla izole mock veri yazmayın**: Durum yönetimi için `src/stores/linkStore.js` kullanın.
2. **Standartlara uyun**: Vue 3 `<script setup>`, Tailwind CSS, Lucide ikonları.
3. **Vault'u güncel tutun**: Koddaki her önemli değişiklikten sonra ilgili Vault dosyalarını güncelleyin.
