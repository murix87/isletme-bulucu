import { useEffect, useRef } from "react";
import type { SearchResult } from "@shared/schema";
import { initMap } from "@/lib/maps";

interface MapViewProps {
  selectedLocation: google.maps.LatLngLiteral | null;
  onLocationSelect: (location: google.maps.LatLngLiteral) => void;
  results: SearchResult[];
}

export function MapView({ selectedLocation, onLocationSelect, results }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York
    
    initMap().then(() => {
      const map = new google.maps.Map(mapRef.current!, {
        center: selectedLocation || defaultCenter,
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        onLocationSelect({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });

      mapInstanceRef.current = map;
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    mapInstanceRef.current.setCenter(selectedLocation);
    
    // Clear old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add selected location marker
    const marker = new google.maps.Marker({
      position: selectedLocation,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#1e40af",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#ffffff",
      }
    });
    markersRef.current.push(marker);
  }, [selectedLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old result markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new result markers
    results.forEach((result, index) => {
      const marker = new google.maps.Marker({
        position: { lat: Number(result.latitude), lng: Number(result.longitude) },
        map: mapInstanceRef.current!,
        label: (index + 1).toString(),
        title: result.name
      });
      markersRef.current.push(marker);
    });
  }, [results]);

  return (
    <div ref={mapRef} className="w-full h-[600px] rounded-lg" />
  );
}
