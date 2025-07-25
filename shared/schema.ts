import { pgTable, text, serial, integer, real, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  notionId: text("notion_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // 1-3 scale
  photo: text("photo"), // URL to photo
  address: text("address").notNull(),
  type: text("type").notNull(),
  subtype: text("subtype").notNull(),
  lastVisited: text("last_visited"), // ISO date string
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sensors = pgTable("sensors", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  sensorId: text("sensor_id").notNull().unique(), // External sensor identifier
  name: text("name").notNull(), // Human readable name
  type: text("type").notNull(), // temperature, humidity, occupancy, noise, air_quality, etc.
  unit: text("unit"), // °C, %, dB, ppm, etc.
  isActive: boolean("is_active").default(true).notNull(),
  lastPing: timestamp("last_ping"),
  metadata: json("metadata"), // Additional sensor configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  sensorId: integer("sensor_id").notNull().references(() => sensors.id, { onDelete: "cascade" }),
  value: real("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"), // Additional reading data
});

// MQTT Configuration table
export const mqttConfigs = pgTable("mqtt_configs", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  brokerUrl: text("broker_url").notNull(),
  port: integer("port").default(1883).notNull(),
  username: text("username"),
  password: text("password"),
  clientId: text("client_id"),
  topicPrefix: text("topic_prefix").default("sensors").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sslEnabled: boolean("ssl_enabled").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// Relations
export const locationsRelations = relations(locations, ({ many }) => ({
  sensors: many(sensors),
  mqttConfigs: many(mqttConfigs),
}));

export const sensorsRelations = relations(sensors, ({ one, many }) => ({
  location: one(locations, {
    fields: [sensors.locationId],
    references: [locations.id],
  }),
  readings: many(sensorReadings),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({ one }) => ({
  sensor: one(sensors, {
    fields: [sensorReadings.sensorId],
    references: [sensors.id],
  }),
}));

export const mqttConfigsRelations = relations(mqttConfigs, ({ one }) => ({
  location: one(locations, {
    fields: [mqttConfigs.locationId],
    references: [locations.id],
  }),
}));

// Schemas
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSensorSchema = createInsertSchema(sensors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastPing: true,
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings).omit({
  id: true,
  timestamp: true,
});

export const insertMqttConfigSchema = createInsertSchema(mqttConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type Sensor = typeof sensors.$inferSelect;
export type InsertSensor = z.infer<typeof insertSensorSchema>;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type MqttConfig = typeof mqttConfigs.$inferSelect;
export type InsertMqttConfig = z.infer<typeof insertMqttConfigSchema>;

// Extended types with relations
export type LocationWithSensors = Location & {
  sensors: (Sensor & {
    readings: SensorReading[];
  })[];
};

// Simple users table for basic authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
