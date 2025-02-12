# İşletme Bulucu

Google Maps API kullanarak belirli bir lokasyondaki işletmeleri bulmanızı sağlayan web uygulaması.

## Özellikler

- 🗺️ Harita üzerinden konum seçimi
- 🔍 Belirlenen yarıçapta işletme arama
- 📋 Detaylı işletme bilgileri (telefon, website, email, vb.)
- 📊 Excel formatında veri dışa aktarım

## Kurulum

1. Projeyi bilgisayarınıza indirin:
```bash
git clone [REPO_URL]
cd isletme-bulucu
```

2. Gerekli paketleri yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun:
```bash
cp .env.example .env
```

4. `.env` dosyasına Google Maps API anahtarınızı ekleyin:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

5. Uygulamayı başlatın:
```bash
npm run dev
```

6. Tarayıcınızda şu adresi açın: `http://localhost:5000`

## Gereksinimler

- Node.js 18.0 veya üzeri
- Google Maps API anahtarı (Places API ve Maps JavaScript API aktif olmalı)

## Kullanım

1. Harita üzerinde istediğiniz konuma tıklayın
2. Arama yarıçapını metre cinsinden belirleyin
3. "İşletmeleri Ara" butonuna tıklayın
4. Bulunan işletmeleri listede görüntüleyin
5. İsterseniz sonuçları Excel formatında indirin

## Lisans

MIT
