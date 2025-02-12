import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,website,type&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;

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

function generateGridPoints(center: { lat: number; lng: number }, radius: number): Array<{ lat: number; lng: number }> {
  const gridPoints: Array<{ lat: number; lng: number }> = [];
  const gridSize = Math.ceil(radius / 100); // Her 100 metrede bir nokta
  const latOffset = 0.001; // Yaklaşık 100 metre
  const lngOffset = 0.001; // Yaklaşık 100 metre

  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      const lat = center.lat + (i * latOffset);
      const lng = center.lng + (j * lngOffset);

      // Merkeze olan uzaklığı hesapla
      const distance = Math.sqrt(Math.pow(i * 100, 2) + Math.pow(j * 100, 2));
      if (distance <= radius) {
        gridPoints.push({ lat, lng });
      }
    }
  }

  return gridPoints;
}

async function searchNearbyPlaces(centerLat: number, centerLng: number, radius: number) {
  const center = { lat: centerLat, lng: centerLng };
  const gridPoints = generateGridPoints(center, radius);
  const seenPlaceIds = new Set<string>();
  let allResults: any[] = [];

  console.log(`Generated ${gridPoints.length} search points for radius ${radius}m`);

  for (const point of gridPoints) {
    try {
      // Her nokta için küçük bir yarıçap kullan
      const searchRadius = Math.min(200, radius);
      console.log(`Searching at point (${point.lat}, ${point.lng}) with radius ${searchRadius}m`);

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${point.lat},${point.lng}&radius=${searchRadius}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'ZERO_RESULTS') {
        continue;
      }

      if (data.status !== 'OK') {
        console.error('Places API Error:', data);
        continue;
      }

      // Yeni yerler için detayları al
      const newPlaces = data.results.filter((place: any) => !seenPlaceIds.has(place.place_id));

      if (newPlaces.length > 0) {
        console.log(`Found ${newPlaces.length} new places at current point`);

        const detailedResults = await Promise.all(
          newPlaces.map(async (place: any) => {
            seenPlaceIds.add(place.place_id);
            const details = await getPlaceDetails(place.place_id);
            return {
              placeId: place.place_id,
              name: place.name,
              address: details?.formatted_address || place.vicinity,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              phone: details?.formatted_phone_number || null,
              website: details?.website || null,
              types: place.types || []
            };
          })
        );

        allResults.push(...detailedResults);
        console.log(`Total unique places found: ${allResults.length}`);
      }

      // API limitlerine uymak için bekle
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('Error searching at point:', point, error);
      continue;
    }
  }

  console.log(`Search completed. Total results: ${allResults.length}`);
  return allResults;
}

export function registerRoutes(app: Express): Server {
  app.post("/api/search", async (req, res) => {
    try {
      const searchData = insertSearchSchema.parse(req.body);
      console.log('Creating search with data:', searchData);

      const search = await storage.createSearch(searchData);
      console.log('Search created:', search);

      const places = await searchNearbyPlaces(
        searchData.latitude,
        searchData.longitude,
        searchData.radius
      );

      console.log(`Found ${places.length} places, saving to storage...`);

      const results = await storage.saveSearchResults(
        places.map(place => ({
          ...place,
          searchId: search.id
        }))
      );

      console.log(`Saved ${results.length} results to storage`);
      res.json({ results });
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