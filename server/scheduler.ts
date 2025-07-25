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
      const result = await this.syncFromNotion();
      console.log(`[${new Date().toISOString()}] Sync completed: ${result.syncedCount}/${result.totalNotionLocations} locations synced`);
      
      if (result.errors && result.errors.length > 0) {
        console.log("Sync errors:", result.errors);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scheduled Notion sync failed:`, error);
    }
  }

  async triggerSync(): Promise<{ syncedCount: number; totalNotionLocations: number; errors?: string[] }> {
    console.log("Manual sync triggered");
    return await this.syncFromNotion();
  }

  private async syncFromNotion(): Promise<{ syncedCount: number; totalNotionLocations: number; errors?: string[] }> {
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
    const notionLocations = response.results.map(transformNotionLocation);

    console.log(`Found ${notionLocations.length} locations in Notion`);

    // Get current locations from database for deletion detection
    const currentLocations = await storage.getAllLocations();
    const currentNotionIds = new Set(currentLocations.map(loc => loc.notionId));
    const incomingNotionIds = new Set(notionLocations.map(loc => loc.notionId));

    // Find locations that were deleted in Notion (exist in DB but not in Notion)
    const deletedNotionIds = Array.from(currentNotionIds).filter(id => !incomingNotionIds.has(id));
    
    if (deletedNotionIds.length > 0) {
      console.log(`Removing ${deletedNotionIds.length} locations that were deleted from Notion`);
      for (const notionId of deletedNotionIds) {
        await this.deleteLocationByNotionId(notionId);
      }
    }

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

    return {
      syncedCount,
      totalNotionLocations: notionLocations.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async deleteLocationByNotionId(notionId: string): Promise<void> {
    try {
      const location = await storage.getLocationByNotionId(notionId);
      if (location) {
        console.log(`Deleting location: ${location.name} (${notionId})`);
        const deleted = await storage.deleteLocationByNotionId(notionId);
        if (deleted) {
          console.log(`Successfully deleted ${location.name}`);
        } else {
          console.log(`Failed to delete ${location.name}`);
        }
      }
    } catch (error) {
      console.error(`Error deleting location ${notionId}:`, error);
    }
  }
}

export const notionScheduler = new NotionScheduler();