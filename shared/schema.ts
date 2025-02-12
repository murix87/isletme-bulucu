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
  latitude: numeric("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
});

// Convert string values to numbers in the schema
export const insertSearchSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number(),
});

export const insertSearchResultSchema = createInsertSchema(searchResults);

export type Search = typeof searches.$inferSelect;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;