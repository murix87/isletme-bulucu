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
    const newSearch = { ...search, id };
    this.searches.set(id, newSearch);
    return newSearch;
  }

  async saveSearchResults(results: InsertSearchResult[]): Promise<SearchResult[]> {
    if (results.length === 0) return [];

    const savedResults = results.map(result => {
      const id = this.currentResultId++;
      if (!result.searchId) throw new Error("searchId is required");
      return { 
        ...result, 
        id,
        // Ensure all required fields are present with correct types
        phone: result.phone || null,
        website: result.website || null
      };
    });

    const searchId = savedResults[0].searchId;
    if (typeof searchId === 'number') {
      this.searchResults.set(searchId, savedResults);
    }
    return savedResults;
  }

  async getSearchResults(searchId: number): Promise<SearchResult[]> {
    return this.searchResults.get(searchId) || [];
  }
}

export const storage = new MemStorage();