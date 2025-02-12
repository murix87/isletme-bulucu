import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";

// İşyeri tiplerini Türkçe'ye çeviren yardımcı fonksiyon
function translatePlaceType(type: string): string {
  const translations: Record<string, string> = {
    accounting: "Muhasebe",
    airport: "Havalimanı",
    amusement_park: "Lunapark",
    aquarium: "Akvaryum",
    art_gallery: "Sanat Galerisi",
    atm: "ATM",
    bakery: "Fırın",
    bank: "Banka",
    bar: "Bar",
    beauty_salon: "Güzellik Salonu",
    bicycle_store: "Bisiklet Mağazası",
    book_store: "Kitapçı",
    bowling_alley: "Bowling Salonu",
    bus_station: "Otobüs Durağı",
    cafe: "Kafe",
    campground: "Kamp Alanı",
    car_dealer: "Araba Galerisi",
    car_rental: "Araba Kiralama",
    car_repair: "Araba Tamiri",
    car_wash: "Araba Yıkama",
    casino: "Gazino",
    cemetery: "Mezarlık",
    church: "Kilise",
    city_hall: "Belediye",
    clothing_store: "Giyim Mağazası",
    convenience_store: "Market",
    courthouse: "Adliye",
    dentist: "Diş Hekimi",
    department_store: "Alışveriş Merkezi",
    doctor: "Doktor",
    drugstore: "Eczane",
    electrician: "Elektrikçi",
    electronics_store: "Elektronik Mağazası",
    embassy: "Elçilik",
    establishment: "İşletme",
    fire_station: "İtfaiye",
    florist: "Çiçekçi",
    funeral_home: "Cenaze Evi",
    furniture_store: "Mobilya Mağazası",
    gas_station: "Benzin İstasyonu",
    gym: "Spor Salonu",
    hair_care: "Kuaför",
    hardware_store: "Hırdavatçı",
    health: "Sağlık",
    hindu_temple: "Hindu Tapınağı",
    home_goods_store: "Ev Eşyaları Mağazası",
    hospital: "Hastane",
    insurance_agency: "Sigorta Acentesi",
    jewelry_store: "Kuyumcu",
    laundry: "Çamaşırhane",
    lawyer: "Avukat",
    library: "Kütüphane",
    light_rail_station: "Tramvay İstasyonu",
    liquor_store: "İçki Bayisi",
    local_government_office: "Resmi Daire",
    locksmith: "Çilingir",
    lodging: "Konaklama",
    meal_delivery: "Yemek Servisi",
    meal_takeaway: "Paket Servis",
    mosque: "Cami",
    movie_rental: "Film Kiralama",
    movie_theater: "Sinema",
    moving_company: "Nakliyat Şirketi",
    museum: "Müze",
    night_club: "Gece Kulübü",
    painter: "Boyacı",
    park: "Park",
    parking: "Otopark",
    pet_store: "Evcil Hayvan Mağazası",
    pharmacy: "Eczane",
    physiotherapist: "Fizyoterapist",
    plumber: "Tesisatçı",
    police: "Polis",
    post_office: "Postane",
    primary_school: "İlkokul",
    real_estate_agency: "Emlakçı",
    restaurant: "Restoran",
    roofing_contractor: "Çatı Ustası",
    rv_park: "Karavan Parkı",
    school: "Okul",
    secondary_school: "Ortaokul",
    shoe_store: "Ayakkabı Mağazası",
    shopping_mall: "Alışveriş Merkezi",
    spa: "SPA",
    stadium: "Stadyum",
    storage: "Depo",
    store: "Mağaza",
    subway_station: "Metro İstasyonu",
    supermarket: "Süpermarket",
    synagogue: "Sinagog",
    taxi_stand: "Taksi Durağı",
    tourist_attraction: "Turistik Yer",
    train_station: "Tren İstasyonu",
    transit_station: "Ulaşım İstasyonu",
    travel_agency: "Seyahat Acentesi",
    university: "Üniversite",
    veterinary_care: "Veteriner",
    zoo: "Hayvanat Bahçesi"
  };

  return translations[type.toLowerCase()] || type;
}

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,website,type,email&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Place Details Error:', data);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('Place Details API Error:', error);
    return null;
  }
}

async function searchNearbyPlaces(lat: number, lng: number, radius: number) {
  let allResults = [];
  let nextPageToken = null;

  do {
    const baseUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
    const url = nextPageToken ? `${baseUrl}&pagetoken=${nextPageToken}` : baseUrl;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || 'Places API error');
      }

      if (data.results && data.results.length > 0) {
        const detailedResults = await Promise.all(
          data.results.map(async (place: any) => {
            const details = await getPlaceDetails(place.place_id);
            return {
              placeId: place.place_id,
              name: place.name,
              address: details?.formatted_address || place.vicinity,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              phone: details?.formatted_phone_number || null,
              website: details?.website || null,
              email: details?.email || null,
              types: place.types || []
            };
          })
        );

        allResults.push(...detailedResults);
      }

      nextPageToken = data.next_page_token;
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Places API Error:', error);
      throw new Error('İşletmeler aranırken bir hata oluştu');
    }
  } while (nextPageToken);

  return allResults;
}

export function registerRoutes(app: Express): Server {
  app.post("/api/search", async (req, res) => {
    try {
      const searchData = insertSearchSchema.parse(req.body);
      const search = await storage.createSearch(searchData);

      const places = await searchNearbyPlaces(
        searchData.latitude,
        searchData.longitude,
        searchData.radius
      );

      const results = await storage.saveSearchResults(
        places.map(place => ({
          ...place,
          searchId: search.id
        }))
      );

      res.json({ search, results });
    } catch (error) {
      console.error('Search Error:', error);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/search/:id/results", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const results = await storage.getSearchResults(searchId);
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/search/:id/export", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const results = await storage.getSearchResults(searchId);

      // CSV başlıklarını Türkçe formatında düzenle
      const headers = [
        "Sıra No",
        "İşyeri Adı",
        "Adres",
        "Telefon Numarası",
        "Web Sitesi",
        "E-posta Adresi",
        "İşyeri Kategorileri",
        "Konum (Enlem)",
        "Konum (Boylam)"
      ].join(";");

      // Her sonuç için CSV satırı oluştur
      const rows = results.map((result, index) => {
        // İşyeri tiplerini Türkçe'ye çevir ve düzgün formatta göster
        const types = Array.isArray(result.types) ?
          result.types
            .map(type => translatePlaceType(type))
            .join(', ') : '';

        // Her bir alanı düzenle ve boş değerleri kontrol et
        return [
          index + 1,
          result.name,
          result.address,
          result.phone || '',
          result.website || '',
          result.email || '',
          types,
          result.latitude,
          result.longitude
        ].map(value => `"${value}"`).join(";");
      }).join('\n');

      const csv = `${headers}\n${rows}`;

      // CSV dosya adını tarih ile birlikte oluştur
      const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      const fileName = `isletmeler_${date}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(csv);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}