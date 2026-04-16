import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMap, RoleType } from './types';

const MAPS_KEY = 'treasure_maps';
const ACTIVE_MAP_KEY = 'active_map';
const ROLE_KEY = 'user_role';
const FOUND_KEY = 'found_checkpoints';

export async function saveMaps(maps: GameMap[]): Promise<void> {
  await AsyncStorage.setItem(MAPS_KEY, JSON.stringify(maps));
}

export async function loadMaps(): Promise<GameMap[]> {
  const raw = await AsyncStorage.getItem(MAPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveActiveMap(map: GameMap | null): Promise<void> {
  if (map) {
    await AsyncStorage.setItem(ACTIVE_MAP_KEY, JSON.stringify(map));
  } else {
    await AsyncStorage.removeItem(ACTIVE_MAP_KEY);
  }
}

export async function loadActiveMap(): Promise<GameMap | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_MAP_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveRole(role: RoleType): Promise<void> {
  if (role) {
    await AsyncStorage.setItem(ROLE_KEY, role);
  } else {
    await AsyncStorage.removeItem(ROLE_KEY);
  }
}

export async function loadRole(): Promise<RoleType> {
  const raw = await AsyncStorage.getItem(ROLE_KEY);
  return (raw as RoleType) || null;
}

export async function saveFoundCheckpoints(mapId: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(`${FOUND_KEY}_${mapId}`, JSON.stringify(ids));
}

export async function loadFoundCheckpoints(mapId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(`${FOUND_KEY}_${mapId}`);
  return raw ? JSON.parse(raw) : [];
}
