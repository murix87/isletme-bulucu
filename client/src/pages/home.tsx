import { Card } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import { SearchForm } from "@/components/search-form";
import { ResultsList } from "@/components/results-list";
import { useState } from "react";
import type { SearchResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (radius: number) => {
    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen haritadan bir konum seçin"
      });
      return;
    }

    setIsLoading(true);
    setResults([]); // Önceki sonuçları temizle

    const searchData = {
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      radius: radius
    };

    try {
      console.log("Arama parametreleri:", searchData);

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Arama yapılırken bir hata oluştu');
      }

      console.log("Arama sonuçları:", data);

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Sunucudan geçersiz yanıt alındı');
      }

      setResults(data.results);

      if (data.results.length === 0) {
        toast({
          title: "Bilgi",
          description: "Bu bölgede işletme bulunamadı"
        });
      } else {
        toast({
          title: "Başarılı",
          description: `${data.results.length} işletme bulundu`
        });
      }
    } catch (error) {
      console.error('Arama hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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
                onSearch={handleSearch}
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