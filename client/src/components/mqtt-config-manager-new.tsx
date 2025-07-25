import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMqttConfigSchema, type InsertMqttConfig, type MqttConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Router, Plus, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MqttConfigManagerProps {
  locationId: number;
  locationName: string;
}

export function MqttConfigManager({ locationId, locationName }: MqttConfigManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<InsertMqttConfig>({
    resolver: zodResolver(insertMqttConfigSchema),
    defaultValues: {
      locationId,
      name: "",
      brokerUrl: "",
      port: 1883,
      clientId: "",
      username: "",
      password: "",
      topicPrefix: "",
      sslEnabled: false,
      isActive: true,
    },
  });

  // Fetch MQTT configs for this location
  const { data: mqttConfigs, isLoading } = useQuery<MqttConfig[]>({
    queryKey: ["/api/mqtt-configs", locationId],
    enabled: !!locationId,
  });

  // Add MQTT config mutation
  const addMqttConfigMutation = useMutation({
    mutationFn: async (newConfig: InsertMqttConfig) => {
      return await apiRequest("POST", "/api/mqtt-configs", newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mqtt-configs", locationId] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "MQTT Configuration Added",
        description: "The MQTT broker configuration has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add MQTT configuration.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    addMqttConfigMutation.mutate(data as InsertMqttConfig);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="w-5 h-5" />
            MQTT Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading MQTT configurations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const configs = mqttConfigs || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Router className="w-5 h-5" />
            MQTT Configuration
            <Badge variant="secondary">{configs.length}</Badge>
          </CardTitle>
          {isAuthenticated ? (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add MQTT Broker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add MQTT Configuration</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Configuration Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Production MQTT Broker" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="brokerUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Broker URL</FormLabel>
                            <FormControl>
                              <Input placeholder="mqtt.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={addMqttConfigMutation.isPending} className="flex-1">
                        {addMqttConfigMutation.isPending ? "Adding..." : "Add Configuration"}
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
              Login to Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <div className="text-center py-8">
            <Router className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No MQTT brokers configured for {locationName}</p>
            <p className="text-sm text-muted-foreground">
              Add MQTT broker configurations to enable real-time sensor data collection.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <Card key={config.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{config.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {config.brokerUrl}:{config.port}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}