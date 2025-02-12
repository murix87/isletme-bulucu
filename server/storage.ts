import { 
  type Search, 
  type SearchResult, 
  type InsertSearch,
  type InsertSearchResult 
} from "@shared/schema";

export interface IStorage {
  createSearch(search: InsertSearch): Promise<Search>;
  saveSearchResults(results: InsertSearchResult[]): Promise<SearchResult[]>;
  getSearchResults(searchId: number): Promise<SearchResult[]>;
}

export class MemStorage implements IStorage {
  private searches: Map<number, Search>;
  private searchResults: Map<number, SearchResult[]>;
  private currentSearchId: number;
  private currentResultId: number;

  constructor() {
    this.searches = new Map();
    this.searchResults = new Map();
    this.currentSearchId = 1;
    this.currentResultId = 1;
  }

  async createSearch(search: InsertSearch): Promise<Search> {
    const id = this.currentSearchId++;
    const newSearch = {
      id,
      latitude: search.latitude.toString(),
      longitude: search.longitude.toString(),
      radius: search.radius.toString()
    };
    this.searches.set(id, newSearch);
    return newSearch;
  }

  async saveSearchResults(results: InsertSearchResult[]): Promise<SearchResult[]> {
    if (results.length === 0) return [];

    const savedResults = results.map(result => {
      const id = this.currentResultId++;
      return {
        id,
        searchId: result.searchId,
        placeId: result.placeId,
        name: result.name,
        address: result.address,
        phone: result.phone || null,
        website: result.website || null,
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString()
      };
    });

    const searchId = savedResults[0].searchId;
    this.searchResults.set(searchId, savedResults);
    return savedResults;
  }

  async getSearchResults(searchId: number): Promise<SearchResult[]> {
    return this.searchResults.get(searchId) || [];
  }
}

export const storage = new MemStorage();