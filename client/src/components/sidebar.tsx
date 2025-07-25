import { useMemo, useState } from "react";
import { SearchInput } from "./search-input";
import { LocationCard } from "./location-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllCategories, getCategoryEmoji } from "@/lib/category-mapping";
import { Sun, Moon, RefreshCw } from "lucide-react";
import type { Location } from "@/lib/types";

interface SidebarProps {
  locations: Location[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  allLocations: Location[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  isDevelopment: boolean;
  onSync: () => void;
  isSyncing: boolean;
}

export function Sidebar({
  locations,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationSelect,
  allLocations,
  theme,
  toggleTheme,
  isDevelopment,
  onSync,
  isSyncing,
}: SidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all categories with emojis and subcategories
  const categories = useMemo(() => {
    return getAllCategories(allLocations);
  }, [allLocations]);

  // Filter locations based on selected category/subcategory
  const filteredLocations = useMemo(() => {
    if (!selectedCategory) return locations;
    
    return locations.filter(location => {
      // Check if location matches the selected category or subcategory
      return location.type === selectedCategory || location.subtype === selectedCategory;
    });
  }, [locations, selectedCategory]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  if (isLoading) {
    return (
      <div className="w-full md:w-96 bg-background border-r border-border flex flex-col relative z-40">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-full mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-4 w-32 mb-3" />
        </div>
        <div className="flex-1 space-y-4 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex space-x-3">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-96 bg-background border-r border-border flex flex-col relative z-40">
      {/* Search Section */}
      <div className="p-4 border-b border-border">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search places..."
          className="mb-3"
        />
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((category) => (
            <Badge
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "secondary"}
              className={`category-pill text-xs font-medium cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground ${
                category.isSubcategory ? 'ml-2 border-dashed' : ''
              } ${
                selectedCategory === category.name 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => handleCategoryClick(category.name)}
            >
              {category.emoji} {category.name} ({category.count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {locations.length} {locations.length === 1 ? 'place' : 'places'} found
          </span>
          <span className="text-xs text-muted-foreground">in current view</span>
        </div>
      </div>

      {/* Location Cards */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {locations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="text-lg font-medium text-foreground mb-2">No places found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? "Try adjusting your search or move the map to explore different areas."
                : "Move the map around to discover places in San Francisco, or sync with Notion to load your saved locations."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                isSelected={selectedLocation?.id === location.id}
                onClick={() => onLocationSelect(location)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
