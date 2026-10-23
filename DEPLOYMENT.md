# 🚀 Linkspace - GitHub & Render Canlıya Alma Kılavuzu (Full-Stack Deployment)

Bu kılavuz, projenizi **GitHub** reposuna yükleyip **Render** üzerinde **tek bir URL** altında (hem Vue 3 frontend hem de Express REST API + PostgreSQL veritabanı) tamamen ücretsiz ve kalıcı olarak canlıya alma adımlarını içerir.

---

## 1. Adım: Projeyi GitHub'a Yükleme

1. [GitHub'da Yeni Repo Açın](https://github.com/new):
   - **Repository name**: `linktree-projem` (veya istediğiniz bir isim)
   - **Public** veya **Private** seçin.
   - *"Initialize this repository with..."* seçeneklerini **boş bırakın**.
   - **"Create repository"** butonuna basın.

2. Bilgisayarınızdaki terminalde şu komutları çalıştırarak projenizi GitHub'a gönderin:

```bash
git add .
git commit -m "feat: unified full-stack linkspace ready for Render deployment"
git branch -M main
git remote add origin https://github.com/tubaaa7/linktree-projem.git
git push -u origin main
```
*(GitHub kullanıcı adınız farklıysa `tubaaa7` yerine kendi kullanıcı adınızı yazın)*

---

## 2. Adım: Render ile Tek Tıkla Canlıya Alma (Önerilen - Blueprint)

Proje kök dizininde hazır [`render.yaml`](file:///c:/Users/ozcet/linktree-projem/render.yaml) bulunmaktadır. Bu dosya Render'a hem PostgreSQL veritabanını hem de Full-Stack Node.js uygulamasını otomatik kurdurur:

1. [Render Dashboard](https://dashboard.render.com/)'a giriş yapın (GitHub hesabınızla tek tıkla oturum açabilirsiniz).
2. Sağ üstteki **"New +" -> "Blueprint"** seçeneğine tıklayın.
3. GitHub reponuzu (`linktree-projem`) seçin ve **"Connect"** deyin.
4. Render, `render.yaml` dosyasını algılayacak ve size iki servis gösterecektir:
   - 🗄️ **`linkspace-db`** (PostgreSQL Veritabanı - Ücretsiz)
   - 🌐 **`linkspace-app`** (Full-Stack Web Servisi - Ücretsiz)
5. **"Apply"** butonuna tıklayın!
6. Render otomatik olarak:
   - PostgreSQL veritabanını oluşturur ve güvenli `DATABASE_URL` atar.
   - Vue 3 arayüzünü ve Express arka ucunu derler (`npm run build`).
   - Servisi başlatır (`npm start`).
7. Kurulum 2-3 dakika içinde tamamlanır ve size canlı bir HTTPS adresi verilir:  
   👉 **`https://linkspace-app.onrender.com`**

---

## 3. Adım: Alternatif Manuel Kurulum (Blueprint Kullanmak İstemezseniz)

Eğer Blueprint yerine Render üzerinde tek tek servis oluşturmak isterseniz:

### A. PostgreSQL Veritabanı Oluşturma:
1. **New + -> PostgreSQL**:
   - **Name**: `linkspace-db`
   - **Database**: `linktree_db`
   - **Plan**: Free
2. Oluşturulduktan sonra sayfadaki **"Internal Database URL"** veya **"External Database URL"** değerini kopyalayın.

### B. Web Servisi Oluşturma:
1. **New + -> Web Service**:
   - GitHub reponuzu bağlayın.
   - **Name**: `linkspace-app`
   - **Root Directory**: *(Boş bırakın)*
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `DATABASE_URL`: *(1. adımda kopyaladığınız PostgreSQL bağlantı URL'i)*
     - `JWT_SECRET`: *(Güvenli rastgele bir şifre)*
2. **"Create Web Service"** butonuna basın.

---

## 4. Adım: Canlı Sistem Özellikleri & Avantajları
* **Tek Domain**: Frontend ve Backend aynı origin'de çalıştığı için sıfır CORS hatası ve hızlı sayfa yüklemesi.
* **SPA Routing**: `/admin`, `/login`, `/@tubagul` gibi tüm dinamik rotalar doğrudan Express üzerinden `dist/index.html` olarak sunulur.
* **Akıllı Fallback**: PostgreSQL henüz bağlanmamış veya uykudayken dahi sistem LocalStorage ve bellek içi tohum verilerle kesintisiz çalışmaya devam eder.
