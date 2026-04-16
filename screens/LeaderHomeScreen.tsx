import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { GameMap, Checkpoint } from '../lib/types';
import { generateId } from '../lib/utils';
import { saveMaps, loadMaps, saveActiveMap } from '../lib/storage';
import GlowButton from '../components/GlowButton';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  onSelectMap: (map: GameMap) => void;
  onBack: () => void;
}

export default function LeaderHomeScreen({ onSelectMap, onBack }: Props) {
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creatorName, setCreatorName] = useState('');

  useEffect(() => {
    loadMaps().then(setMaps);
  }, []);

  const createMap = useCallback(() => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a map name');
      return;
    }
    const map: GameMap = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim(),
      checkpoints: [],
      createdAt: Date.now(),
      creatorName: creatorName.trim() || 'Leader',
      centerLat: 22.3193,
      centerLng: 114.1694,
      zoomRange: 5000,
    };
    const updated = [...maps, map];
    setMaps(updated);
    saveMaps(updated);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    onSelectMap(map);
  }, [newName, newDesc, creatorName, maps]);

  const deleteMap = useCallback((id: string) => {
    Alert.alert('Delete Map', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = maps.filter((m) => m.id !== id);
          setMaps(updated);
          saveMaps(updated);
        },
      },
    ]);
  }, [maps]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Maps</Text>
          <Text style={styles.headerSub}>{maps.length} game{maps.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)} style={styles.addBtn}>
          <Ionicons name={showCreate ? 'close' : 'add'} size={24} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      {showCreate && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.createForm}>
          <Text style={styles.formTitle}>New Game Map</Text>
          <TextInput
            style={styles.input}
            placeholder="Map name..."
            placeholderTextColor={Colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor={Colors.textMuted}
            value={newDesc}
            onChangeText={setNewDesc}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Your name (optional)"
            placeholderTextColor={Colors.textMuted}
            value={creatorName}
            onChangeText={setCreatorName}
            returnKeyType="done"
            onSubmitEditing={createMap}
          />
          <GlowButton
            title="Create Map"
            onPress={createMap}
            variant="primary"
            style={{ marginTop: 8 }}
            icon={<Ionicons name="map" size={18} color={Colors.bg} />}
          />
        </Animated.View>
      )}

      <FlatList
        data={maps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No Maps Yet</Text>
            <Text style={styles.emptyDesc}>Tap + to create your first treasure hunt map</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
            <TouchableOpacity
              style={styles.mapCard}
              onPress={() => onSelectMap(item)}
              activeOpacity={0.7}
            >
              <View style={styles.mapIcon}>
                <Ionicons name="map" size={28} color={Colors.primary} />
              </View>
              <View style={styles.mapInfo}>
                <Text style={styles.mapName}>{item.name}</Text>
                <Text style={styles.mapDesc} numberOfLines={1}>
                  {item.description || 'No description'}
                </Text>
                <View style={styles.mapMeta}>
                  <View style={styles.metaBadge}>
                    <Ionicons name="flag" size={11} color={Colors.primary} />
                    <Text style={styles.metaText}>{item.checkpoints.length} CPs</Text>
                  </View>
                  <Text style={styles.mapDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteMap(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createForm: {
    backgroundColor: Colors.bgCard,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  formTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mapInfo: {
    flex: 1,
  },
  mapName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  mapDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  mapMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgCardLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  mapDate: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 8,
    marginRight: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
