import { useMemo, useState } from "react";
import { Link } from "wouter";
import { SearchInput } from "./search-input";
import { LocationCard } from "./location-card";
import { AuthToggle } from "./auth-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllCategories, CategoryEmoji } from "@/lib/category-mapping";
import { Sun, Moon, RefreshCw, Plus } from "lucide-react";
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
  isMobile?: boolean;
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
  isMobile = false,
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
      <div className="w-full md:w-80 bg-background flex flex-col relative z-10">
        <div className="p-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20" />
            ))}
          </div>
        </div>
        <div className="flex-1 px-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-96 bg-background flex flex-col relative z-10 h-full border-r border-border">
      {/* Header Section - show on desktop, hide on mobile */}
      <div className={`p-4 sm:p-6 pb-3 sm:pb-4`}>
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-sm">
              <CategoryEmoji category="recreation" width={18} />
            </div>
            <h1 className="text-xl font-bold text-foreground">matt's recs</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <Link href="/add-location">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            
            {isDevelopment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Authentication Toggle */}
        <AuthToggle />

        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search spots..."
          className="mb-4"
        />
        
        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 6).map((category) => (
              <Badge
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                className={`text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 touch-manipulation min-h-[28px] ${
                  category.isSubcategory ? 'opacity-75' : ''
                } ${
                  selectedCategory === category.name 
                    ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                    : 'bg-background hover:bg-muted/60 hover:border-border/80 active:bg-muted/80'
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <span className="mr-1">
                  <CategoryEmoji category={category.parentCategory || category.name} subtype={category.isSubcategory ? category.name : undefined} width={14} />
                </span>
                <span className="truncate max-w-[80px] sm:max-w-none">{category.name}</span>
                <span className="ml-1 opacity-60 hidden sm:inline">({category.count})</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="text-sm text-muted-foreground">
          {filteredLocations.length} {filteredLocations.length === 1 ? 'spot' : 'spots'} 
          {selectedCategory && ` in ${selectedCategory}`}
        </div>
      </div>

      {/* Location Cards */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 sidebar-scroll">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              <CategoryEmoji category="tourism" width={40} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No spots found</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {searchQuery || selectedCategory
                ? "Try adjusting your filters or search terms"
                : "Move the map around San Francisco to discover new places"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredLocations.map((location) => (
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