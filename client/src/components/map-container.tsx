import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, LocateFixed, ExternalLink } from "lucide-react";
import { getCategoryEmoji, CategoryEmoji } from "@/lib/category-mapping";
import type { Location } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Fix for default markers not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon with emoji using same approach as sidebar
const createCustomIcon = (location: Location, isSelected: boolean = false) => {
  const emoji = getCategoryEmoji(location.type, location.subtype);
  
  return L.divIcon({
    html: `
      <div class="map-marker-icon flex items-center justify-center w-8 h-8 bg-gray-800 dark:bg-gray-200 rounded-full border-2 border-white dark:border-black shadow-lg text-sm transition-all duration-200 cursor-pointer ${isSelected ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105 hover:shadow-xl active:scale-95'}">
        <span style="font-size: 16px; line-height: 1;">${emoji}</span>
      </div>
    `,
    className: "custom-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapEventsProps {
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
  selectedLocation: Location | null;
}

function MapEvents({ onBoundsChange, selectedLocation }: MapEventsProps) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });

  // Center map on selected location
  useEffect(() => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 16);
    }
  }, [selectedLocation, map]);

  return null;
}

interface MapContainerProps {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
  theme: "light" | "dark";
}

export function MapContainer({
  locations,
  selectedLocation,
  onLocationSelect,
  onBoundsChange,
  theme,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const attribution = '';

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          if (mapRef.current) {
            mapRef.current.setView(coords, 15);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  };

  const getPriceDisplay = (price: number) => {
    if (price === 0) return { text: "Free", color: "text-emerald-600" };
    if (price === 1) return { text: "$", color: "text-green-600" };
    if (price === 2) return { text: "$$", color: "text-amber-600" };
    if (price === 3) return { text: "$$$", color: "text-red-600" };
    return { text: `${"$".repeat(price)}`, color: "text-red-700" };
  };

  const formatLastVisited = (lastVisited: string | null | undefined) => {
    if (!lastVisited) return "Never visited";
    
    const date = new Date(lastVisited);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleGoogleMapsClick = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="flex-1 relative h-full w-full">
      <LeafletMapContainer
        center={[37.7749, -122.4194]}
        zoom={13}
        className="w-full h-full absolute inset-0"
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer
          url={tileUrl}
          attribution={attribution}
          maxZoom={20}
        />
        
        <MapEvents 
          onBoundsChange={onBoundsChange}
          selectedLocation={selectedLocation}
        />

        {/* Location markers */}
        {locations
          .filter(location => location.latitude && location.longitude)
          .map((location) => {
            const isSelected = selectedLocation?.id === location.id;
            return (
              <Marker
                key={location.id}
                position={[location.latitude!, location.longitude!]}
                icon={createCustomIcon(location, isSelected)}
                eventHandlers={{
                  click: () => onLocationSelect(location),
                }}
              >
                <Popup>
                  <div className="p-3 sm:p-4 min-w-[240px] sm:min-w-[280px] max-w-[280px] sm:max-w-[320px]">
                    {/* Header with icon and title */}
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      {location.photo ? (
                        <img
                          src={location.photo}
                          alt={location.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                          <CategoryEmoji category={location.type} subtype={location.subtype} width={20} />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate pr-1 sm:pr-2">
                            {location.name}
                          </h3>
                          <span className={`text-xs font-medium ${getPriceDisplay(location.price).color} flex-shrink-0`}>
                            {getPriceDisplay(location.price).text}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            <span className="mr-1">
                              <CategoryEmoji category={location.type} subtype={location.subtype} width={12} />
                            </span>
                            {location.subtype || location.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-2 sm:mb-3 leading-relaxed">
                      {location.description}
                    </p>
                    
                    {/* Footer with last visited and directions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 truncate mr-2">
                        {formatLastVisited(location.lastVisited)}
                      </span>
                      
                      <button
                        onClick={() => handleGoogleMapsClick(location.address)}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Directions
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `
                <div class="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg">
                  <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              `,
              className: "user-location-marker",
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900">Your Location</h3>
              </div>
            </Popup>
          </Marker>
        )}
      </LeafletMapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1001] space-y-2">
        {/* Zoom Controls */}
        <div className="bg-background rounded-lg shadow-lg border border-border overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-none border-b border-border"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-none"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Current Location */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleLocateUser}
          className="w-10 h-10 shadow-lg"
        >
          <LocateFixed className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
