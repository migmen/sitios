import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapContainer } from "@/components/map-container";
import { Sidebar } from "@/components/sidebar-new";
import { AuthToggle } from "@/components/auth-toggle";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, AlertCircle, RefreshCw, Menu, X, Info, Plus } from "lucide-react";
import { Emoji } from "react-apple-emojis";
import { useToast } from "@/hooks/use-toast";
import type { Location } from "@/lib/types";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Check if we're in development (no REPLIT_DEPLOYMENT env var)
  const isDevelopment = !import.meta.env.VITE_REPLIT_DEPLOYMENT;

  // Fetch all locations
  const { data: allLocations = [], isLoading, error } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    retry: 1,
  });

  // Sync from Notion mutation (only in development)
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync-notion");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync from Notion",
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };



  // Filter locations based on search query and optionally map bounds
  const filteredLocations = allLocations.filter((location) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        location.name.toLowerCase().includes(query) ||
        location.description.toLowerCase().includes(query) ||
        location.type.toLowerCase().includes(query) ||
        location.subtype.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // On mobile or when sidebar is open, show all locations for browsing
    // Only apply bounds filter on desktop when sidebar is closed
    if (window.innerWidth >= 768 && !isSidebarOpen && mapBounds && location.latitude && location.longitude) {
      return (
        location.latitude <= mapBounds.north &&
        location.latitude >= mapBounds.south &&
        location.longitude <= mapBounds.east &&
        location.longitude >= mapBounds.west
      );
    }

    // Show all locations that match search criteria
    return true;
  });

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    // Close sidebar on mobile when location is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Minimum swipe distance to trigger close
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };



  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Error Loading Locations</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load locations"}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden">
      {/* Mobile header with menu button */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[1010] bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white dark:bg-black rounded-full flex items-center justify-center">
              <span className="text-sm">🎯</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">recs</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/add-location">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            
            {isDevelopment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              {isSidebarOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 pt-16 md:pt-0 h-full">
        {/* Sidebar - responsive with overlay on mobile */}
        <div 
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            transition-transform duration-300 ease-in-out
            fixed md:relative
            top-16 md:top-0
            left-0
            h-[calc(100vh-4rem)] md:h-full
            z-[1020]
            w-[90vw] max-w-sm md:w-80
            bg-background
            border-r border-border
            ${isSidebarOpen ? 'shadow-xl md:shadow-none' : ''}
          `}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Sidebar
            locations={filteredLocations}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            allLocations={allLocations}
            theme={theme}
            toggleTheme={toggleTheme}
            isDevelopment={isDevelopment}
            onSync={handleSync}
            isSyncing={syncMutation.isPending}
            isMobile={false}
          />
        </div>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[1030] md:hidden touch-manipulation"
            onClick={toggleSidebar}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault();
              toggleSidebar();
            }}
          />
        )}

        {/* Map Container */}
        <div className="flex-1 h-full">
          <MapContainer
            locations={filteredLocations}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            onBoundsChange={setMapBounds}
            theme={theme}
          />
        </div>
      </div>

      {/* About pill - bottom right */}
      <button
        onClick={() => setShowAbout(true)}
        className="fixed bottom-4 right-4 z-[1040] bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/95 transition-all duration-200 shadow-lg"
      >
        <Info className="w-3 h-3 mr-1 inline" />
        About
      </button>

      {/* About modal */}
      {showAbout && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[1050]"
            onClick={() => setShowAbout(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1060] bg-background border border-border rounded-2xl p-6 max-w-sm w-[90vw] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white dark:bg-black rounded-full flex items-center justify-center">
                  <Emoji name="direct-hit" width={14} />
                </div>
                <h3 className="font-semibold text-foreground">About</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAbout(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Made by{" "}
              <a 
                href="https://x.com/mattppal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground font-medium hover:underline"
              >
                Matt
              </a>{" "}
              to share his favorite spots in SF with friends. Built on Replit and Notion.
            </p>
            <Button
              onClick={() => setShowAbout(false)}
              className="w-full"
              size="sm"
            >
              Close
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
