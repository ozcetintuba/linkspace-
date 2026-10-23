# 🚀 Linkspace - Bulut Dağıtım Kılavuzu (Production Deployment Guide)

Bu dokümanda projenin **GitHub**, **Vercel** (Frontend) ve **Render / Supabase** (Backend & PostgreSQL) üzerine kalıcı olarak canlıya alınması adım adım açıklanmıştır.

---

## 1. Adım: Projeyi GitHub'a Yükleme

1. [GitHub](https://github.com/new) üzerinde yeni bir repository (depo) oluşturun (Örn: `linktree-projem`).
2. Terminalinizde aşağıdaki komutları çalıştırarak yerel projenizi GitHub'a gönderin:

```bash
git add .
git commit -m "feat: v0.31.0 - Full-stack linkspace with rich embeds and lock support"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/linktree-projem.git
git push -u origin main
```

---

## 2. Adım: Backend & PostgreSQL Dağıtımı (Render veya Supabase)

### Yöntem A: Render ile Tek Tıkla Dağıtım (Önerilen)
Projenin kök dizininde hazır bir `render.yaml` (Blueprint) dosyası bulunmaktadır:
1. [Render Dashboard](https://dashboard.render.com/)'a giriş yapın.
2. **"New" -> "Blueprint"** seçeneğini tıklayın.
3. GitHub reponuzu seçin (`linktree-projem`).
4. Render, `render.yaml` dosyasını otomatik okuyarak **hem PostgreSQL veritabanını hem de Node.js Express API servisini** kuracaktır.
5. Kurulum tamamlandığında size bir backend URL'i verilir (Örn: `https://linkspace-backend.onrender.com`).

### Yöntem B: Manuel Render Kurulumu
1. **Veritabanı**: **New -> PostgreSQL** -> İsim: `linkspace-db`, Database: `linktree_db`. Oluşan `Internal Database URL` veya `External Database URL`'i kopyalayın.
2. **Web Servisi**: **New -> Web Service** -> GitHub reponuzu bağlayın:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `DATABASE_URL`: *(Yukarıda oluşturduğunuz PostgreSQL bağlantı adresi)*
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: *(Güvenli rastgele bir anahtar)*

---

## 3. Adım: Frontend Dağıtımı (Vercel)

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin ve **"Add New..." -> "Project"** butonuna tıklayın.
2. GitHub'daki `linktree-projem` reposunu içeri aktarın (Import).
3. Proje ayarlarında:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` seçeneğini işaretleyin (veya kök bırakın, `vercel.json` otomatik algılar).
4. **Environment Variables (Ortam Değişkenleri)** alanına şunu ekleyin:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://linkspace-backend.onrender.com/api` *(2. adımda aldığınız Render backend adresi)*
5. **"Deploy"** butonuna tıklayın!
6. Birkaç saniye içinde projeniz `https://linktree-projem.vercel.app` şeklinde kalıcı ve ücretsiz canlı yayında olacaktır! 🎉

---

## 4. Adım: Alan Adı (Custom Domain - Opsiyonel)
* Dilediğiniz özel alan adını (örn: `tubagul.me` veya `links.sirketiniz.com`) Vercel arayüzünden tek tıkla projenize bağlayabilirsiniz.
* Linkspace yönetim panelindeki **SEO & Özel Domain** sekmesinden DNS doğrulamasını test edebilirsiniz.
