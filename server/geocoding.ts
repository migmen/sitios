interface GeocodingResult {
  latitude: number;
  longitude: number;
  confidence: number;
}

interface OpenCageResponse {
  results: Array<{
    geometry: {
      lat: number;
      lng: number;
    };
    confidence: number;
  }>;
  status: {
    code: number;
    message: string;
  };
}

export class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org/search';
  private cache: Map<string, GeocodingResult> = new Map();

  constructor() {
    // Using free Nominatim service - no API key required
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    // Check cache first
    if (this.cache.has(address)) {
      console.log(`Using cached coordinates for: ${address}`);
      return this.cache.get(address)!;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}?q=${encodedAddress}&format=json&limit=1&countrycodes=us`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SF-Spots-App/1.0 (https://replit.com)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`No geocoding results found for address: ${address}`);
        return null;
      }

      const result = data[0];
      const geocodingResult = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        confidence: result.importance || 0.5,
      };

      // Cache the result
      this.cache.set(address, geocodingResult);
      console.log(`Geocoded and cached: ${address} -> ${geocodingResult.latitude}, ${geocodingResult.longitude}`);
      
      return geocodingResult;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  async geocodeAddresses(addresses: string[]): Promise<Map<string, GeocodingResult>> {
    const results = new Map<string, GeocodingResult>();
    
    // Process addresses with a small delay to avoid rate limiting
    for (const address of addresses) {
      const result = await this.geocodeAddress(address);
      if (result) {
        results.set(address, result);
      }
      // Small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

export const geocodingService = new GeocodingService();
