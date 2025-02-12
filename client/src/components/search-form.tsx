import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MapPin } from "lucide-react";

interface SearchFormProps {
  selectedLocation: google.maps.LatLngLiteral | null;
  onSearch: (radius: number) => void;
}

export function SearchForm({ selectedLocation, onSearch }: SearchFormProps) {
  const [radius, setRadius] = useState("1000");

  return (
    <div className="space-y-4">
      <div>
        <Label>Seçili Konum</Label>
        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {selectedLocation ? (
            <span>
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </span>
          ) : (
            <span>Konum seçmek için haritaya tıklayın</span>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="radius">Arama Yarıçapı (metre)</Label>
        <Input
          id="radius"
          type="number"
          min="100"
          max="50000"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="mt-1"
        />
      </div>

      <Button 
        onClick={() => onSearch(Number(radius))}
        disabled={!selectedLocation}
        className="w-full"
      >
        İşletmeleri Ara
      </Button>
    </div>
  );
}