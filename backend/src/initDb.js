import bcrypt from 'bcryptjs'
import { pool, query } from './db.js'

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Veritabanı tabloları kontrol ediliyor/oluşturuluyor...')

    // 1. Profil Tablosu
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        bio TEXT,
        avatar TEXT,
        avatar_shape VARCHAR(50) DEFAULT 'circle',
        avatar_glow VARCHAR(50) DEFAULT 'yellow',
        status_text VARCHAR(100) DEFAULT 'Yeni Projelere & Fırsatlara Açık',
        status_color VARCHAR(50) DEFAULT 'none',
        is_verified BOOLEAN DEFAULT TRUE,
        banner TEXT DEFAULT '',
        banner_pattern VARCHAR(50) DEFAULT 'mesh',
        badges JSONB DEFAULT '[]'::jsonb,
        social_links JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner TEXT DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_pattern VARCHAR(50) DEFAULT 'mesh';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_shape VARCHAR(50) DEFAULT 'circle';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_glow VARCHAR(50) DEFAULT 'yellow';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_text VARCHAR(100) DEFAULT 'Yeni Projelere & Fırsatlara Açık';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_color VARCHAR(50) DEFAULT 'none';
      ALTER TABLE profiles ALTER COLUMN status_color SET DEFAULT 'none';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_by_category BOOLEAN DEFAULT false;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_style VARCHAR(20) DEFAULT 'accordion';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS folders_default_expanded BOOLEAN DEFAULT true;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_badges BOOLEAN DEFAULT false;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS layout_style VARCHAR(20) DEFAULT 'list';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id INTEGER;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_mode VARCHAR(20) DEFAULT 'photo';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id) WHERE user_id IS NOT NULL;
      UPDATE profiles SET status_color = 'none' WHERE status_color = 'emerald';
      UPDATE profiles SET show_badges = false WHERE show_badges IS NULL;
      UPDATE profiles SET group_by_category = false WHERE group_by_category IS NULL;
    `)

    // 2. Bağlantılar Tablosu
    await query(`
      CREATE TABLE IF NOT EXISTS links (
        id BIGINT PRIMARY KEY,
        user_id INTEGER,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        icon VARCHAR(50),
        custom_color VARCHAR(50) DEFAULT 'default',
        clicks INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id INTEGER;
      CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
      ALTER TABLE links ADD COLUMN IF NOT EXISTS custom_color VARCHAR(50) DEFAULT 'default';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS show_countdown BOOLEAN DEFAULT TRUE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS embed_type VARCHAR(20) DEFAULT 'none';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS show_embed BOOLEAN DEFAULT FALSE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS lock_type VARCHAR(20) DEFAULT 'pin';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS passcode VARCHAR(50) DEFAULT '';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS lock_warning VARCHAR(255) DEFAULT '';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS is_header BOOLEAN DEFAULT FALSE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT FALSE;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS title_b VARCHAR(255) DEFAULT '';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS url_b TEXT DEFAULT '';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS clicks_a INTEGER DEFAULT 0;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS clicks_b INTEGER DEFAULT 0;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS views_a INTEGER DEFAULT 0;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS views_b INTEGER DEFAULT 0;
      ALTER TABLE links ADD COLUMN IF NOT EXISTS grid_span VARCHAR(20) DEFAULT 'full';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS thumbnail TEXT DEFAULT '';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS card_badge VARCHAR(50) DEFAULT '';
    `)

    // 3. Ayarlar & Tema Tablosu (Kullanıcı Bazlı Bileşik Anahtar)
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER NOT NULL DEFAULT 1,
        key VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, key)
      );
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id INTEGER NOT NULL DEFAULT 1;
      DO $$
      DECLARE
        pk_name text;
        pk_cols text;
      BEGIN
        SELECT c.conname, string_agg(a.attname, ',' ORDER BY k.ord)
        INTO pk_name, pk_cols
        FROM pg_constraint c
        JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'settings'::regclass AND c.contype = 'p'
        GROUP BY c.conname;

        IF pk_name IS NOT NULL AND pk_cols = 'key' THEN
          EXECUTE format('ALTER TABLE settings DROP CONSTRAINT %I', pk_name);
          ALTER TABLE settings ADD PRIMARY KEY (user_id, key);
        END IF;
      END $$;
    `)

    // 4. Kullanıcılar (Users & Members) Tablosu
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
    `)

    // 5. Ziyaretçi & QR Kod Analitiği Tablosu (Visit Stats)
    await query(`
      CREATE TABLE IF NOT EXISTS visit_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        device VARCHAR(50) NOT NULL DEFAULT 'desktop',
        source VARCHAR(50) NOT NULL DEFAULT 'direct',
        user_agent TEXT,
        os VARCHAR(50) DEFAULT 'iOS',
        device_model VARCHAR(100) DEFAULT 'Apple iPhone',
        browser VARCHAR(50) DEFAULT 'Safari',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE visit_stats ADD COLUMN IF NOT EXISTS user_id INTEGER;
      CREATE INDEX IF NOT EXISTS idx_visit_stats_user_id ON visit_stats(user_id);
      ALTER TABLE visit_stats ADD COLUMN IF NOT EXISTS os VARCHAR(50) DEFAULT 'iOS';
      ALTER TABLE visit_stats ADD COLUMN IF NOT EXISTS device_model VARCHAR(100) DEFAULT 'Apple iPhone';
      ALTER TABLE visit_stats ADD COLUMN IF NOT EXISTS browser VARCHAR(50) DEFAULT 'Safari';
      UPDATE visit_stats SET os = 'iOS', device_model = 'Apple iPhone', browser = 'Safari' WHERE device = 'mobile' AND (os IS NULL OR os = '');
      UPDATE visit_stats SET os = 'Windows', device_model = 'Windows PC', browser = 'Chrome' WHERE device = 'desktop' AND (os IS NULL OR os = '');
    `)

    // 6. Gelen İletişim Mesajları & Leads Tablosu (Messages)
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id INTEGER;
      CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    `)

    // 7. Ayrıntılı Tıklama Olayları & Kaynak Analitiği Tablosu (Click Events)
    await query(`
      CREATE TABLE IF NOT EXISTS click_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        link_id BIGINT,
        referrer VARCHAR(100) DEFAULT 'direct',
        device VARCHAR(50) DEFAULT 'desktop',
        ip_address VARCHAR(100) DEFAULT '127.0.0.1',
        country VARCHAR(100) DEFAULT 'TR',
        city VARCHAR(100) DEFAULT 'İstanbul',
        user_agent TEXT DEFAULT '',
        variant VARCHAR(5) DEFAULT 'a',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE click_events ADD COLUMN IF NOT EXISTS user_id INTEGER;
      ALTER TABLE click_events ADD COLUMN IF NOT EXISTS variant VARCHAR(5) DEFAULT 'a';
      CREATE INDEX IF NOT EXISTS idx_click_events_user_id ON click_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_click_events_link_id ON click_events(link_id);
      CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON click_events(created_at);
    `)

    // Varsayılan Örnek Mesajlar (Eğer tablo boşsa ekle)
    const messageCount = await query('SELECT COUNT(*) FROM messages')
    if (parseInt(messageCount.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO messages (name, email, message, is_read, created_at)
        VALUES 
          ('Ali Yılmaz', 'ali.yilmaz@techcorp.com', 'Merhaba Tuba, portfolyondaki Vue 3 projeni çok beğendik. Önümüzdeki çeyrek için açık olan Full-Stack staj pozisyonumuz için görüşmek isteriz.', false, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
          ('Zeynep Kaya', 'zeynep@startupstudio.io', 'Selamlar! GitHub üzerindeki Linktree projenizin arayüzü ve mimarisi harika görünüyor. Yeni SaaS projemizde freelance destek vermeyi düşünür müsün?', true, CURRENT_TIMESTAMP - INTERVAL '1 day');
      `)
      console.log('🌱 Varsayılan iletişim mesajları tohum verileri eklendi.')
    }

    // Varsayılan Tıklama Olayları Verileri (Eğer tablo boşsa tohum verileri ekle)
    const clickEventsCount = await query('SELECT COUNT(*) FROM click_events')
    if (parseInt(clickEventsCount.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO click_events (link_id, referrer, device, created_at)
        SELECT 1, 'instagram', 'mobile', CURRENT_TIMESTAMP - (INTERVAL '1 day' * (g % 7)) FROM generate_series(1, 35) AS g
        UNION ALL
        SELECT 2, 'twitter', 'desktop', CURRENT_TIMESTAMP - (INTERVAL '1 day' * (g % 7)) FROM generate_series(1, 28) AS g
        UNION ALL
        SELECT 3, 'linkedin', 'mobile', CURRENT_TIMESTAMP - (INTERVAL '1 day' * (g % 7)) FROM generate_series(1, 22) AS g
        UNION ALL
        SELECT 4, 'direct', 'desktop', CURRENT_TIMESTAMP - (INTERVAL '1 day' * (g % 7)) FROM generate_series(1, 15) AS g;
      `)
      console.log('🌱 Varsayılan tıklama analitik tohum verileri eklendi.')
    }

    // Varsayılan Ziyaretçi Analitik Verileri (Eğer tablo boşsa gerçekçi başlangıç tohum verileri ekle)
    const visitCount = await query('SELECT COUNT(*) FROM visit_stats')
    if (parseInt(visitCount.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO visit_stats (device, source)
        SELECT 'mobile', 'qr' FROM generate_series(1, 76)
        UNION ALL
        SELECT 'desktop', 'qr' FROM generate_series(1, 8)
        UNION ALL
        SELECT 'mobile', 'direct' FROM generate_series(1, 29)
        UNION ALL
        SELECT 'desktop', 'direct' FROM generate_series(1, 29);
      `)
      console.log('🌱 Varsayılan ziyaretçi ve QR analitik tohum verileri eklendi.')
    }

    // 8. Varsayılan Yönetici Hesabı ve Çoklu Kullanıcı (Multi-Tenant) Eşitleme
    const existingAdminRes = await query("SELECT id FROM users ORDER BY id ASC LIMIT 1")
    let primaryUserId = existingAdminRes.rows[0]?.id

    if (!primaryUserId) {
      const defaultPasswordHash = bcrypt.hashSync('admin123', 10)
      const insertedAdmin = await query(`
        INSERT INTO users (username, email, password_hash, name, role, status)
        VALUES ($1, $2, $3, $4, 'admin', 'active')
        RETURNING id
      `, ['admin', 'admin@linktree.local', defaultPasswordHash, 'Tuba Gül'])
      primaryUserId = insertedAdmin.rows[0].id
      console.log('🌱 Varsayılan yönetici hesabı oluşturuldu (Kullanıcı: admin / Şifre: admin123).')
    } else {
      await query(`UPDATE users SET role = 'admin', status = 'active' WHERE id = $1`, [primaryUserId])
    }

    // Varsayılan Profil Verisi (Eğer tablo boşsa ekle)
    const profileCount = await query('SELECT COUNT(*) FROM profiles')
    if (parseInt(profileCount.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO profiles (user_id, name, username, bio, avatar, avatar_mode, badges, social_links)
        VALUES (
          $1,
          'Tuba Gül',
          '@tubagul',
          'Yazılım Mühendisliği Öğrencisi | Full-Stack Geliştirici Adayı 🚀',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          'switchable',
          '[{"id":"badge-1","text":"Full-Stack Developer","icon":"Code","color":"default"},{"id":"badge-2","text":"Vue 3 & Express","icon":"Sparkles","color":"yellow"},{"id":"badge-3","text":"İstanbul, TR","icon":"MapPin","color":"default"}]'::jsonb,
          '{"github": "https://github.com", "linkedin": "https://linkedin.com", "instagram": "https://instagram.com"}'::jsonb
        )
      `, [primaryUserId])
      console.log('🌱 Varsayılan profil kaydı eklendi.')
    }

    // Varsayılan Link Verileri (Eğer tablo boşsa ekle)
    const linkCount = await query('SELECT COUNT(*) FROM links')
    if (parseInt(linkCount.rows[0].count, 10) === 0) {
      const defaultLinks = [
        { id: 1, title: 'Kişisel Web Sitem & Portfolyom', url: 'https://github.com/tubaaa7', isActive: true, icon: 'globe', clicks: 12, orderIndex: 0 },
        { id: 2, title: 'GitHub Projelerim', url: 'https://github.com/tubaaa7/linkspace-', isActive: true, icon: 'github', clicks: 38, orderIndex: 1 },
        { id: 3, title: 'LinkedIn Bağlantım', url: 'https://linkedin.com', isActive: true, icon: 'linkedin', clicks: 24, orderIndex: 2 },
        { id: 4, title: 'Instagram Hesabım', url: 'https://instagram.com', isActive: true, icon: 'instagram', clicks: 15, orderIndex: 3 }
      ]

      for (const link of defaultLinks) {
        await query(`
          INSERT INTO links (id, user_id, title, url, is_active, icon, clicks, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [link.id, primaryUserId, link.title, link.url, link.isActive, link.icon, link.clicks, link.orderIndex])
      }
      console.log('🌱 Varsayılan bağlantılar eklendi.')
    }

    // Mevcut sahipsiz kayıtları ana yöneticiye (primaryUserId) bağla (Geriyedönük Uyumluluk)
    await query('UPDATE profiles SET user_id = $1 WHERE user_id IS NULL AND id = (SELECT id FROM profiles ORDER BY id ASC LIMIT 1)', [primaryUserId])
    await query('UPDATE links SET user_id = $1 WHERE user_id IS NULL', [primaryUserId])
    await query('UPDATE messages SET user_id = $1 WHERE user_id IS NULL', [primaryUserId])
    await query('UPDATE visit_stats SET user_id = $1 WHERE user_id IS NULL', [primaryUserId])
    await query('UPDATE click_events SET user_id = $1 WHERE user_id IS NULL', [primaryUserId])

    // Varsayılan Tema Ayarı (Eğer yoksa ekle)
    await query(`
      INSERT INTO settings (user_id, key, value)
      VALUES ($1, 'theme', 'midnight')
      ON CONFLICT (user_id, key) DO NOTHING;
    `, [primaryUserId])

    // Başlangıç Topluluk Üyelerini Tohumla (Yalnızca tek kullanıcı varsa)
    const userCountAfter = await query('SELECT COUNT(*) FROM users')
    if (parseInt(userCountAfter.rows[0].count, 10) <= 1) {
      const demoPassHash = bcrypt.hashSync('demo1234', 10)
      const communitySeeds = [
        {
          username: 'mert.dev',
          email: 'mert.yilmaz@devmail.io',
          name: 'Mert Yılmaz',
          bio: 'Senior Backend Engineer • Node.js & Go • Açık Kaynak Geliştirici 💻',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
          layoutStyle: 'list',
          isVerified: true,
          links: [
            { id: 301, title: 'GitHub Açık Kaynak Kütüphanelerim', url: 'https://github.com', icon: 'github', clicks: 84, gridSpan: 'featured', cardBadge: '🚀 Açık Kaynak' },
            { id: 302, title: 'Node.js & Go Backend Mimarileri Blogu', url: 'https://medium.com', icon: 'book', clicks: 52, gridSpan: 'half', cardBadge: '' },
            { id: 303, title: 'LinkedIn & Profesyonel Kariyer Ağı', url: 'https://linkedin.com', icon: 'linkedin', clicks: 39, gridSpan: 'half', cardBadge: '' }
          ]
        },
        {
          username: 'selin.design',
          email: 'selin.design@creatives.co',
          name: 'Selin Kaya',
          bio: 'Product & Brand Designer • Design Systems • Minimalist UI/UX 🎨',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
          layoutStyle: 'bento',
          isVerified: true,
          links: [
            { id: 201, title: 'Selin Kaya Design Studio & Portfolyo', url: 'https://dribbble.com', icon: 'globe', clicks: 68, gridSpan: 'featured', cardBadge: '🎨 Portfolyo' },
            { id: 202, title: 'Figma UI Kit & Design System 2026', url: 'https://figma.com', icon: 'code', clicks: 45, gridSpan: 'half', cardBadge: '🔥 Popüler' },
            { id: 203, title: 'Dribbble Tasarım Vaka Analizleri', url: 'https://dribbble.com', icon: 'sparkles', clicks: 31, gridSpan: 'half', cardBadge: '' },
            { id: 204, title: 'Behance Marka Kimliği & İllüstrasyonlar', url: 'https://behance.net', icon: 'globe', clicks: 27, gridSpan: 'full', cardBadge: '' },
            { id: 205, title: 'Tasarım Danışmanlığı & Teklif İste', url: 'mailto:selin.design@creatives.co', icon: 'mail', clicks: 16, gridSpan: 'full', cardBadge: '' }
          ]
        },
        {
          username: 'can.tech',
          email: 'can.demir@cloudtech.com',
          name: 'Can Demir',
          bio: 'Cloud Architect & DevOps • AWS Certified • Kubernetes & CI/CD ☁️',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
          layoutStyle: 'list',
          isVerified: false,
          links: [
            { id: 401, title: 'AWS Cloud & DevOps En İyi Uygulamaları', url: 'https://aws.amazon.com', icon: 'terminal', clicks: 43, gridSpan: 'full', cardBadge: '☁️ Cloud' },
            { id: 402, title: 'Kubernetes & CI/CD Pipeline Rehberim', url: 'https://kubernetes.io', icon: 'code', clicks: 29, gridSpan: 'full', cardBadge: '' }
          ]
        }
      ]

      for (const seed of communitySeeds) {
        const uRes = await query(`
          INSERT INTO users (username, email, password_hash, name, role, status)
          VALUES ($1, $2, $3, $4, 'user', 'active')
          ON CONFLICT (username) DO NOTHING
          RETURNING id
        `, [seed.username, seed.email, demoPassHash, seed.name])

        const seededUserId = uRes.rows[0]?.id
        if (seededUserId) {
          await query(`
            INSERT INTO profiles (user_id, name, username, bio, avatar, avatar_mode, is_verified, layout_style, social_links)
            VALUES ($1, $2, $3, $4, $5, 'photo', $6, $7, '{}'::jsonb)
            ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO NOTHING
          `, [seededUserId, seed.name, `@${seed.username}`, seed.bio, seed.avatar, seed.isVerified, seed.layoutStyle])

          await query(`
            INSERT INTO settings (user_id, key, value)
            VALUES ($1, 'theme', 'midnight')
            ON CONFLICT (user_id, key) DO NOTHING
          `, [seededUserId])

          for (let idx = 0; idx < seed.links.length; idx++) {
            const l = seed.links[idx]
            await query(`
              INSERT INTO links (id, user_id, title, url, is_active, icon, custom_color, clicks, order_index, grid_span, card_badge)
              VALUES ($1, $2, $3, $4, true, $5, 'default', $6, $7, $8, $9)
              ON CONFLICT (id) DO NOTHING
            `, [l.id, seededUserId, l.title, l.url, l.icon, l.clicks, idx, l.gridSpan, l.cardBadge])
          }
        }
      }
      console.log('🌱 Topluluk başlangıç üyeleri ve profilleri veritabanına eklendi.')
    }

    console.log('✅ Veritabanı şeması ve tohum verileri başarıyla hazırlandı.')
    return true
  } catch (error) {
    console.error('❌ Veritabanı ilklendirilirken hata oluştu:', error.message)
    return false
  }
}

// Dosya doğrudan çalıştırıldığında (node src/initDb.js)
if (process.argv[1]?.endsWith('initDb.js')) {
  initializeDatabase().then(() => pool.end())
}
