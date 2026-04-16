import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { GameMap, Checkpoint } from '../lib/types';
import { generateId, encodeMapForQR, formatDistance } from '../lib/utils';
import { saveMaps, loadMaps } from '../lib/storage';
import GlowButton from '../components/GlowButton';
import CheckpointCard from '../components/CheckpointCard';
import EmojiPicker from '../components/EmojiPicker';
import QRModal from '../components/QRModal';
import CPDetailModal from '../components/CPDetailModal';

import LiveMapView from '../components/LiveMapView';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  map: GameMap;
  onUpdate: (map: GameMap) => void;
  onBack: () => void;
}

type ViewMode = 'map' | 'list';

export default function LeaderEditScreen({ map, onUpdate, onBack }: Props) {
  const [gameMap, setGameMap] = useState<GameMap>(map);
  const [showForm, setShowForm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [editingCP, setEditingCP] = useState<Checkpoint | null>(null);
  const [detailCP, setDetailCP] = useState<Checkpoint | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // CP form fields
  const [cpLat, setCpLat] = useState('');
  const [cpLng, setCpLng] = useState('');
  const [cpEmoji, setCpEmoji] = useState('🏁');
  const [cpLabel, setCpLabel] = useState('');
  const [cpContent, setCpContent] = useState('');
  const [cpRadius, setCpRadius] = useState('50');
  const [cpHint, setCpHint] = useState('');
  const [cpImageUrl, setCpImageUrl] = useState('');

  // Listen for map click events
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'map_click') {
          setCpLat(data.lat.toFixed(6));
          setCpLng(data.lng.toFixed(6));
          // Auto-open form if not already open
          if (!showForm) setShowForm(true);
        }
        if (data.type === 'cp_click') {
          const cp = gameMap.checkpoints.find((c) => c.id === data.id);
          if (cp) setDetailCP(cp);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [showForm, gameMap.checkpoints]);

  const updateAndSave = useCallback(async (updated: GameMap) => {
    setGameMap(updated);
    onUpdate(updated);
    const maps = await loadMaps();
    const idx = maps.findIndex((m) => m.id === updated.id);
    if (idx >= 0) maps[idx] = updated;
    else maps.push(updated);
    await saveMaps(maps);
  }, [onUpdate]);

  const resetForm = () => {
    setCpLat(''); setCpLng(''); setCpEmoji('🏁'); setCpLabel('');
    setCpContent(''); setCpRadius('50'); setCpHint(''); setCpImageUrl('');
    setEditingCP(null);
  };

  const addOrUpdateCP = useCallback(() => {
    const lat = parseFloat(cpLat);
    const lng = parseFloat(cpLng);
    const radius = parseInt(cpRadius) || 50;
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please pick a location on the map or enter coordinates');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Coordinates out of range');
      return;
    }
    if (editingCP) {
      const updatedCPs = gameMap.checkpoints.map((cp) =>
        cp.id === editingCP.id
          ? { ...cp, latitude: lat, longitude: lng, emoji: cpEmoji, label: cpLabel || cp.label, content: cpContent, radius, hint: cpHint || undefined, imageUrl: cpImageUrl || undefined }
          : cp
      );
      updateAndSave({ ...gameMap, checkpoints: updatedCPs });
    } else {
      const newCP: Checkpoint = {
        id: generateId(), latitude: lat, longitude: lng, emoji: cpEmoji,
        label: cpLabel || `CP ${gameMap.checkpoints.length + 1}`, content: cpContent,
        radius, hint: cpHint || undefined, imageUrl: cpImageUrl || undefined,
        order: gameMap.checkpoints.length,
      };
      const updated = { ...gameMap, checkpoints: [...gameMap.checkpoints, newCP] };
      if (updated.checkpoints.length === 1) {
        updated.centerLat = lat; updated.centerLng = lng;
      }
      updateAndSave(updated);
    }
    resetForm();
    setShowForm(false);
  }, [cpLat, cpLng, cpEmoji, cpLabel, cpContent, cpRadius, cpHint, cpImageUrl, editingCP, gameMap]);

  const quickDrop = useCallback(() => {
    // Quick drop: immediately place a CP at the current coordinates with defaults
    const lat = parseFloat(cpLat);
    const lng = parseFloat(cpLng);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('No Location', 'Tap the map first to select a location');
      return;
    }
    const newCP: Checkpoint = {
      id: generateId(), latitude: lat, longitude: lng, emoji: cpEmoji,
      label: `CP ${gameMap.checkpoints.length + 1}`, content: '',
      radius: parseInt(cpRadius) || 50, order: gameMap.checkpoints.length,
    };
    const updated = { ...gameMap, checkpoints: [...gameMap.checkpoints, newCP] };
    if (updated.checkpoints.length === 1) {
      updated.centerLat = lat; updated.centerLng = lng;
    }
    updateAndSave(updated);
    setCpLat(''); setCpLng('');
  }, [cpLat, cpLng, cpEmoji, cpRadius, gameMap]);

  const deleteCP = useCallback((id: string) => {
    Alert.alert('Delete CP', 'Remove this checkpoint?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const updated = gameMap.checkpoints.filter((cp) => cp.id !== id);
        updateAndSave({ ...gameMap, checkpoints: updated });
      }},
    ]);
  }, [gameMap]);

  const startEdit = (cp: Checkpoint) => {
    setEditingCP(cp);
    setCpLat(cp.latitude.toString()); setCpLng(cp.longitude.toString());
    setCpEmoji(cp.emoji); setCpLabel(cp.label); setCpContent(cp.content || '');
    setCpRadius(cp.radius.toString()); setCpHint(cp.hint || ''); setCpImageUrl(cp.imageUrl || '');
    setShowForm(true);
  };

  const exportJSON = () => JSON.stringify({
    type: 'radar_hunt_map', version: 1,
    map: { id: gameMap.id, name: gameMap.name, description: gameMap.description,
      creatorName: gameMap.creatorName, zoomRange: gameMap.zoomRange || 5000,
      checkpoints: gameMap.checkpoints, centerLat: gameMap.centerLat,
      centerLng: gameMap.centerLng, createdAt: gameMap.createdAt },
  }, null, 2);



  const centerLat = gameMap.checkpoints.length > 0
    ? gameMap.checkpoints.reduce((s, c) => s + c.latitude, 0) / gameMap.checkpoints.length
    : gameMap.centerLat;
  const centerLng = gameMap.checkpoints.length > 0
    ? gameMap.checkpoints.reduce((s, c) => s + c.longitude, 0) / gameMap.checkpoints.length
    : gameMap.centerLng;

  const pendingLat = cpLat ? parseFloat(cpLat) : null;
  const pendingLng = cpLng ? parseFloat(cpLng) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{gameMap.name}</Text>
          <Text style={styles.headerSub}>
            {gameMap.checkpoints.length} checkpoints
          </Text>
        </View>
        {/* View toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'map' && styles.viewBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={15} color={viewMode === 'map' ? Colors.primary : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={15} color={viewMode === 'list' ? Colors.primary : Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowExport(true)} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={17} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ===== MAP VIEW (default) ===== */}
      {viewMode === 'map' && (
        <View style={styles.mapArea}>
          <LiveMapView
            checkpoints={gameMap.checkpoints}
            userLat={centerLat}
            userLng={centerLng}
            zoomRange={gameMap.zoomRange || 5000}
            foundIds={[]}
            showUser={false}
            interactive={true}
            darkMode={true}
            leaderMode={true}
            pendingLat={pendingLat}
            pendingLng={pendingLng}
            pendingEmoji={cpEmoji}
            pendingRadius={parseInt(cpRadius) || 50}
          />

          {/* Floating bottom action bar */}
          <View style={styles.mapBottomBar}>
            {/* Coordinate display */}
            {cpLat && cpLng ? (
              <View style={styles.coordDisplay}>
                <Ionicons name="location" size={13} color={Colors.primary} />
                <Text style={styles.coordText}>
                  {parseFloat(cpLat).toFixed(5)}, {parseFloat(cpLng).toFixed(5)}
                </Text>
              </View>
            ) : (
              <View style={styles.coordDisplay}>
                <Ionicons name="hand-left" size={13} color={Colors.textMuted} />
                <Text style={[styles.coordText, { color: Colors.textMuted }]}>
                  Tap map or search to pick location
                </Text>
              </View>
            )}

            <View style={styles.mapActions}>
              {/* Quick drop */}
              <TouchableOpacity
                style={[styles.quickDropBtn, (!cpLat || !cpLng) && styles.quickDropBtnDisabled]}
                onPress={quickDrop}
                disabled={!cpLat || !cpLng}
              >
                <Ionicons name="flash" size={16} color={cpLat && cpLng ? Colors.bg : Colors.textMuted} />
                <Text style={[styles.quickDropText, (!cpLat || !cpLng) && { color: Colors.textMuted }]}>
                  Quick Drop
                </Text>
              </TouchableOpacity>

              {/* Detailed add */}
              <TouchableOpacity
                style={styles.detailAddBtn}
                onPress={() => setShowForm(true)}
              >
                <Ionicons name="create" size={16} color={Colors.primary} />
                <Text style={styles.detailAddText}>
                  {cpLat && cpLng ? 'Edit & Place' : 'New CP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CP count badge */}
          <View style={styles.cpCountBadge}>
            <Text style={styles.cpCountText}>{gameMap.checkpoints.length}</Text>
            <Text style={styles.cpCountLabel}>CPs</Text>
          </View>
        </View>
      )}

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && (
        <>
          <View style={styles.listActionBar}>
            <GlowButton
              title="Add on Map"
              onPress={() => setViewMode('map')}
              variant="primary"
              size="sm"
              icon={<Ionicons name="map" size={14} color={Colors.bg} />}
            />
            <GlowButton
              title="Export"
              onPress={() => setShowExport(true)}
              variant="secondary"
              size="sm"
              icon={<Ionicons name="qr-code" size={14} color="#FFF" />}
            />
          </View>
          <FlatList
            data={gameMap.checkpoints}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📍</Text>
                <Text style={styles.emptyTitle}>No Checkpoints</Text>
                <Text style={styles.emptyDesc}>
                  Switch to Map view to place checkpoints by tapping the map
                </Text>
                <GlowButton
                  title="Open Map"
                  onPress={() => setViewMode('map')}
                  variant="primary"
                  size="sm"
                  style={{ marginTop: 16 }}
                  icon={<Ionicons name="map" size={16} color={Colors.bg} />}
                />
              </View>
            }
            renderItem={({ item, index }) => (
              <CheckpointCard
                checkpoint={item}
                index={index}
                onPress={() => setDetailCP(item)}
                onDelete={() => deleteCP(item.id)}
              />
            )}
          />
        </>
      )}

      {/* ===== FORM MODAL (bottom sheet) ===== */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.formOverlay}>
          <TouchableOpacity style={styles.formOverlayBg} onPress={() => { setShowForm(false); resetForm(); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View entering={FadeInUp.duration(300)} style={styles.formSheet}>
              <View style={styles.formHandle} />
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.65 }}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {editingCP ? '✏️ Edit Checkpoint' : '📍 Place Checkpoint'}
                  </Text>
                  <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                    <Ionicons name="close" size={22} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Coordinates (auto-filled from map) */}
                <View style={styles.coordRow}>
                  <View style={styles.coordBox}>
                    <Ionicons name="location" size={14} color={Colors.primary} />
                    <Text style={styles.coordBoxText}>
                      {cpLat && cpLng
                        ? `${parseFloat(cpLat).toFixed(5)}, ${parseFloat(cpLng).toFixed(5)}`
                        : 'No location selected'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.coordEditBtn}
                    onPress={() => {
                      Alert.prompt ? Alert.prompt('Latitude', '', (v) => setCpLat(v)) : null;
                    }}
                  >
                    <Ionicons name="pencil" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Manual coord inputs (collapsed) */}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Lat</Text>
                    <TextInput style={styles.input} placeholder="22.3193" placeholderTextColor={Colors.textMuted} value={cpLat} onChangeText={setCpLat} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Lng</Text>
                    <TextInput style={styles.input} placeholder="114.1694" placeholderTextColor={Colors.textMuted} value={cpLng} onChangeText={setCpLng} keyboardType="numeric" />
                  </View>
                </View>

                {/* Emoji + Name row */}
                <View style={[styles.row, { marginTop: 8 }]}>
                  <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojiPicker(true)}>
                    <Text style={styles.emojiBtnText}>{cpEmoji}</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput style={styles.input} placeholder="Checkpoint name" placeholderTextColor={Colors.textMuted} value={cpLabel} onChangeText={setCpLabel} />
                  </View>
                </View>

                {/* Content */}
                <Text style={styles.fieldLabel}>Content <Text style={styles.fieldOpt}>(shown when found)</Text></Text>
                <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Text, riddle, instructions..." placeholderTextColor={Colors.textMuted} value={cpContent} onChangeText={setCpContent} multiline textAlignVertical="top" />

                {/* Image URL */}
                <Text style={styles.fieldLabel}>Image URL <Text style={styles.fieldOpt}>(optional)</Text></Text>
                <TextInput style={styles.input} placeholder="https://..." placeholderTextColor={Colors.textMuted} value={cpImageUrl} onChangeText={setCpImageUrl} autoCapitalize="none" />

                {/* Radius */}
                <Text style={styles.fieldLabel}>Detection Radius</Text>
                <View style={styles.radiusRow}>
                  {['3', '5', '10', '20', '50'].map((r) => (
                    <TouchableOpacity key={r} style={[styles.radiusChip, cpRadius === r && styles.radiusChipActive]} onPress={() => setCpRadius(r)}>
                      <Text style={[styles.radiusChipText, cpRadius === r && styles.radiusChipTextActive]}>{r}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Hint */}
                <Text style={styles.fieldLabel}>Hint <Text style={styles.fieldOpt}>(visible before finding)</Text></Text>
                <TextInput style={styles.input} placeholder="A clue for players..." placeholderTextColor={Colors.textMuted} value={cpHint} onChangeText={setCpHint} />

                {/* Submit */}
                <View style={[styles.row, { marginTop: 14, marginBottom: 20 }]}>
                  <GlowButton
                    title="Cancel"
                    onPress={() => { setShowForm(false); resetForm(); }}
                    variant="ghost"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <GlowButton
                    title={editingCP ? 'Update' : 'Place CP'}
                    onPress={addOrUpdateCP}
                    variant="primary"
                    size="sm"
                    style={{ flex: 2 }}
                    icon={<Ionicons name={editingCP ? 'checkmark' : 'add-circle'} size={16} color={Colors.bg} />}
                    disabled={!cpLat || !cpLng}
                  />
                </View>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modals */}
      <EmojiPicker visible={showEmojiPicker} onSelect={setCpEmoji} onClose={() => setShowEmojiPicker(false)} selected={cpEmoji} />
      <CPDetailModal visible={!!detailCP} checkpoint={detailCP} onClose={() => setDetailCP(null)} />

      <QRModal visible={showExport} onClose={() => setShowExport(false)} data={exportJSON()} compactData={encodeMapForQR(gameMap)} title="Export Map" mode="export" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1, marginLeft: 4 },
  headerTitle: { color: Colors.text, fontSize: 15, fontWeight: '800' },
  headerSub: { color: Colors.textMuted, fontSize: 10 },
  viewToggle: {
    flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, marginRight: 4,
  },
  viewBtn: { paddingHorizontal: 8, paddingVertical: 5 },
  viewBtnActive: { backgroundColor: Colors.bgCardLight, borderRadius: 7 },
  iconBtn: { padding: 6 },
  // Map area
  mapArea: { flex: 1, position: 'relative' },
  mapBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,14,26,0.92)',
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    paddingBottom: 14,
  },
  coordDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  coordText: {
    color: Colors.primary, fontSize: 12, fontFamily: 'monospace', fontWeight: '600',
  },
  mapActions: {
    flexDirection: 'row', gap: 8,
  },
  quickDropBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  quickDropBtnDisabled: {
    backgroundColor: Colors.bgCardLight,
  },
  quickDropText: {
    color: Colors.bg, fontSize: 13, fontWeight: '700',
  },
  detailAddBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.bgCardLight, borderRadius: 10, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.primary,
  },
  detailAddText: {
    color: Colors.primary, fontSize: 13, fontWeight: '700',
  },
  cpCountBadge: {
    position: 'absolute', top: 52, right: 12,
    backgroundColor: 'rgba(10,14,26,0.9)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  cpCountText: { color: Colors.primary, fontSize: 18, fontWeight: '900' },
  cpCountLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  // List
  listActionBar: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  list: { padding: 14, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
  // Form sheet
  formOverlay: { flex: 1, justifyContent: 'flex-end' },
  formOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  formSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10,
  },
  formHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight,
    alignSelf: 'center', marginBottom: 10,
  },
  formHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  formTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  coordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  coordBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.glow, borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)',
  },
  coordBoxText: { color: Colors.primary, fontSize: 12, fontFamily: 'monospace', fontWeight: '600' },
  coordEditBtn: { padding: 8 },
  row: { flexDirection: 'row', gap: 8 },
  emojiBtn: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.bgInput,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
    marginTop: 18,
  },
  emojiBtnText: { fontSize: 28 },
  fieldLabel: {
    color: Colors.textDim, fontSize: 10, fontWeight: '600', marginBottom: 3, marginTop: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldOpt: { color: Colors.textMuted, fontWeight: '400', textTransform: 'none', fontSize: 9 },
  input: {
    backgroundColor: Colors.bgInput, borderRadius: 8, padding: 10,
    color: Colors.text, fontSize: 13, borderWidth: 1, borderColor: Colors.border,
  },
  radiusRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  radiusChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border,
  },
  radiusChipActive: { borderColor: Colors.primary, backgroundColor: Colors.glow },
  radiusChipText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  radiusChipTextActive: { color: Colors.primary },
});
