export interface Location {
  id: number;
  notionId: string;
  name: string;
  description: string;
  price: number; // 0 = Free, 1-3 = $ to $$$
  photo?: string | null;
  address: string;
  type: string;
  subtype: string;
  lastVisited?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface NotionSyncResponse {
  message: string;
  syncedCount: number;
  totalNotionLocations: number;
  errors?: string[];
}
