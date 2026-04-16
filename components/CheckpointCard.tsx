export interface Checkpoint {
  id: string;
  latitude: number;
  longitude: number;
  emoji: string;        // Map marker emoji
  label: string;        // CP name
  content: string;      // Text content to display at CP
  imageUrl?: string;    // Image URL to display at CP
  radius: number;       // Detection radius in meters
  hint?: string;        // Hint for players
  found?: boolean;
  order: number;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  checkpoints: Checkpoint[];
  createdAt: number;
  creatorName: string;
  centerLat: number;
  centerLng: number;
  zoomRange?: number;   // Map view range in meters (e.g. 500 for park, 20000 for city)
}

export type RoleType = 'leader' | 'member' | null;

// Zoom presets
export const ZOOM_PRESETS = [
  { label: 'Room', value: 50, icon: '🏠' },
  { label: 'Building', value: 200, icon: '🏢' },
  { label: 'Park', value: 500, icon: '🌳' },
  { label: 'Campus', value: 1000, icon: '🏫' },
  { label: 'District', value: 3000, icon: '🏘️' },
  { label: 'City', value: 10000, icon: '🌆' },
  { label: 'Region', value: 30000, icon: '🗺️' },
  { label: 'All HK', value: 60000, icon: '🇭🇰' },
];
