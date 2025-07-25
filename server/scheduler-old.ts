import { storage } from "./storage";
import { notion } from "./notion";
import { geocodingService } from "./geocoding";
import { insertLocationSchema } from "@shared/schema";
import { transformNotionLocation } from "./notion-transformer";
import { z } from "zod";

class NotionScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    console.log("NotionScheduler initialized - sync will run every 24 hours");
  }

  start() {
    // Run initial sync after 30 seconds
    setTimeout(() => {
      this.performSync();
    }, 30000);

    // Schedule daily syncs
    this.intervalId = setInterval(() => {
      this.performSync();
    }, this.SYNC_INTERVAL_MS);

    console.log("Daily Notion sync scheduler started");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Daily Notion sync scheduler stopped");
    }
  }

  async performSync(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting scheduled Notion sync...`);
    
    try {
      if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
        console.log("Notion integration not configured - skipping sync");
        return;
      }

      // Use the database ID from the URL directly
      const databaseId = process.env.NOTION_PAGE_URL!.match(/([a-f0-9]{32})/)?.[1];
      
      if (!databaseId) {
        console.log("Invalid NOTION_PAGE_URL format - skipping sync");
        return;
      }

      // Try to access the database directly
      let locationsDb;
      try {
        locationsDb = await notion.databases.retrieve({
          database_id: databaseId,
        });
      } catch (error) {
        console.log("Could not access the Notion database - skipping sync");
        return;
      }

      // Query the database
      const response = await notion.databases.query({
        database_id: locationsDb.id,
      });

      // Transform Notion data to our format
      const notionLocations = response.results.map((page: any) => {
        const properties = page.properties;
        return {
          notionId: page.id,
          name: properties.Name?.title?.[0]?.plain_text || "Untitled Location",
          description: properties.Description?.rich_text?.[0]?.plain_text || "",
          price: properties.Price?.number || 0,
          photo: properties.Photo?.files?.[0]?.file?.url || 
                 properties.Photo?.files?.[0]?.external?.url || null,
          address: properties.Address?.rich_text?.[0]?.plain_text || "",
          type: properties.Type?.select?.name || "Unknown",
          subtype: properties.Subtype?.rich_text?.[0]?.plain_text || "",
          lastVisited: properties.LastVisited?.date?.start || null,
        };
      });

      console.log(`Found ${notionLocations.length} locations in Notion`);

      // Geocode addresses for locations that need coordinates
      for (const location of notionLocations) {
        if (location.address) {
          // Check if we already have this location with coordinates in the database
          const existingLocation = await storage.getLocationByNotionId(location.notionId);
          
          if (existingLocation && existingLocation.latitude && existingLocation.longitude) {
            // Use cached coordinates from database
            (location as any).latitude = existingLocation.latitude;
            (location as any).longitude = existingLocation.longitude;
            console.log(`Using cached coordinates from database for: ${location.name}`);
          } else {
            // Geocode the address
            console.log(`Geocoding address for: ${location.name}`);
            const coords = await geocodingService.geocodeAddress(location.address);
            if (coords) {
              (location as any).latitude = coords.latitude;
              (location as any).longitude = coords.longitude;
            }
          }
        }
      }

      // Validate and store locations
      let syncedCount = 0;
      let errors: string[] = [];

      for (const notionLocation of notionLocations) {
        try {
          const validatedLocation = insertLocationSchema.parse(notionLocation);
          await storage.upsertLocation(validatedLocation);
          syncedCount++;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`${notionLocation.name}: ${error.errors.map(e => e.message).join(", ")}`);
          } else {
            errors.push(`${notionLocation.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      }

      console.log(`[${new Date().toISOString()}] Sync completed: ${syncedCount}/${notionLocations.length} locations synced`);
      
      if (errors.length > 0) {
        console.log("Sync errors:", errors);
      }

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scheduled Notion sync failed:`, error);
    }
  }

  // Manual trigger for testing
  async triggerSync(): Promise<{ syncedCount: number; totalNotionLocations: number; errors?: string[] }> {
    console.log("Manual sync triggered");
    
    try {
      if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
        throw new Error("Notion integration not configured. Please set NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL environment variables.");
      }

      // Use the database ID from the URL directly
      const databaseId = process.env.NOTION_PAGE_URL!.match(/([a-f0-9]{32})/)?.[1];
      
      if (!databaseId) {
        throw new Error("Invalid NOTION_PAGE_URL format. Please provide a valid Notion database URL.");
      }

      // Try to access the database directly
      let locationsDb;
      try {
        locationsDb = await notion.databases.retrieve({
          database_id: databaseId,
        });
      } catch (error) {
        throw new Error("Could not access the Notion database. Please ensure the integration has access to your database.");
      }

      // Query the database
      const response = await notion.databases.query({
        database_id: locationsDb.id,
      });

      // Transform Notion data to our format
      const notionLocations = response.results.map((page: any) => {
        const properties = page.properties;
        return {
          notionId: page.id,
          name: properties.Name?.title?.[0]?.plain_text || "Untitled Location",
          description: properties.Description?.rich_text?.[0]?.plain_text || "",
          price: properties.Price?.number || 0,
          photo: properties.Photo?.files?.[0]?.file?.url || 
                 properties.Photo?.files?.[0]?.external?.url || null,
          address: properties.Address?.rich_text?.[0]?.plain_text || "",
          type: properties.Type?.select?.name || "Unknown",
          subtype: properties.Subtype?.rich_text?.[0]?.plain_text || "",
          lastVisited: properties.LastVisited?.date?.start || null,
        };
      });

      // Geocode addresses for locations that need coordinates
      for (const location of notionLocations) {
        if (location.address) {
          // Check if we already have this location with coordinates in the database
          const existingLocation = await storage.getLocationByNotionId(location.notionId);
          
          if (existingLocation && existingLocation.latitude && existingLocation.longitude) {
            // Use cached coordinates from database
            (location as any).latitude = existingLocation.latitude;
            (location as any).longitude = existingLocation.longitude;
          } else {
            // Geocode the address
            const coords = await geocodingService.geocodeAddress(location.address);
            if (coords) {
              (location as any).latitude = coords.latitude;
              (location as any).longitude = coords.longitude;
            }
          }
        }
      }

      // Validate and store locations
      let syncedCount = 0;
      let errors: string[] = [];

      for (const notionLocation of notionLocations) {
        try {
          const validatedLocation = insertLocationSchema.parse(notionLocation);
          await storage.upsertLocation(validatedLocation);
          syncedCount++;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`${notionLocation.name}: ${error.errors.map(e => e.message).join(", ")}`);
          } else {
            errors.push(`${notionLocation.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      }

      return {
        syncedCount,
        totalNotionLocations: notionLocations.length,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      console.error("Manual sync failed:", error);
      throw error;
    }
  }
}

export const notionScheduler = new NotionScheduler();