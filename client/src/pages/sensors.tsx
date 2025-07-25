import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SensorDashboard } from "@/components/sensor-dashboard";
import { ArrowLeft, Activity } from "lucide-react";
import { Link } from "wouter";
import type { Location } from "@/lib/types";

export function SensorsPage() {
  const params = useParams();
  const locationId = params.id ? parseInt(params.id, 10) : null;

  // Fetch location details
  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", locationId],
    enabled: !!locationId,
  });

  if (!locationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid Location</h2>
            <p className="text-muted-foreground mb-4">
              No location ID provided for sensor dashboard.
            </p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading location...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Location Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested location could not be found.
            </p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Map
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {location.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  IoT Sensor Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SensorDashboard 
          locationId={locationId} 
          locationName={location.name}
          showMqttConfig={true}
        />
      </div>
    </div>
  );
}