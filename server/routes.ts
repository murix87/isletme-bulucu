import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";

async function searchNearbyPlaces(lat: number, lng: number, radius: number) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Places API error');
    }

    return data.results.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.formatted_phone_number || null,
      website: place.website || null
    }));
  } catch (error) {
    console.error('Places API Error:', error);
    throw new Error('İşletmeler aranırken bir hata oluştu');
  }
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

  const httpServer = createServer(app);
  return httpServer;
}