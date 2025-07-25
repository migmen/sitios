import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSensorSchema, type InsertSensor, type Sensor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Thermometer, 
  Droplets, 
  Users, 
  Volume2, 
  Wind, 
  Activity,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  X
} from "lucide-react";

const sensorTypes = [
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°C" },
  { value: "humidity", label: "Humidity", icon: Droplets, unit: "%" },
  { value: "occupancy", label: "Occupancy", icon: Users, unit: "people" },
  { value: "noise", label: "Noise Level", icon: Volume2, unit: "dB" },
  { value: "air_quality", label: "Air Quality", icon: Wind, unit: "AQI" },
  { value: "light", label: "Light Level", icon: Activity, unit: "lux" },
];

interface SensorEditorProps {
  sensor: Sensor;
  onUpdate: () => void;
  onDelete: () => void;
}

export function SensorEditor({ sensor, onUpdate, onDelete }: SensorEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<InsertSensor>({
    resolver: zodResolver(insertSensorSchema),
    defaultValues: {
      locationId: sensor.locationId,
      sensorId: sensor.sensorId,
      name: sensor.name,
      type: sensor.type,
      unit: sensor.unit || "",
      isActive: sensor.isActive,
      metadata: sensor.metadata as any,
    },
  });

  const updateSensorMutation = useMutation({
    mutationFn: async (data: Partial<InsertSensor>) => {
      const response = await fetch(`/api/sensors/${sensor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update sensor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Sensor updated successfully",
      });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sensor",
        variant: "destructive",
      });
    },
  });

  const deleteSensorMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sensors/${sensor.id}`, {
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
      onDelete();
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
    updateSensorMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  const handleDelete = () => {
    if (isDeleting) {
      deleteSensorMutation.mutate();
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000); // Reset after 3 seconds
    }
  };

  const handleSensorTypeChange = (type: string) => {
    const sensorType = sensorTypes.find(s => s.value === type);
    if (sensorType) {
      form.setValue("unit", sensorType.unit);
    }
  };

  const toggleStatus = () => {
    updateSensorMutation.mutate({ isActive: !sensor.isActive });
  };

  const getSensorIcon = (type: string) => {
    const sensorType = sensorTypes.find(s => s.value === type);
    return sensorType?.icon || Activity;
  };

  const Icon = getSensorIcon(sensor.type);

  if (isEditing) {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-blue-600 dark:text-blue-400">
                  Editing: {sensor.name}
                </h4>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateSensorMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sensorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sensor ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                            <SelectValue />
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
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium">{sensor.name}</h4>
              <p className="text-sm text-muted-foreground font-mono">{sensor.sensorId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleStatus}
              disabled={updateSensorMutation.isPending}
            >
              {sensor.isActive ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Inactive
                </Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteSensorMutation.isPending}
              className={isDeleting ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : ""}
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting && <span className="ml-1 text-xs">Confirm?</span>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 capitalize">{sensor.type.replace('_', ' ')}</span>
          </div>
          {sensor.unit && (
            <div>
              <span className="text-muted-foreground">Unit:</span>
              <span className="ml-2 font-mono">{sensor.unit}</span>
            </div>
          )}
          {sensor.lastPing && (
            <div>
              <span className="text-muted-foreground">Last Ping:</span>
              <span className="ml-2">
                {new Date(sensor.lastPing).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}