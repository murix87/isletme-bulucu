import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  app.post("/api/search", async (req, res) => {
    try {
      const searchData = insertSearchSchema.parse(req.body);
      const search = await storage.createSearch(searchData);

      // Call Google Places API here with the search parameters
      // For now, we'll return mock data
      const mockResults = [{
        searchId: search.id,
        placeId: "mock-1",
        name: "Mock Business",
        address: "123 Mock St",
        phone: "555-0123",
        website: "https://mock.com",
        latitude: searchData.latitude.toString(),
        longitude: searchData.longitude.toString()
      }];

      const results = await storage.saveSearchResults(mockResults);
      res.json({ search, results });
    } catch (error) {
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