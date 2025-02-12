import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";

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
        // İşyeri tiplerini düzgün formatta göster
        const types = Array.isArray(result.types) ? 
          result.types
            .map(type => type.replace(/_/g, ' ').toLowerCase())
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