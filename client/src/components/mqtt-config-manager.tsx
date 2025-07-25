import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMqttConfigSchema, type InsertMqttConfig, type MqttConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Router,
  Plus, 
  Edit,
  Trash2,
  Settings,
  Wifi,
  WifiOff,
  Shield,
  ShieldOff,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  LogIn
} from "lucide-react";

interface MqttConfigManagerProps {
  locationId: number;
  locationName: string;
}

export function MqttConfigManager({ locationId, locationName }: MqttConfigManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MqttConfig | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const { data: mqttConfigs, isLoading } = useQuery<MqttConfig[]>({
    queryKey: [`/api/locations/${locationId}/mqtt-configs`],
  });

  const form = useForm<InsertMqttConfig>({
    resolver: zodResolver(insertMqttConfigSchema),
    defaultValues: {
      locationId,
      name: "",
      brokerUrl: "",
      port: 1883,
      username: "",
      password: "",
      clientId: "",
      topicPrefix: "sensors",
      isActive: true,
      sslEnabled: false,
      metadata: null,
    },
  });

  const addMqttConfigMutation = useMutation({
    mutationFn: async (data: InsertMqttConfig) => {
      const response = await fetch("/api/mqtt-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add MQTT configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "MQTT configuration added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${locationId}/mqtt-configs`] });
      setIsAddDialogOpen(false);
      setEditingConfig(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add MQTT configuration",
        variant: "destructive",
      });
    },
  });

  const updateMqttConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMqttConfig> }) => {
      const response = await fetch(`/api/mqtt-configs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update MQTT configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "MQTT configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${locationId}/mqtt-configs`] });
      setEditingConfig(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update MQTT configuration",
        variant: "destructive",
      });
    },
  });

  const deleteMqttConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/mqtt-configs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete MQTT configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "MQTT configuration deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${locationId}/mqtt-configs`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete MQTT configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMqttConfig) => {
    if (editingConfig) {
      updateMqttConfigMutation.mutate({ id: editingConfig.id, data });
    } else {
      addMqttConfigMutation.mutate(data);
    }
  };

  const handleEdit = (config: MqttConfig) => {
    setEditingConfig(config);
    form.reset({
      locationId: config.locationId,
      name: config.name,
      brokerUrl: config.brokerUrl,
      port: config.port,
      username: config.username || "",
      password: config.password || "",
      clientId: config.clientId || "",
      topicPrefix: config.topicPrefix,
      isActive: config.isActive,
      sslEnabled: config.sslEnabled,
      metadata: config.metadata as any,
    });
    setIsAddDialogOpen(true);
  };

  const handleCancel = () => {
    setIsAddDialogOpen(false);
    setEditingConfig(null);
    form.reset();
  };

  const togglePasswordVisibility = (configId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const toggleConfigStatus = (config: MqttConfig) => {
    updateMqttConfigMutation.mutate({
      id: config.id,
      data: { isActive: !config.isActive }
    });
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
                    {/* Form content will be here */}
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
      
      {isAuthenticated && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? "Edit MQTT Configuration" : "Add MQTT Configuration"}
                </DialogTitle>
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

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1883" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 1883)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="sensor-client-001" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="topicPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic Prefix</FormLabel>
                          <FormControl>
                            <Input placeholder="sensors" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="mqtt_user" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password (Optional)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="sslEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>SSL/TLS Enabled</FormLabel>
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
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={addMqttConfigMutation.isPending || updateMqttConfigMutation.isPending} 
                      className="flex-1"
                    >
                      {(addMqttConfigMutation.isPending || updateMqttConfigMutation.isPending) 
                        ? "Saving..." 
                        : editingConfig ? "Update Configuration" : "Add Configuration"
                      }
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
        </Dialog>
      )}
      
      {editingConfig && isAuthenticated && (
        <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit MQTT Configuration</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                {/* Add same form fields here - copy from above */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updateMqttConfigMutation.isPending} className="flex-1">
                    {updateMqttConfigMutation.isPending ? "Updating..." : "Update Configuration"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingConfig(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Router className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {config.brokerUrl}:{config.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.sslEnabled && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="w-3 h-3" />
                          SSL
                        </Badge>
                      )}
                      {config.isActive ? (
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
                      {isAuthenticated && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleConfigStatus(config)}
                            disabled={updateMqttConfigMutation.isPending}
                          >
                            {config.isActive ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMqttConfigMutation.mutate(config.id)}
                            disabled={deleteMqttConfigMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Topic Prefix:</span>
                      <span className="ml-2 font-mono">{config.topicPrefix}</span>
                    </div>
                    {config.clientId && (
                      <div>
                        <span className="text-muted-foreground">Client ID:</span>
                        <span className="ml-2 font-mono">{config.clientId}</span>
                      </div>
                    )}
                    {config.username && (
                      <div>
                        <span className="text-muted-foreground">Username:</span>
                        <span className="ml-2">{config.username}</span>
                      </div>
                    )}
                    {config.password && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Password:</span>
                        <span className="ml-2 font-mono">
                          {showPasswords[config.id] ? config.password : "••••••••"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(config.id)}
                          className="h-auto p-1"
                        >
                          {showPasswords[config.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}
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