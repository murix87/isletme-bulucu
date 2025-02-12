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

    const savedResults: SearchResult[] = results.map(result => ({
      id: this.currentResultId++,
      searchId: Number(result.searchId),
      placeId: result.placeId,
      name: result.name,
      address: result.address,
      phone: result.phone || null,
      website: result.website || null,
      email: result.email || null,
      types: result.types || null,
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString()
    }));

    // Use the first result's searchId for storage
    const searchId = savedResults[0].searchId;
    this.searchResults.set(searchId, savedResults);

    console.log(`Saved ${savedResults.length} results for searchId: ${searchId}`);
    return savedResults;
  }

  async getSearchResults(searchId: number): Promise<SearchResult[]> {
    const results = this.searchResults.get(searchId) || [];
    console.log(`Retrieved ${results.length} results for searchId: ${searchId}`);
    return results;
  }
}

export const storage = new MemStorage();