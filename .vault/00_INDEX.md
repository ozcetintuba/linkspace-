# 🏛️ PROJECT VAULT (PROJE BİLGİ BANKASI VE YÖNETİM SİSTEMİ)

> **DİKKAT (ZORUNLU KURAL):**  
> Bu projede herhangi bir kod yazmadan, düzenleme yapmadan veya yeni özellik eklemeden önce bu Vault dokümantasyonunu incelemek **zorunludur**. Kod müdahalesi tamamlandıktan sonra yapılan değişiklikler Vault'a işlenmelidir.

---

## 📌 Vault Nedir ve Neden Kuruldu?
Bu sistem, projenin mimari yapısını, mevcut durumunu, veri modellerini, kodlama standartlarını ve yol haritasını tek bir gerçeklik kaynağında (Single Source of Truth) toplar. Hem geliştiricilerin hem de yapay zekâ asistanlarının (AI Agents) projeye körleme müdahale etmesini engeller; her müdahalenin bilinçli, standartlara uygun ve mimariyi bozmadan gerçekleşmesini sağlar.

---

## 🗂️ Vault Dosya Haritası (Index)

| No | Doküman | Açıklama | Ne Zaman Bakılmalı? |
|:---|:---|:---|:---|
| **01** | [`01_ARCHITECTURE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/01_ARCHITECTURE.md) | Mimari, teknoloji yığını, klasör yapısı ve veri akışı | Yeni dosya/katman eklenirken, mimari anlaşılmak istendiğinde |
| **02** | [`02_CURRENT_STATE.md`](file:///c:/Users/ozcet/linktree-projem/.vault/02_CURRENT_STATE.md) | Mevcut durum analizi, aktif bileşenler ve tespit edilen teknik borçlar | Projeye başlamadan önce mevcut eksikleri ve riskleri görmek için |
| **03** | [`03_DATA_MODELS.md`](file:///c:/Users/ozcet/linktree-projem/.vault/03_DATA_MODELS.md) | Link, Profil, Tema veri şemaları ve tip tanımları | Veri yapısı değiştirilirken veya yeni alan eklenirken |
| **04** | [`04_CODING_STANDARDS.md`](file:///c:/Users/ozcet/linktree-projem/.vault/04_CODING_STANDARDS.md) | Vue 3 SFC (`<script setup>`), Tailwind CSS, isimlendirme ve temiz kod kuralları | Herhangi bir koda dokunmadan veya yeni bileşen yazarken |
| **05** | [`05_ROADMAP_BACKLOG.md`](file:///c:/Users/ozcet/linktree-projem/.vault/05_ROADMAP_BACKLOG.md) | Önceliklendirilmiş geliştirme listesi ve sonraki adımlar | Hangi özelliğin geliştirileceğine karar verirken |
| **06** | [`06_INTERVENTION_PROTOCOL.md`](file:///c:/Users/ozcet/linktree-projem/.vault/06_INTERVENTION_PROTOCOL.md) | Koda müdahale öncesi & sonrası zorunlu kontrol listesi (Checklist) | **HER KOD MÜDAHALESİNDEN ÖNCE VE SONRA** |
| **07** | [`07_CHANGELOG.md`](file:///c:/Users/ozcet/linktree-projem/.vault/07_CHANGELOG.md) | Değişiklik günlüğü, karar kayıtları (ADR) | Yapılan geliştirmeler bittiğinde kayıt altına almak için |

---

## ⚡ Hızlı Özet (Project at a Glance)
- **Proje Adı**: Linktree Projem (Kişisel Bağlantı ve Yönetim Portalı)
- **Teknoloji**: Vue 3 (Composition API `<script setup>`), Vite, Tailwind CSS, Pinia, Vue Router 4, Lucide Icons
- **Ana Rotalar**:
  - `/` -> `ProfileView.vue` (Kullanıcı profili ve bağlantı listesi - Ziyaretçi görünümü)
  - `/admin` -> `AdminView.vue` (Bağlantı ekleme, silme, görünürlük kontrolü - Yönetici paneli)
- **Güncel Durum**: Full-Stack mimari aktif (Express.js REST API + PostgreSQL 16 + Pinia hibrit store + JWT Auth + Three.js WebGL + Dribbble Sales CRM Dark/Pure-Light arayüzü). Faz 1-23 tamamlandı (v0.35.0 - Etkileşimli 3D / WebGL Profil Deneyimi, Three.js Siber Maskot, Takımyıldızı Parçacıkları & Yaylanma Fiziği devrede).
