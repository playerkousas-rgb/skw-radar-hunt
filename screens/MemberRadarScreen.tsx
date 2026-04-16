import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../lib/colors';
import { GameMap, Checkpoint } from '../lib/types';
import {
  calculateDistance,
  formatDistance,
  getNearestCheckpoint,
  getDirectionAngle,
} from '../lib/utils';
import { saveFoundCheckpoints, loadFoundCheckpoints } from '../lib/storage';
import RadarView from '../components/RadarView';
import CheckpointCard from '../components/CheckpointCard';
import CPDetailModal from '../components/CPDetailModal';
import LiveMapView from '../components/LiveMapView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  map: GameMap;
  onBack: () => void;
}

const DEFAULT_LAT = 22.3193;
const DEFAULT_LNG = 114.1694;

// Fixed sim step: ~100m per tap
const SIM_STEP = 0.001;

type TabType = 'radar' | 'live' | 'list';

export default function MemberRadarScreen({ map, onBack }: Props) {
  const [currentLat, setCurrentLat] = useState(DEFAULT_LAT);
  const [currentLng, setCurrentLng] = useState(DEFAULT_LNG);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('radar');
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [detailCP, setDetailCP] = useState<Checkpoint | null>(null);
  const [detailDist, setDetailDist] = useState<number | undefined>(undefined);

  const foundPulse = useSharedValue(1);

  useEffect(() => {
    loadFoundCheckpoints(map.id).then(setFoundIds);
    tryGetLocation();
  }, []);

  const tryGetLocation = async () => {
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationAvailable(true);
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLat(loc.coords.latitude);
        setCurrentLng(loc.coords.longitude);
        Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 2 },
          (loc: any) => {
            setCurrentLat(loc.coords.latitude);
            setCurrentLng(loc.coords.longitude);
          }
        );
      }
    } catch (e) {
      console.log('Location not available, using default');
    }
  };

  const unfoundCPs = map.checkpoints.filter((cp) => !foundIds.includes(cp.id));
  const nearest = getNearestCheckpoint(unfoundCPs, currentLat, currentLng);
  const allCPsWithDist = map.checkpoints.map((cp) => ({
    ...cp,
    distance: calculateDistance(currentLat, currentLng, cp.latitude, cp.longitude),
    isFound: foundIds.includes(cp.id),
  })).sort((a, b) => a.distance - b.distance);

  // Auto-scale radar: range = 2x nearest distance, clamped between 50m and 50km
  const radarRange = nearest
    ? Math.max(50, Math.min(50000, nearest.distance * 2.5))
    : 5000;

  const checkArrival = useCallback(() => {
    for (const cp of unfoundCPs) {
      const dist = calculateDistance(currentLat, currentLng, cp.latitude, cp.longitude);
      if (dist <= cp.radius) {
        const newFound = [...foundIds, cp.id];
        setFoundIds(newFound);
        saveFoundCheckpoints(map.id, newFound);
        foundPulse.value = withSpring(1.3, {}, () => {
          foundPulse.value = withSpring(1);
        });
        setDetailCP(cp);
        setDetailDist(dist);
        Alert.alert(
          `${cp.emoji} Checkpoint Found!`,
          `You discovered "${cp.label}"!\n\n${newFound.length}/${map.checkpoints.length} checkpoints found.`,
          [{ text: 'Awesome!' }]
        );
        break;
      }
    }
  }, [currentLat, currentLng, foundIds, unfoundCPs]);

  useEffect(() => {
    checkArrival();
  }, [currentLat, currentLng]);

  const simulateMove = (dlat: number, dlng: number) => {
    setCurrentLat((prev) => prev + dlat * SIM_STEP);
    setCurrentLng((prev) => prev + dlng * SIM_STEP);
  };

  const progress = foundIds.length / Math.max(map.checkpoints.length, 1);
  const directionToNearest = nearest
    ? getDirectionAngle(currentLat, currentLng, nearest.checkpoint.latitude, nearest.checkpoint.longitude)
    : 0;

  const foundPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: foundPulse.value }],
  }));

  const openCPDetail = (cp: Checkpoint) => {
    const dist = calculateDistance(currentLat, currentLng, cp.latitude, cp.longitude);
    setDetailCP(cp);
    setDetailDist(dist);
  };

  // Listen for map messages (CP clicks from iframe)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cp_click') {
          const cp = map.checkpoints.find((c) => c.id === data.id);
          if (cp) openCPDetail(cp);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [map.checkpoints, currentLat, currentLng]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'radar', label: 'Radar', icon: 'radio' },
    { key: 'live', label: 'Live Map', icon: 'map' },
    { key: 'list', label: 'List', icon: 'list' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{map.name}</Text>
          <Text style={styles.headerSub}>by {map.creatorName}</Text>
        </View>
        <Animated.View style={[styles.progressBadge, foundPulseStyle]}>
          <Text style={styles.progressText}>
            {foundIds.length}/{map.checkpoints.length}
          </Text>
        </Animated.View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={15}
              color={activeTab === tab.key ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== RADAR TAB ===== */}
      {activeTab === 'radar' && (
        <View style={styles.radarContainer}>
          {nearest ? (
            <>
              <Animated.View entering={FadeInUp.duration(600)}>
                <RadarView
                  distance={nearest.distance}
                  direction={directionToNearest}
                  emoji={nearest.checkpoint.emoji}
                  size={Math.min(SCREEN_WIDTH - 60, 220)}
                  maxRange={radarRange}
                />
              </Animated.View>

              <View style={styles.scaleIndicator}>
                <View style={styles.scaleLine} />
                <Text style={styles.scaleText}>{formatDistance(radarRange)} range</Text>
                <View style={styles.scaleLine} />
              </View>

              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.nearestInfo}>
                <TouchableOpacity onPress={() => openCPDetail(nearest.checkpoint)} activeOpacity={0.7}>
                  <View style={styles.nearestRow}>
                    <Text style={styles.nearestEmoji}>{nearest.checkpoint.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nearestLabel}>{nearest.checkpoint.label}</Text>
                      {nearest.checkpoint.content ? (
                        <Text style={styles.nearestContentHint} numberOfLines={1}>
                          📄 Has content — tap to view
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={styles.nearestDist}>{formatDistance(nearest.distance)}</Text>
                <Text style={styles.triggerHint}>
                  Triggers within {nearest.checkpoint.radius}m
                </Text>
                {nearest.distance <= nearest.checkpoint.radius && (
                  <View style={styles.inRangeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.inRangeText}>In Range!</Text>
                  </View>
                )}
                {nearest.checkpoint.hint && (
                  <View style={styles.hintBox}>
                    <Ionicons name="bulb" size={14} color={Colors.warning} />
                    <Text style={styles.hintText}>{nearest.checkpoint.hint}</Text>
                  </View>
                )}
              </Animated.View>

              {!locationAvailable && (
                <View style={styles.simControls}>
                  <Text style={styles.simLabel}>Simulate Movement (~100m/tap)</Text>
                  <View style={styles.simBtns}>
                    <TouchableOpacity style={styles.simBtn} onPress={() => simulateMove(1, 0)}>
                      <Ionicons name="arrow-up" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.simBtnsRow}>
                    <TouchableOpacity style={styles.simBtn} onPress={() => simulateMove(0, -1)}>
                      <Ionicons name="arrow-back" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.simBtn} onPress={() => simulateMove(-1, 0)}>
                      <Ionicons name="arrow-down" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.simBtn} onPress={() => simulateMove(0, 1)}>
                      <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.allFoundContainer}>
              <Text style={styles.allFoundEmoji}>🎉</Text>
              <Text style={styles.allFoundTitle}>All Found!</Text>
              <Text style={styles.allFoundDesc}>
                You discovered all {map.checkpoints.length} checkpoints!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ===== LIVE MAP TAB ===== */}
      {activeTab === 'live' && (
        <View style={styles.liveMapContainer}>
          <LiveMapView
            checkpoints={map.checkpoints}
            userLat={currentLat}
            userLng={currentLng}
            zoomRange={5000}
            foundIds={foundIds}
            onCPPress={openCPDetail}
            showUser={true}
            interactive={true}
            darkMode={true}
          />
          {/* Floating info bar */}
          <View style={styles.mapFloatingBar}>
            <View style={styles.mapFloatItem}>
              <Ionicons name="location" size={12} color={Colors.primary} />
              <Text style={styles.mapFloatText}>
                {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
              </Text>
            </View>
            {nearest && (
              <View style={styles.mapFloatItem}>
                <Text style={styles.mapFloatEmoji}>{nearest.checkpoint.emoji}</Text>
                <Text style={styles.mapFloatDist}>{formatDistance(nearest.distance)}</Text>
              </View>
            )}
            {!locationAvailable && (
              <View style={styles.simBadge}>
                <Text style={styles.simBadgeText}>SIM</Text>
              </View>
            )}
          </View>

          {!locationAvailable && (
            <View style={styles.mapSimOverlay}>
              <TouchableOpacity style={styles.simBtnMap} onPress={() => simulateMove(1, 0)}>
                <Ionicons name="arrow-up" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <TouchableOpacity style={styles.simBtnMap} onPress={() => simulateMove(0, -1)}>
                  <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.simBtnMap} onPress={() => simulateMove(-1, 0)}>
                  <Ionicons name="arrow-down" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.simBtnMap} onPress={() => simulateMove(0, 1)}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ===== LIST TAB ===== */}
      {activeTab === 'list' && (
        <FlatList
          data={allCPsWithDist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <CheckpointCard
              checkpoint={item}
              distance={item.distance}
              index={index}
              showDistance
              isFound={item.isFound}
              onPress={() => openCPDetail(item)}
            />
          )}
        />
      )}

      {/* Bottom stats */}
      <View style={styles.bottomStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{foundIds.length}</Text>
          <Text style={styles.statLabel}>Found</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unfoundCPs.length}</Text>
          <Text style={styles.statLabel}>Left</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {nearest ? formatDistance(nearest.distance) : '--'}
          </Text>
          <Text style={styles.statLabel}>Nearest</Text>
        </View>
      </View>

      <CPDetailModal
        visible={!!detailCP}
        checkpoint={detailCP}
        distance={detailDist}
        isFound={detailCP ? foundIds.includes(detailCP.id) : false}
        onClose={() => { setDetailCP(null); setDetailDist(undefined); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, marginLeft: 6 },
  headerTitle: { color: Colors.text, fontSize: 16, fontWeight: '800' },
  headerSub: { color: Colors.textMuted, fontSize: 10 },
  progressBadge: {
    backgroundColor: Colors.glow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary,
  },
  progressText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  progressBar: { height: 3, backgroundColor: Colors.border, marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 10,
    backgroundColor: Colors.bgCard, borderRadius: 10, padding: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7, borderRadius: 8, gap: 4,
  },
  tabActive: { backgroundColor: Colors.bgCardLight },
  tabText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  // Radar
  radarContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  scaleIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, opacity: 0.6 },
  scaleLine: { width: 20, height: 1, backgroundColor: Colors.textMuted },
  scaleText: { color: Colors.textMuted, fontSize: 10, fontFamily: 'monospace' },
  nearestInfo: { alignItems: 'center', marginTop: 12 },
  nearestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  nearestEmoji: { fontSize: 30 },
  nearestLabel: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  nearestContentHint: { color: Colors.secondary, fontSize: 11, marginTop: 2 },
  nearestDist: { color: Colors.primary, fontSize: 24, fontWeight: '900', fontFamily: 'monospace', marginTop: 2 },
  triggerHint: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  inRangeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginTop: 6,
  },
  inRangeText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, marginTop: 8, maxWidth: 280,
  },
  hintText: { color: Colors.warning, fontSize: 12, fontStyle: 'italic', flex: 1 },
  simControls: {
    alignItems: 'center', marginTop: 10, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 10,
  },
  simLabel: { color: Colors.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  simBtns: { flexDirection: 'row', justifyContent: 'center' },
  simBtnsRow: { flexDirection: 'row', gap: 3 },
  simBtn: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.bgCardLight,
    alignItems: 'center', justifyContent: 'center', margin: 2, borderWidth: 1, borderColor: Colors.border,
  },
  allFoundContainer: { alignItems: 'center' },
  allFoundEmoji: { fontSize: 60, marginBottom: 14 },
  allFoundTitle: { color: Colors.primary, fontSize: 24, fontWeight: '900', marginBottom: 8 },
  allFoundDesc: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  // Live Map
  liveMapContainer: { flex: 1, margin: 10, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  mapFloatingBar: {
    position: 'absolute', top: 10, left: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(17,24,39,0.85)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border,
  },
  mapFloatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapFloatText: { color: Colors.textDim, fontSize: 11, fontFamily: 'monospace' },
  mapFloatEmoji: { fontSize: 14 },
  mapFloatDist: { color: Colors.warning, fontSize: 12, fontWeight: '700' },
  simBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  simBadgeText: { color: Colors.warning, fontSize: 8, fontWeight: '700' },
  mapSimOverlay: {
    position: 'absolute', bottom: 14, right: 14, alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.85)', borderRadius: 12, padding: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  simBtnMap: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.bgCardLight,
    alignItems: 'center', justifyContent: 'center', margin: 1, borderWidth: 1, borderColor: Colors.border,
  },
  // List
  listContent: { padding: 16, paddingBottom: 20 },
  // Bottom
  bottomStats: {
    flexDirection: 'row', backgroundColor: Colors.bgCard,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 10, paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.primary, fontSize: 15, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  statDivider: { width: 1, backgroundColor: Colors.border },
});
