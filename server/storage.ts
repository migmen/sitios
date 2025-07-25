import { 
  locations, 
  sensors, 
  sensorReadings,
  mqttConfigs,
  type Location, 
  type InsertLocation,
  type Sensor,
  type InsertSensor,
  type SensorReading,
  type InsertSensorReading,
  type MqttConfig,
  type InsertMqttConfig,
  type LocationWithSensors
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // Location methods
  getAllLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationByNotionId(notionId: string): Promise<Location | undefined>;
  getLocationWithSensors(id: number): Promise<LocationWithSensors | undefined>;
  upsertLocation(location: InsertLocation): Promise<Location>;
  deleteLocationByNotionId(notionId: string): Promise<boolean>;
  getLocationsInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Location[]>;
  searchLocations(query: string): Promise<Location[]>;
  
  // Sensor methods
  getSensorsByLocation(locationId: number): Promise<Sensor[]>;
  getSensor(id: number): Promise<Sensor | undefined>;
  getSensorByExternalId(sensorId: string): Promise<Sensor | undefined>;
  createSensor(sensor: InsertSensor): Promise<Sensor>;
  updateSensor(id: number, updates: Partial<InsertSensor>): Promise<Sensor | undefined>;
  deleteSensor(id: number): Promise<boolean>;
  
  // Sensor reading methods
  addSensorReading(reading: InsertSensorReading): Promise<SensorReading>;
  getLatestReadings(sensorId: number, limit?: number): Promise<SensorReading[]>;
  getReadingsByTimeRange(sensorId: number, startTime: Date, endTime: Date): Promise<SensorReading[]>;
  
  // MQTT configuration methods
  getMqttConfigsByLocation(locationId: number): Promise<MqttConfig[]>;
  getMqttConfig(id: number): Promise<MqttConfig | undefined>;
  createMqttConfig(config: InsertMqttConfig): Promise<MqttConfig>;
  updateMqttConfig(id: number, updates: Partial<InsertMqttConfig>): Promise<MqttConfig | undefined>;
  deleteMqttConfig(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async getLocationByNotionId(notionId: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.notionId, notionId));
    return location || undefined;
  }

  async upsertLocation(insertLocation: InsertLocation): Promise<Location> {
    // Check if location already exists by Notion ID
    const existing = await this.getLocationByNotionId(insertLocation.notionId);
    
    if (existing) {
      // Update existing location
      const [updated] = await db
        .update(locations)
        .set({
          ...insertLocation,
          updatedAt: new Date(),
        })
        .where(eq(locations.notionId, insertLocation.notionId))
        .returning();
      return updated;
    } else {
      // Create new location
      const [created] = await db
        .insert(locations)
        .values(insertLocation)
        .returning();
      return created;
    }
  }

  async getLocationsInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Location[]> {
    return await db.select().from(locations).where(
      and(
        lte(locations.latitude, bounds.north),
        gte(locations.latitude, bounds.south),
        lte(locations.longitude, bounds.east),
        gte(locations.longitude, bounds.west)
      )
    );
  }

  async deleteLocationByNotionId(notionId: string): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.notionId, notionId)).returning();
    return result.length > 0;
  }

  async searchLocations(query: string): Promise<Location[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(locations).where(
      or(
        ilike(locations.name, searchTerm),
        ilike(locations.description, searchTerm),
        ilike(locations.type, searchTerm),
        ilike(locations.subtype, searchTerm),
        ilike(locations.address, searchTerm)
      )
    );
  }

  async getLocationWithSensors(id: number): Promise<LocationWithSensors | undefined> {
    const location = await this.getLocation(id);
    if (!location) return undefined;

    const locationSensors = await db.query.sensors.findMany({
      where: eq(sensors.locationId, id),
      with: {
        readings: {
          orderBy: desc(sensorReadings.timestamp),
          limit: 10, // Get last 10 readings for each sensor
        },
      },
    });

    return {
      ...location,
      sensors: locationSensors,
    };
  }

  // Sensor methods
  async getSensorsByLocation(locationId: number): Promise<Sensor[]> {
    return await db.select().from(sensors).where(eq(sensors.locationId, locationId));
  }

  async getSensor(id: number): Promise<Sensor | undefined> {
    const [sensor] = await db.select().from(sensors).where(eq(sensors.id, id));
    return sensor || undefined;
  }

  async getSensorByExternalId(sensorId: string): Promise<Sensor | undefined> {
    const [sensor] = await db.select().from(sensors).where(eq(sensors.sensorId, sensorId));
    return sensor || undefined;
  }

  async createSensor(insertSensor: InsertSensor): Promise<Sensor> {
    const [sensor] = await db.insert(sensors).values(insertSensor).returning();
    return sensor;
  }

  async updateSensor(id: number, updates: Partial<InsertSensor>): Promise<Sensor | undefined> {
    const [sensor] = await db
      .update(sensors)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sensors.id, id))
      .returning();
    return sensor || undefined;
  }

  async deleteSensor(id: number): Promise<boolean> {
    const result = await db.delete(sensors).where(eq(sensors.id, id)).returning();
    return result.length > 0;
  }

  // Sensor reading methods
  async addSensorReading(reading: InsertSensorReading): Promise<SensorReading> {
    const [sensorReading] = await db.insert(sensorReadings).values(reading).returning();
    
    // Update sensor's last ping timestamp
    await db
      .update(sensors)
      .set({ lastPing: new Date() })
      .where(eq(sensors.id, reading.sensorId));
    
    return sensorReading;
  }

  async getLatestReadings(sensorId: number, limit: number = 100): Promise<SensorReading[]> {
    return await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.sensorId, sensorId))
      .orderBy(desc(sensorReadings.timestamp))
      .limit(limit);
  }

  async getReadingsByTimeRange(sensorId: number, startTime: Date, endTime: Date): Promise<SensorReading[]> {
    return await db
      .select()
      .from(sensorReadings)
      .where(
        and(
          eq(sensorReadings.sensorId, sensorId),
          gte(sensorReadings.timestamp, startTime),
          lte(sensorReadings.timestamp, endTime)
        )
      )
      .orderBy(desc(sensorReadings.timestamp));
  }

  // MQTT Configuration methods
  async getMqttConfigsByLocation(locationId: number): Promise<MqttConfig[]> {
    return await db
      .select()
      .from(mqttConfigs)
      .where(eq(mqttConfigs.locationId, locationId));
  }

  async getMqttConfig(id: number): Promise<MqttConfig | undefined> {
    const [config] = await db
      .select()
      .from(mqttConfigs)
      .where(eq(mqttConfigs.id, id));
    return config || undefined;
  }

  async createMqttConfig(insertConfig: InsertMqttConfig): Promise<MqttConfig> {
    const [config] = await db
      .insert(mqttConfigs)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateMqttConfig(id: number, updates: Partial<InsertMqttConfig>): Promise<MqttConfig | undefined> {
    const [config] = await db
      .update(mqttConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mqttConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteMqttConfig(id: number): Promise<boolean> {
    const result = await db
      .delete(mqttConfigs)
      .where(eq(mqttConfigs.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export class MemStorage implements IStorage {
  private locations: Map<number, Location>;
  private notionIdMap: Map<string, number>;
  private sensors: Map<number, Sensor>;
  private sensorReadings: Map<number, SensorReading[]>;
  private mqttConfigs: Map<number, MqttConfig>;
  private currentId: number;
  private currentSensorId: number;
  private currentReadingId: number;
  private currentMqttConfigId: number;

  constructor() {
    this.locations = new Map();
    this.notionIdMap = new Map();
    this.sensors = new Map();
    this.sensorReadings = new Map();
    this.mqttConfigs = new Map();
    this.currentId = 1;
    this.currentSensorId = 1;
    this.currentReadingId = 1;
    this.currentMqttConfigId = 1;
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationByNotionId(notionId: string): Promise<Location | undefined> {
    const id = this.notionIdMap.get(notionId);
    if (id) {
      return this.locations.get(id);
    }
    return undefined;
  }

  async upsertLocation(insertLocation: InsertLocation): Promise<Location> {
    // Check if location already exists by Notion ID
    const existingId = this.notionIdMap.get(insertLocation.notionId);
    
    if (existingId) {
      // Update existing location
      const existing = this.locations.get(existingId)!;
      const updated: Location = {
        ...existing,
        ...insertLocation,
        id: existingId,
        updatedAt: new Date(),
      };
      this.locations.set(existingId, updated);
      return updated;
    } else {
      // Create new location
      const id = this.currentId++;
      const now = new Date();
      const location: Location = {
        ...insertLocation,
        id,
        photo: insertLocation.photo ?? null,
        latitude: insertLocation.latitude ?? null,
        longitude: insertLocation.longitude ?? null,
        lastVisited: insertLocation.lastVisited ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.locations.set(id, location);
      this.notionIdMap.set(insertLocation.notionId, id);
      return location;
    }
  }

  async getLocationsInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(location => {
      if (!location.latitude || !location.longitude) {
        return false;
      }
      
      return (
        location.latitude <= bounds.north &&
        location.latitude >= bounds.south &&
        location.longitude <= bounds.east &&
        location.longitude >= bounds.west
      );
    });
  }

  async deleteLocationByNotionId(notionId: string): Promise<boolean> {
    const locationId = this.notionIdMap.get(notionId);
    if (locationId && this.locations.has(locationId)) {
      this.locations.delete(locationId);
      this.notionIdMap.delete(notionId);
      return true;
    }
    return false;
  }

  async searchLocations(query: string): Promise<Location[]> {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.locations.values()).filter(location => {
      return (
        location.name.toLowerCase().includes(lowercaseQuery) ||
        location.description.toLowerCase().includes(lowercaseQuery) ||
        location.type.toLowerCase().includes(lowercaseQuery) ||
        location.subtype.toLowerCase().includes(lowercaseQuery) ||
        location.address.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  // Sensor methods for MemStorage (simplified implementations)
  async getLocationWithSensors(id: number): Promise<LocationWithSensors | undefined> {
    const location = await this.getLocation(id);
    if (!location) return undefined;
    
    const locationSensors = Array.from(this.sensors.values())
      .filter(sensor => sensor.locationId === id)
      .map(sensor => ({
        ...sensor,
        readings: this.sensorReadings.get(sensor.id) || []
      }));
    
    return { ...location, sensors: locationSensors };
  }

  async getSensorsByLocation(locationId: number): Promise<Sensor[]> {
    return Array.from(this.sensors.values()).filter(sensor => sensor.locationId === locationId);
  }

  async getSensor(id: number): Promise<Sensor | undefined> {
    return this.sensors.get(id);
  }

  async getSensorByExternalId(sensorId: string): Promise<Sensor | undefined> {
    return Array.from(this.sensors.values()).find(sensor => sensor.sensorId === sensorId);
  }

  async createSensor(insertSensor: InsertSensor): Promise<Sensor> {
    const id = this.currentSensorId++;
    const now = new Date();
    const sensor: Sensor = {
      ...insertSensor,
      id,
      unit: insertSensor.unit ?? null,
      isActive: insertSensor.isActive ?? true,
      lastPing: null,
      metadata: insertSensor.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.sensors.set(id, sensor);
    this.sensorReadings.set(id, []);
    return sensor;
  }

  async updateSensor(id: number, updates: Partial<InsertSensor>): Promise<Sensor | undefined> {
    const sensor = this.sensors.get(id);
    if (!sensor) return undefined;
    
    const updated = { ...sensor, ...updates, updatedAt: new Date() };
    this.sensors.set(id, updated);
    return updated;
  }

  async deleteSensor(id: number): Promise<boolean> {
    if (this.sensors.has(id)) {
      this.sensors.delete(id);
      this.sensorReadings.delete(id);
      return true;
    }
    return false;
  }

  async addSensorReading(reading: InsertSensorReading): Promise<SensorReading> {
    const id = this.currentReadingId++;
    const sensorReading: SensorReading = {
      ...reading,
      id,
      metadata: reading.metadata ?? null,
      timestamp: new Date(),
    };
    
    const readings = this.sensorReadings.get(reading.sensorId) || [];
    readings.unshift(sensorReading);
    this.sensorReadings.set(reading.sensorId, readings.slice(0, 1000)); // Keep only last 1000 readings
    
    // Update sensor last ping
    const sensor = this.sensors.get(reading.sensorId);
    if (sensor) {
      sensor.lastPing = new Date();
      this.sensors.set(reading.sensorId, sensor);
    }
    
    return sensorReading;
  }

  async getLatestReadings(sensorId: number, limit: number = 100): Promise<SensorReading[]> {
    const readings = this.sensorReadings.get(sensorId) || [];
    return readings.slice(0, limit);
  }

  async getReadingsByTimeRange(sensorId: number, startTime: Date, endTime: Date): Promise<SensorReading[]> {
    const readings = this.sensorReadings.get(sensorId) || [];
    return readings.filter(reading => 
      reading.timestamp >= startTime && reading.timestamp <= endTime
    );
  }

  // MQTT Configuration methods for MemStorage
  async getMqttConfigsByLocation(locationId: number): Promise<MqttConfig[]> {
    return Array.from(this.mqttConfigs.values()).filter(config => config.locationId === locationId);
  }

  async getMqttConfig(id: number): Promise<MqttConfig | undefined> {
    return this.mqttConfigs.get(id);
  }

  async createMqttConfig(insertConfig: InsertMqttConfig): Promise<MqttConfig> {
    const id = this.currentMqttConfigId++;
    const now = new Date();
    const config: MqttConfig = {
      ...insertConfig,
      id,
      port: insertConfig.port ?? 1883,
      username: insertConfig.username ?? null,
      password: insertConfig.password ?? null,
      clientId: insertConfig.clientId ?? null,
      topicPrefix: insertConfig.topicPrefix ?? "sensors",
      isActive: insertConfig.isActive ?? true,
      sslEnabled: insertConfig.sslEnabled ?? false,
      metadata: insertConfig.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.mqttConfigs.set(id, config);
    return config;
  }

  async updateMqttConfig(id: number, updates: Partial<InsertMqttConfig>): Promise<MqttConfig | undefined> {
    const config = this.mqttConfigs.get(id);
    if (!config) return undefined;
    
    const updated = { ...config, ...updates, updatedAt: new Date() };
    this.mqttConfigs.set(id, updated);
    return updated;
  }

  async deleteMqttConfig(id: number): Promise<boolean> {
    if (this.mqttConfigs.has(id)) {
      this.mqttConfigs.delete(id);
      return true;
    }
    return false;
  }
}

export const storage = new DatabaseStorage();
