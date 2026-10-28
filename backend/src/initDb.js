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
      UPDATE profiles SET status_color = 'none' WHERE status_color = 'emerald';
      UPDATE profiles SET show_badges = false WHERE show_badges IS NULL;
      UPDATE profiles SET group_by_category = false WHERE group_by_category IS NULL;
    `)

    // 2. Bağlantılar Tablosu
    await query(`
      CREATE TABLE IF NOT EXISTS links (
        id BIGINT PRIMARY KEY,
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
    `)

    // 3. Ayarlar & Tema Tablosu
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 4. Kullanıcılar (Users / Admins) Tablosu
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
    `)

    // 5. Ziyaretçi & QR Kod Analitiği Tablosu (Visit Stats)
    await query(`
      CREATE TABLE IF NOT EXISTS visit_stats (
        id SERIAL PRIMARY KEY,
        device VARCHAR(50) NOT NULL DEFAULT 'desktop',
        source VARCHAR(50) NOT NULL DEFAULT 'direct',
        user_agent TEXT,
        os VARCHAR(50) DEFAULT 'iOS',
        device_model VARCHAR(100) DEFAULT 'Apple iPhone',
        browser VARCHAR(50) DEFAULT 'Safari',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
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
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 7. Ayrıntılı Tıklama Olayları & Kaynak Analitiği Tablosu (Click Events)
    await query(`
      CREATE TABLE IF NOT EXISTS click_events (
        id SERIAL PRIMARY KEY,
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
      ALTER TABLE click_events ADD COLUMN IF NOT EXISTS variant VARCHAR(5) DEFAULT 'a';
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

    // Varsayılan Profil Verisi (Eğer tablo boşsa ekle)
    const profileCount = await query('SELECT COUNT(*) FROM profiles')
    if (parseInt(profileCount.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO profiles (name, username, bio, avatar, badges, social_links)
        VALUES (
          'Tuba Gül',
          '@tubagul',
          'Yazılım Mühendisliği Öğrencisi | Full-Stack Geliştirici Adayı 🚀',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          '[{"id":"badge-1","text":"Full-Stack Developer","icon":"Code","color":"default"},{"id":"badge-2","text":"Vue 3 & Express","icon":"Sparkles","color":"yellow"},{"id":"badge-3","text":"İstanbul, TR","icon":"MapPin","color":"default"}]'::jsonb,
          '{"github": "https://github.com", "linkedin": "https://linkedin.com", "instagram": "https://instagram.com"}'::jsonb
        )
      `)
      console.log('🌱 Varsayılan profil kaydı eklendi.')
    }

    // Varsayılan Link Verileri (Eğer tablo boşsa ekle)
    const linkCount = await query('SELECT COUNT(*) FROM links')
    if (parseInt(linkCount.rows[0].count, 10) === 0) {
      const defaultLinks = [
        { id: 1, title: 'Kişisel Web Sitem & Portfolyom', url: 'https://github.com', isActive: true, icon: 'globe', clicks: 12, orderIndex: 0 },
        { id: 2, title: 'GitHub Projelerim', url: 'https://github.com', isActive: true, icon: 'github', clicks: 38, orderIndex: 1 },
        { id: 3, title: 'LinkedIn Bağlantım', url: 'https://linkedin.com', isActive: true, icon: 'linkedin', clicks: 24, orderIndex: 2 },
        { id: 4, title: 'Instagram Hesabım', url: 'https://instagram.com', isActive: true, icon: 'instagram', clicks: 15, orderIndex: 3 }
      ]

      for (const link of defaultLinks) {
        await query(`
          INSERT INTO links (id, title, url, is_active, icon, clicks, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [link.id, link.title, link.url, link.isActive, link.icon, link.clicks, link.orderIndex])
      }
      console.log('🌱 Varsayılan bağlantılar eklendi.')
    }

    // Varsayılan Tema Ayarı (Eğer yoksa ekle)
    await query(`
      INSERT INTO settings (key, value)
      VALUES ('theme', 'midnight')
      ON CONFLICT (key) DO NOTHING;
    `)

    // Varsayılan Yönetici Hesabı (Eğer tablo boşsa ekle)
    const userCount = await query('SELECT COUNT(*) FROM users')
    if (parseInt(userCount.rows[0].count, 10) === 0) {
      const defaultPasswordHash = bcrypt.hashSync('admin123', 10)
      await query(`
        INSERT INTO users (username, email, password_hash, name)
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'admin@linktree.local', defaultPasswordHash, 'Yönetici'])
      console.log('🌱 Varsayılan yönetici hesabı oluşturuldu (Kullanıcı: admin / Şifre: admin123).')
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
