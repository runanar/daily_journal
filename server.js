// Gerekli kütüphaneleri içeri aktarıyoruz
const express = require('express'); // Web sunucusu oluşturmak için Express framework'ü
const sqlite3 = require('sqlite3').verbose(); // SQLite veritabanı ile çalışmak için

// Express uygulamasını başlatıyoruz
const app = express();
const PORT = process.env.PORT || 3000; // Sunucunun çalışacağı port numarası (varsayılan 3000)

// Middlewares (Ara yazılımlar):
// JSON formatındaki istek gövdelerini işlemek için (frontend'den gelen veriler)
app.use(express.json());
// "public" klasöründeki dosyaları (index.html, style.css, script.js) doğrudan sunmak için
app.use(express.static('public'));

// Veritabanı bağlantısını kuruyoruz
// 'gunluk.db' adında bir veritabanı dosyası oluşturacak veya bağlanacak
const db = new sqlite3.Database('./gunluk.db', (err) => {
    if (err) {
        // Veritabanı bağlantısında kritik hata, uygulamayı sonlandırabiliriz
        console.error('Veritabanı bağlantı hatası:', err.message);
        process.exit(1); // Uygulamayı sonlandır
    } else {
        console.log('SQLite veritabanına başarıyla bağlanıldı.');
        // Veritabanı başarıyla bağlandığında tabloları oluştur
        // Burada not tablosunun son hali tanımlanıyor
        db.run(`CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            mood TEXT,
            background_color TEXT DEFAULT '#ffffff', -- Yeni 'background_color' sütunu ve varsayılan değeri
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (createErr) => {
            if (createErr) {
                console.error('Tablo oluşturma hatası:', createErr.message);
            } else {
                console.log('notes tablosu başarıyla oluşturuldu veya zaten mevcut.');
                // Mevcut tablolara yeni sütunlar eklemek için ALTER TABLE komutları
                // Bu komutlar sütun zaten varsa 'duplicate column name' hatası verir, bu normaldir.
                db.run("ALTER TABLE notes ADD COLUMN title TEXT", (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column name')) {
                        console.error('ALTER TABLE hatası: title sütunu eklenirken hata oluştu:', alterErr.message);
                    } else if (!alterErr) {
                        console.log('title sütunu tabloya eklendi (veya zaten mevcuttu).');
                    }
                });
                db.run("ALTER TABLE notes ADD COLUMN mood TEXT", (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column name')) {
                        console.error('ALTER TABLE hatası: mood sütunu eklenirken hata oluştu:', alterErr.message);
                    } else if (!alterErr) {
                        console.log('mood sütunu tabloya eklendi (veya zaten mevcuttu).');
                    }
                });
                // background_color sütununu eklerken varsayılan değerini de belirtiyoruz
                db.run("ALTER TABLE notes ADD COLUMN background_color TEXT DEFAULT '#ffffff'", (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column name')) {
                        console.error('ALTER TABLE hatası: background_color sütunu eklenirken hata oluştu:', alterErr.message);
                    } else if (!alterErr) {
                        console.log('background_color sütunu tabloya eklendi (veya zaten mevcuttu).');
                    }
                });
                // Not: 'youtube_url' sütununu kaldırmak, SQLite'da doğrudan ALTER TABLE ile yapılamaz.
                // Eğer bu sütunu tamamen kaldırmak isterseniz, veritabanını silip yeniden oluşturmanız
                // veya daha karmaşık bir veritabanı migrasyonu yapmanız gerekebilir.
                // Mevcut kurulumda, eski youtube_url sütunu veritabanında kalacak ancak kullanılmayacak.
            }
        });
    }
});

// API Endpointleri

// 1. Yeni bir günlük girdisi ekleme (POST isteği)
app.post('/api/notes', (req, res) => {
    // İstek gövdesinden title, content, mood ve background_color alıyoruz
    const { title, content, mood, background_color } = req.body;

    // Başlık zorunlu kontrolü
    if (!title) {
        return res.status(400).json({ error: 'Günlük başlığı boş olamaz.' });
    }
    // İçerik veya ruh hali seçimi boşsa hata ver (ikisi birden boş olamaz)
    if (!content && !mood) {
        return res.status(400).json({ error: 'Günlük içeriği veya ruh hali seçimi boş olamaz.' });
    }

    // Günlüğü veritabanına kaydet
    // mood boşsa NULL olarak, background_color boşsa varsayılan '#ffffff' olarak kaydet
    db.run('INSERT INTO notes (title, content, mood, background_color) VALUES (?, ?, ?, ?)',
        [title, content, mood || null, background_color || '#ffffff'], // Eğer boş gelirse varsayılan değerleri kullan
        function(err) {
            if (err) {
                console.error('Günlük kaydetme hatası:', err.message);
                return res.status(500).json({ error: 'Günlük kaydedilirken bir hata oluştu.' });
            }
            // Başarılı olursa, kaydedilen günlükle birlikte yanıt ver
            res.status(201).json({
                id: this.lastID,
                title,
                content,
                mood,
                background_color,
                created_at: new Date().toISOString()
            });
        }
    );
});

// 2. Tüm günlük girdilerini getirme (GET isteği)
app.get('/api/notes', (req, res) => {
    // Veritabanındaki tüm günlükleri al (en yeniden eskiye doğru sırala)
    // SELECT * ile tüm sütunlar (id, title, content, mood, background_color, created_at) gelecek
    db.all('SELECT * FROM notes ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Günlükleri getirme hatası:', err.message);
            return res.status(500).json({ error: 'Günlükler getirilirken bir hata oluştu.' });
        }
        // Başarılı olursa, günlükleri JSON formatında yanıt olarak gönder
        res.json(rows);
    });
});

// 3. Bir günlük girdisini silme (DELETE isteği)
app.delete('/api/notes/:id', (req, res) => {
    const { id } = req.params; // URL'den not ID'sini al

    db.run('DELETE FROM notes WHERE id = ?', id, function(err) {
        if (err) {
            console.error('Günlük silme hatası:', err.message);
            return res.status(500).json({ error: 'Günlük silinirken bir hata oluştu.' });
        }
        if (this.changes === 0) {
            // Eğer hiçbir satır etkilenmediyse, o ID'ye sahip not bulunamadı demektir
            return res.status(404).json({ error: 'Silinecek günlük bulunamadı.' });
        }
        // Silme başarılı olduğunda 200 OK ve mesaj dönebiliriz.
        res.status(200).json({ message: 'Günlük başarıyla silindi.' });
    });
});

// Sunucuyu belirtilen portta dinlemeye başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    console.log(`Uygulama için: http://localhost:${PORT}/index.html adresine gidin.`);
});