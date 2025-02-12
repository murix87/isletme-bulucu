import { Card } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import { SearchForm } from "@/components/search-form";
import { ResultsList } from "@/components/results-list";
import { useState } from "react";
import type { SearchResult } from "@shared/schema";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          İşletme Bulucu
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Card className="p-4 mb-4">
              <SearchForm 
                selectedLocation={selectedLocation}
                onSearch={async (radius) => {
                  if (!selectedLocation) return;
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        latitude: selectedLocation.lat,
                        longitude: selectedLocation.lng,
                        radius
                      })
                    });
                    const data = await res.json();
                    setResults(data.results);
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </Card>
            <ResultsList results={results} isLoading={isLoading} />
          </div>

          <Card className="p-4">
            <MapView
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              results={results}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}