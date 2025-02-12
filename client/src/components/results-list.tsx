import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResult } from "@shared/schema";
import { Building2, Phone, Globe } from "lucide-react";

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

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
              {index + 1}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{result.name}</h3>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{result.address}</span>
              </div>

              {result.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{result.phone}</span>
                </div>
              )}

              {result.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
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
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}