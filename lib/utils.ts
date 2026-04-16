import { Checkpoint } from './types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function getNearestCheckpoint(
  checkpoints: Checkpoint[],
  lat: number,
  lng: number
): { checkpoint: Checkpoint; distance: number } | null {
  if (checkpoints.length === 0) return null;
  let nearest: Checkpoint = checkpoints[0];
  let minDist = calculateDistance(lat, lng, nearest.latitude, nearest.longitude);
  for (const cp of checkpoints) {
    const dist = calculateDistance(lat, lng, cp.latitude, cp.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = cp;
    }
  }
  return { checkpoint: nearest, distance: minDist };
}

export function getDirectionAngle(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const EMOJI_LIST = [
  '🏁', '⭐', '💎', '🔑', '🎯', '🏆', '🎪', '🎭',
  '🚀', '🌟', '💡', '🔮', '🎲', '🎮', '🏴\u200d☠️', '🗺️',
  '📍', '🔥', '❤️', '🌈', '⚡', '🎵', '🍀', '👑',
  '🎁', '🔔', '🌸', '🦊', '🐉', '🌙', '☀️', '🍕',
  '🧩', '🎈', '💰', '🏅', '🌺', '🦋', '🐾', '🔱',
];

// Compact encode/decode for QR codes (JSON is too large for QR)
export function encodeMapForQR(map: any): string {
  // Use a compact JSON with short keys
  const compact = {
    t: 'rh',
    v: 1,
    n: map.name,
    d: map.description,
    c: map.creatorName,
    z: map.zoomRange || 5000,
    p: map.checkpoints.map((cp: any) => ({
      i: cp.id,
      a: Math.round(cp.latitude * 100000) / 100000,
      o: Math.round(cp.longitude * 100000) / 100000,
      e: cp.emoji,
      l: cp.label,
      x: cp.content || '',
      u: cp.imageUrl || '',
      r: cp.radius,
      h: cp.hint || '',
    })),
  };
  return JSON.stringify(compact);
}

export function decodeMapFromQR(data: string): any | null {
  try {
    const parsed = JSON.parse(data);

    // Compact format
    if (parsed.t === 'rh') {
      return {
        type: 'radar_hunt_map',
        map: {
          id: generateId(),
          name: parsed.n,
          description: parsed.d || '',
          creatorName: parsed.c || 'Unknown',
          zoomRange: parsed.z || 5000,
          createdAt: Date.now(),
          centerLat: parsed.p?.[0]?.a || 0,
          centerLng: parsed.p?.[0]?.o || 0,
          checkpoints: (parsed.p || []).map((p: any, idx: number) => ({
            id: p.i || generateId(),
            latitude: p.a,
            longitude: p.o,
            emoji: p.e || '📍',
            label: p.l || `CP ${idx + 1}`,
            content: p.x || '',
            imageUrl: p.u || undefined,
            radius: p.r || 50,
            hint: p.h || '',
            order: idx,
          })),
        },
      };
    }

    // Full format
    if (parsed.type === 'radar_hunt_map' && parsed.map) {
      return parsed;
    }

    // Legacy / direct format
    if (parsed.checkpoints && Array.isArray(parsed.checkpoints)) {
      return {
        type: 'radar_hunt_map',
        map: parsed,
      };
    }

    return null;
  } catch {
    return null;
  }
}
