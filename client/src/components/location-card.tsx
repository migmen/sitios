import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryEmoji } from "@/lib/category-mapping";
import { ExternalLink, Activity, Edit, LogIn } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Location } from "@/lib/types";

interface LocationCardProps {
  location: Location;
  isSelected: boolean;
  onClick: () => void;
}

export function LocationCard({ location, isSelected, onClick }: LocationCardProps) {
  const { isAuthenticated } = useAuth();
  const getPriceDisplay = (price: number) => {
    if (price === 0) return { text: "Free", color: "text-emerald-600 dark:text-emerald-400" };
    if (price === 1) return { text: "$", color: "text-green-600 dark:text-green-400" };
    if (price === 2) return { text: "$$", color: "text-amber-600 dark:text-amber-400" };
    if (price === 3) return { text: "$$$", color: "text-red-600 dark:text-red-400" };
    return { text: `${"$".repeat(price)}`, color: "text-red-700 dark:text-red-300" };
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

  const handleGoogleMapsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleSensorsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
  };

  const priceInfo = getPriceDisplay(location.price);

  return (
    <div
      className={`rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 border touch-manipulation ${
        isSelected 
          ? 'bg-primary/10 border-primary/30 shadow-sm' 
          : 'bg-card border-border hover:bg-muted/30 hover:border-border/60 active:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Icon/Photo */}
        {location.photo ? (
          <img
            src={location.photo}
            alt={location.name}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-xl flex-shrink-0">
            <CategoryEmoji category={location.type} subtype={location.subtype} width={20} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate pr-2">
              {location.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`text-xs font-medium ${priceInfo.color}`}>
                {priceInfo.text}
              </span>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2.5">
            {location.description}
          </p>
          
          {/* Category and Subtype */}
          <div className="flex items-center gap-2 mb-2.5">
            <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto">
              <span className="mr-1">
                <CategoryEmoji category={location.type} subtype={location.subtype} width={12} />
              </span>
              {location.subtype || location.type}
            </Badge>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatLastVisited(location.lastVisited)}
            </span>
            
            <div className="flex items-center gap-1">
              <Link href={`/sensors/${location.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSensorsClick}
                  className="h-6 px-2 text-xs hover:bg-primary/10 touch-manipulation"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Sensors</span>
                  <span className="sm:hidden">IoT</span>
                </Button>
              </Link>
              
              {isAuthenticated && (
                <Link href={`/add-location?edit=${location.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSensorsClick}
                    className="h-6 px-2 text-xs hover:bg-primary/10 touch-manipulation"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                </Link>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoogleMapsClick}
                className="h-6 px-2 text-xs hover:bg-primary/10 touch-manipulation"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Directions</span>
                <span className="sm:hidden">Dir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
