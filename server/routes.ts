import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { notionScheduler } from "./scheduler";
import { 
  insertLocationSchema, 
  insertSensorSchema, 
  insertSensorReadingSchema,
  insertMqttConfigSchema,
  type Location,
  type Sensor,
  type SensorReading,
  type MqttConfig
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  // Get locations within bounds
  app.get("/api/locations/bounds", async (req, res) => {
    try {
      const { north, south, east, west } = req.query;
      
      if (!north || !south || !east || !west) {
        return res.status(400).json({ error: "Missing bounds parameters" });
      }

      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string),
      };

      const locations = await storage.getLocationsInBounds(bounds);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations in bounds:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  // Search locations
  app.get("/api/locations/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Missing search query" });
      }

      const locations = await storage.searchLocations(q);
      res.json(locations);
    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({ error: "Failed to search locations" });
    }
  });

  // Get a single location by ID
  app.get("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  // Create a new location
  app.post("/api/locations", async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const newLocation = await storage.upsertLocation(locationData);
      res.status(201).json(newLocation);
    } catch (error) {
      console.error("Error creating location:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid location data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to create location" });
      }
    }
  });

  // Update an existing location
  app.put("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      const existingLocation = await storage.getLocation(id);
      if (!existingLocation) {
        return res.status(404).json({ error: "Location not found" });
      }

      const locationData = insertLocationSchema.parse(req.body);
      const updatedLocation = await storage.upsertLocation(locationData);
      res.json(updatedLocation);
    } catch (error) {
      console.error("Error updating location:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid location data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to update location" });
      }
    }
  });

  // Delete a location
  app.delete("/api/locations/:notionId", async (req, res) => {
    try {
      const { notionId } = req.params;
      const deleted = await storage.deleteLocationByNotionId(notionId);
      
      if (deleted) {
        res.json({ message: "Location deleted successfully" });
      } else {
        res.status(404).json({ error: "Location not found" });
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ error: "Failed to delete location" });
    }
  });

  // Manual sync trigger (scheduler runs automatically daily)
  app.post("/api/sync-notion", async (req, res) => {
    try {
      const result = await notionScheduler.triggerSync();
      res.json({
        message: `Successfully synced ${result.syncedCount} locations from Notion`,
        ...result,
      });
    } catch (error) {
      console.error("Error syncing from Notion:", error);
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        res.status(401).json({ 
          error: "Notion authentication failed. Please check your NOTION_INTEGRATION_SECRET and ensure the integration has access to your page." 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to sync from Notion: " + (error instanceof Error ? error.message : "Unknown error")
        });
      }
    }
  });

  // IoT Sensor API endpoints
  
  // Get location with sensors
  app.get("/api/locations/:id/sensors", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      const locationWithSensors = await storage.getLocationWithSensors(id);
      if (!locationWithSensors) {
        return res.status(404).json({ error: "Location not found" });
      }

      res.json(locationWithSensors);
    } catch (error) {
      console.error("Error fetching location with sensors:", error);
      res.status(500).json({ error: "Failed to fetch location sensors" });
    }
  });

  // Get sensors for a location
  app.get("/api/locations/:locationId/sensors-only", async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      const sensors = await storage.getSensorsByLocation(locationId);
      res.json(sensors);
    } catch (error) {
      console.error("Error fetching sensors:", error);
      res.status(500).json({ error: "Failed to fetch sensors" });
    }
  });

  // Create a new sensor
  app.post("/api/sensors", async (req, res) => {
    try {
      const sensorData = insertSensorSchema.parse(req.body);
      const newSensor = await storage.createSensor(sensorData);
      res.status(201).json(newSensor);
    } catch (error) {
      console.error("Error creating sensor:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid sensor data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to create sensor" });
      }
    }
  });

  // Update a sensor
  app.put("/api/sensors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sensor ID" });
      }

      const sensorData = insertSensorSchema.partial().parse(req.body);
      const updatedSensor = await storage.updateSensor(id, sensorData);
      
      if (!updatedSensor) {
        return res.status(404).json({ error: "Sensor not found" });
      }

      res.json(updatedSensor);
    } catch (error) {
      console.error("Error updating sensor:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid sensor data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to update sensor" });
      }
    }
  });

  // Delete a sensor
  app.delete("/api/sensors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sensor ID" });
      }

      const deleted = await storage.deleteSensor(id);
      
      if (deleted) {
        res.json({ message: "Sensor deleted successfully" });
      } else {
        res.status(404).json({ error: "Sensor not found" });
      }
    } catch (error) {
      console.error("Error deleting sensor:", error);
      res.status(500).json({ error: "Failed to delete sensor" });
    }
  });

  // Add sensor reading (for IoT devices to post data)
  app.post("/api/sensors/:sensorId/readings", async (req, res) => {
    try {
      const sensorId = req.params.sensorId;
      
      // Find sensor by external ID or internal ID
      let sensor;
      if (isNaN(parseInt(sensorId))) {
        sensor = await storage.getSensorByExternalId(sensorId);
      } else {
        sensor = await storage.getSensor(parseInt(sensorId));
      }

      if (!sensor) {
        return res.status(404).json({ error: "Sensor not found" });
      }

      const readingData = insertSensorReadingSchema.parse({
        ...req.body,
        sensorId: sensor.id,
      });

      const newReading = await storage.addSensorReading(readingData);
      res.status(201).json(newReading);
    } catch (error) {
      console.error("Error adding sensor reading:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid reading data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to add sensor reading" });
      }
    }
  });

  // Get latest readings for a sensor
  app.get("/api/sensors/:id/readings", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sensor ID" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const readings = await storage.getLatestReadings(id, limit);
      res.json(readings);
    } catch (error) {
      console.error("Error fetching sensor readings:", error);
      res.status(500).json({ error: "Failed to fetch sensor readings" });
    }
  });

  // Get readings by time range
  app.get("/api/sensors/:id/readings/range", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sensor ID" });
      }

      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: "Start and end times are required" });
      }

      const startTime = new Date(start as string);
      const endTime = new Date(end as string);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      const readings = await storage.getReadingsByTimeRange(id, startTime, endTime);
      res.json(readings);
    } catch (error) {
      console.error("Error fetching sensor readings by range:", error);
      res.status(500).json({ error: "Failed to fetch sensor readings" });
    }
  });

  // MQTT Configuration API endpoints
  
  // Get MQTT configurations for a location
  app.get("/api/locations/:locationId/mqtt-configs", async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ error: "Invalid location ID" });
      }

      const configs = await storage.getMqttConfigsByLocation(locationId);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching MQTT configs:", error);
      res.status(500).json({ error: "Failed to fetch MQTT configurations" });
    }
  });

  // Create a new MQTT configuration
  app.post("/api/mqtt-configs", async (req, res) => {
    try {
      const configData = insertMqttConfigSchema.parse(req.body);
      const newConfig = await storage.createMqttConfig(configData);
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Error creating MQTT config:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid MQTT configuration data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to create MQTT configuration" });
      }
    }
  });

  // Update an MQTT configuration
  app.put("/api/mqtt-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid MQTT config ID" });
      }

      const configData = insertMqttConfigSchema.partial().parse(req.body);
      const updatedConfig = await storage.updateMqttConfig(id, configData);
      
      if (!updatedConfig) {
        return res.status(404).json({ error: "MQTT configuration not found" });
      }

      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating MQTT config:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Invalid MQTT configuration data: " + error.message });
      } else {
        res.status(500).json({ error: "Failed to update MQTT configuration" });
      }
    }
  });

  // Delete an MQTT configuration
  app.delete("/api/mqtt-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid MQTT config ID" });
      }

      const deleted = await storage.deleteMqttConfig(id);
      
      if (deleted) {
        res.json({ message: "MQTT configuration deleted successfully" });
      } else {
        res.status(404).json({ error: "MQTT configuration not found" });
      }
    } catch (error) {
      console.error("Error deleting MQTT config:", error);
      res.status(500).json({ error: "Failed to delete MQTT configuration" });
    }
  });

  // Get specific MQTT configuration
  app.get("/api/mqtt-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid MQTT config ID" });
      }

      const config = await storage.getMqttConfig(id);
      
      if (!config) {
        return res.status(404).json({ error: "MQTT configuration not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching MQTT config:", error);
      res.status(500).json({ error: "Failed to fetch MQTT configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
