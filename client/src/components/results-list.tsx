import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { SearchResult } from "@shared/schema";
import { Building2, Phone, Globe, Mail, Tag, Download } from "lucide-react";

interface ResultsListProps {
  results: SearchResult[];
  isLoading: boolean;
}

export function ResultsList({ results = [], isLoading }: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  const handleExport = () => {
    if (results.length > 0) {
      const searchId = results[0].searchId;
      window.location.href = `/api/search/${searchId}/export`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Sonuçlar ({results.length})</h2>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Excel olarak indir
        </Button>
      </div>

      {results.map((result, index) => (
        <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
              {index + 1}
            </div>
            <div className="space-y-2 flex-grow">
              <h3 className="font-semibold text-lg">{result.name}</h3>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{result.address}</span>
              </div>

              {result.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{result.phone}</span>
                </div>
              )}

              {result.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={result.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Web Sitesi
                  </a>
                </div>
              )}

              {result.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>{result.email}</span>
                </div>
              )}

              {result.types && result.types.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {result.types.map((type, i) => (
                      <span 
                        key={i}
                        className="bg-secondary px-2 py-1 rounded-md text-xs"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}