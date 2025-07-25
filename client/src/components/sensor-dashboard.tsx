import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSensorSchema, type InsertSensor, type LocationWithSensors } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Thermometer, 
  Droplets, 
  Users, 
  Volume2, 
  Wind, 
  Plus, 
  Activity, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Settings,
  LogIn
} from "lucide-react";
import { MqttConfigManager } from "./mqtt-config-manager-new";
import { formatDistanceToNow } from "date-fns";

interface SensorDashboardProps {
  locationId: number;
  locationName: string;
  showMqttConfig?: boolean;
}

const sensorTypes = [
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°C" },
  { value: "humidity", label: "Humidity", icon: Droplets, unit: "%" },
  { value: "occupancy", label: "Occupancy", icon: Users, unit: "people" },
  { value: "noise", label: "Noise Level", icon: Volume2, unit: "dB" },
  { value: "air_quality", label: "Air Quality", icon: Wind, unit: "AQI" },
  { value: "light", label: "Light Level", icon: Activity, unit: "lux" },
];

function getSensorIcon(type: string) {
  const sensorType = sensorTypes.find(s => s.value === type);
  return sensorType?.icon || Activity;
}

function getSensorColor(type: string, value: number) {
  switch (type) {
    case "temperature":
      if (value < 18) return "text-blue-500";
      if (value > 25) return "text-red-500";
      return "text-green-500";
    case "humidity":
      if (value < 30 || value > 70) return "text-orange-500";
      return "text-green-500";
    case "air_quality":
      if (value > 100) return "text-red-500";
      if (value > 50) return "text-orange-500";
      return "text-green-500";
    case "noise":
      if (value > 70) return "text-red-500";
      if (value > 50) return "text-orange-500";
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}

function getValueProgress(type: string, value: number) {
  switch (type) {
    case "temperature":
      return Math.min(Math.max((value + 10) / 50 * 100, 0), 100);
    case "humidity":
      return Math.min(value, 100);
    case "air_quality":
      return Math.min(value / 200 * 100, 100);
    case "noise":
      return Math.min(value / 100 * 100, 100);
    case "occupancy":
      return Math.min(value / 100 * 100, 100);
    default:
      return 50;
  }
}

export function SensorDashboard({ locationId, locationName, showMqttConfig = true }: SensorDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: locationWithSensors, isLoading } = useQuery<LocationWithSensors>({
    queryKey: [`/api/locations/${locationId}/sensors`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const form = useForm<InsertSensor>({
    resolver: zodResolver(insertSensorSchema),
    defaultValues: {
      locationId,
      sensorId: "",
      name: "",
      type: "",
      unit: "",
      isActive: true,
      metadata: null,
    },
  });

  const addSensorMutation = useMutation({
    mutationFn: async (data: InsertSensor) => {
      const response = await fetch("/api/sensors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add sensor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Sensor added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${locationId}/sensors`] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add sensor",
        variant: "destructive",
      });
    },
  });

  const deleteSensorMutation = useMutation({
    mutationFn: async (sensorId: number) => {
      const response = await fetch(`/api/sensors/${sensorId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sensor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Sensor deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${locationId}/sensors`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sensor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSensor) => {
    addSensorMutation.mutate(data);
  };

  const handleSensorTypeChange = (type: string) => {
    const sensorType = sensorTypes.find(s => s.value === type);
    if (sensorType) {
      form.setValue("unit", sensorType.unit);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            IoT Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading sensors...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sensors = locationWithSensors?.sensors || [];

  return (
    <div className="space-y-6">
      {showMqttConfig && (
        <MqttConfigManager locationId={locationId} locationName={locationName} />
      )}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            IoT Sensors
            <Badge variant="secondary">{sensors.length}</Badge>
          </CardTitle>
          {isAuthenticated ? (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sensor
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sensor</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sensorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sensor ID</FormLabel>
                        <FormControl>
                          <Input placeholder="temp-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Temperature Sensor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleSensorTypeChange(value);
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sensor type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sensorTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="°C" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={addSensorMutation.isPending} className="flex-1">
                      {addSensorMutation.isPending ? "Adding..." : "Add Sensor"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/api/login"}>
              <LogIn className="w-4 h-4 mr-2" />
              Login to Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sensors.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No sensors configured for {locationName}</p>
            <p className="text-sm text-muted-foreground">
              Add sensors to monitor real-time data like temperature, occupancy, or air quality.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sensors.map((sensor) => {
              const Icon = getSensorIcon(sensor.type);
              const latestReading = sensor.readings[0];
              const isOnline = sensor.lastPing && 
                new Date().getTime() - new Date(sensor.lastPing).getTime() < 300000; // 5 minutes

              return (
                <Card key={sensor.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{sensor.name}</h4>
                          <p className="text-sm text-muted-foreground">{sensor.sensorId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAuthenticated && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSensorMutation.mutate(sensor.id)}
                            disabled={deleteSensorMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {isOnline ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Offline
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSensorMutation.mutate(sensor.id)}
                          disabled={deleteSensorMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {latestReading ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">
                            <span className={getSensorColor(sensor.type, latestReading.value)}>
                              {latestReading.value}
                            </span>
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              {sensor.unit}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(latestReading.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <Progress 
                          value={getValueProgress(sensor.type, latestReading.value)} 
                          className="h-2"
                        />
                        
                        {sensor.readings.length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {sensor.readings.length} readings available
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No readings available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}