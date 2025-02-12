import { pgTable, text, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
  radius: numeric("radius", { precision: 10, scale: 2 }).notNull(),
});

export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  searchId: serial("search_id").references(() => searches.id),
  placeId: text("place_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  website: text("website"),
  types: text("types").array(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
});

// Özel arama şeması - frontend'den gelen number değerleri için
export const insertSearchSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().min(100).max(200000),
});

export type Search = typeof searches.$inferSelect;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type InsertSearchResult = typeof searchResults.$inferInsert;