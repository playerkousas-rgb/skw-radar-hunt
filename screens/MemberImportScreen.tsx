import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { GameMap } from '../lib/types';
import { saveActiveMap, loadActiveMap } from '../lib/storage';
import { decodeMapFromQR } from '../lib/utils';
import GlowButton from '../components/GlowButton';
import QRModal from '../components/QRModal';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  onMapLoaded: (map: GameMap) => void;
  onBack: () => void;
}

export default function MemberImportScreen({ onMapLoaded, onBack }: Props) {
  const [jsonInput, setJsonInput] = useState('');
  const [existingMap, setExistingMap] = useState<GameMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRImport, setShowQRImport] = useState(false);

  useEffect(() => {
    loadActiveMap().then((m) => {
      setExistingMap(m);
      setLoading(false);
    });
  }, []);

  const tryParseAndLoad = (rawData: string) => {
    const decoded = decodeMapFromQR(rawData);
    if (decoded && decoded.map) {
      const map: GameMap = {
        id: decoded.map.id || Date.now().toString(),
        name: decoded.map.name || 'Imported Map',
        description: decoded.map.description || '',
        checkpoints: (decoded.map.checkpoints || []).map((cp: any, idx: number) => ({
          id: cp.id || `cp_${idx}`,
          latitude: cp.latitude,
          longitude: cp.longitude,
          emoji: cp.emoji || '📍',
          label: cp.label || `CP ${idx + 1}`,
          content: cp.content || '',
          imageUrl: cp.imageUrl || undefined,
          radius: cp.radius || 50,
          hint: cp.hint || '',
          order: cp.order ?? idx,
        })),
        createdAt: decoded.map.createdAt || Date.now(),
        creatorName: decoded.map.creatorName || 'Unknown',
        centerLat: decoded.map.centerLat || decoded.map.checkpoints?.[0]?.latitude || 0,
        centerLng: decoded.map.centerLng || decoded.map.checkpoints?.[0]?.longitude || 0,
        zoomRange: decoded.map.zoomRange || 5000,
      };

      if (!map.checkpoints || map.checkpoints.length === 0) {
        Alert.alert('Empty Map', 'This map has no checkpoints.');
        return;
      }

      saveActiveMap(map);
      onMapLoaded(map);
    } else {
      Alert.alert('Invalid Data', 'Could not parse the map data. Please check the format.');
    }
  };

  const importJSON = () => {
    if (!jsonInput.trim()) return;
    tryParseAndLoad(jsonInput.trim());
  };

  const handleQRImport = (data: string) => {
    setShowQRImport(false);
    tryParseAndLoad(data);
  };

  const handlePaste = async () => {
    try {
      let text = '';
      if (Platform.OS === 'web') {
        text = await navigator.clipboard.readText();
      } else {
        const Clipboard = require('expo-clipboard');
        text = await Clipboard.getStringAsync();
      }
      if (text) {
        setJsonInput(text);
      } else {
        Alert.alert('Empty', 'Clipboard is empty.');
      }
    } catch {
      Alert.alert('Error', 'Could not read clipboard.');
    }
  };

  const loadDemo = () => {
    const demoMap: GameMap = {
      id: 'demo_' + Date.now(),
      name: 'Hong Kong Discovery',
      description: 'Explore iconic spots across Hong Kong!',
      creatorName: 'Radar Hunt',
      createdAt: Date.now(),
      centerLat: 22.3193,
      centerLng: 114.1694,
      zoomRange: 20000,
      checkpoints: [
        {
          id: 'cp1',
          latitude: 22.2796,
          longitude: 114.1594,
          emoji: '⭐',
          label: 'Victoria Peak',
          content: '太平山頂 — The most famous viewpoint in Hong Kong. Take a photo of the skyline to prove you were here!',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Hong_Kong_Night_Skyline_2.jpg/1280px-Hong_Kong_Night_Skyline_2.jpg',
          radius: 20,
          hint: 'The highest point with the best city view',
          order: 0,
        },
        {
          id: 'cp2',
          latitude: 22.2934,
          longitude: 114.1697,
          emoji: '🏆',
          label: 'Star Ferry Pier',
          content: '天星小輪 — This iconic ferry has been crossing Victoria Harbour since 1888. Find the green and white boats!',
          radius: 15,
          hint: 'Cross the harbour on this famous ride',
          order: 1,
        },
        {
          id: 'cp3',
          latitude: 22.3964,
          longitude: 114.1095,
          emoji: '💎',
          label: 'Temple Street Market',
          content: '廟街夜市 — The most famous night market in Hong Kong. Look for fortune tellers and street food!',
          radius: 20,
          hint: 'Night market full of treasures in Yau Ma Tei',
          order: 2,
        },
        {
          id: 'cp4',
          latitude: 22.3503,
          longitude: 114.1848,
          emoji: '🚀',
          label: 'Lion Rock',
          content: '獅子山 — The spirit of Hong Kong! This mountain symbolizes the determination of Hong Kong people.',
          radius: 30,
          hint: 'The lion-shaped rock that watches over Kowloon',
          order: 3,
        },
        {
          id: 'cp5',
          latitude: 22.2474,
          longitude: 114.1735,
          emoji: '🌟',
          label: 'Ocean Park',
          content: '海洋公園 — Where marine life meets roller coasters! Find the entrance with the whale statue.',
          radius: 25,
          hint: 'Where marine life meets adventure on the south side',
          order: 4,
        },
      ],
    };
    saveActiveMap(demoMap);
    onMapLoaded(demoMap);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Join Game</Text>
          <Text style={styles.headerSub}>Import a map to start hunting</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Existing map */}
        {existingMap && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.existingCard}>
            <View style={styles.existingHeader}>
              <Ionicons name="map" size={22} color={Colors.success} />
              <Text style={styles.existingTitle}>Continue Game</Text>
            </View>
            <Text style={styles.existingName}>{existingMap.name}</Text>
            <Text style={styles.existingDesc}>
              {existingMap.checkpoints.length} checkpoints • by {existingMap.creatorName}
            </Text>
            <GlowButton
              title="Resume"
              onPress={() => onMapLoaded(existingMap)}
              variant="primary"
              style={{ marginTop: 12 }}
              icon={<Ionicons name="play" size={18} color={Colors.bg} />}
            />
          </Animated.View>
        )}

        {/* QR Code Import */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
              <Ionicons name="qr-code" size={24} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Scan / Paste QR Data</Text>
              <Text style={styles.sectionDesc}>Scan QR code or paste compact data from leader</Text>
            </View>
          </View>
          <GlowButton
            title="Open QR Import"
            onPress={() => setShowQRImport(true)}
            variant="secondary"
            style={{ marginTop: 10 }}
            icon={<Ionicons name="scan" size={18} color="#FFF" />}
          />
        </Animated.View>

        {/* JSON Import */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(0,240,255,0.1)' }]}>
              <Ionicons name="code-slash" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Import JSON</Text>
              <Text style={styles.sectionDesc}>Paste full JSON or compact data</Text>
            </View>
          </View>
          <TextInput
            style={styles.jsonInput}
            placeholder='Paste map data here...'
            placeholderTextColor={Colors.textMuted}
            value={jsonInput}
            onChangeText={setJsonInput}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <View style={styles.importActions}>
            <GlowButton
              title="Paste"
              onPress={handlePaste}
              variant="ghost"
              size="sm"
              icon={<Ionicons name="clipboard" size={16} color={Colors.primary} />}
              style={{ flex: 1 }}
            />
            <GlowButton
              title="Import"
              onPress={importJSON}
              variant="primary"
              size="sm"
              disabled={!jsonInput.trim()}
              icon={<Ionicons name="download" size={16} color={jsonInput.trim() ? Colors.bg : Colors.textMuted} />}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Demo */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <Ionicons name="game-controller" size={24} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Try Demo</Text>
              <Text style={styles.sectionDesc}>Load Hong Kong Discovery (5 CPs, city-wide)</Text>
            </View>
          </View>
          <GlowButton
            title="Load Demo Map"
            onPress={loadDemo}
            variant="ghost"
            style={{ marginTop: 10 }}
            icon={<Ionicons name="rocket" size={18} color={Colors.primary} />}
          />
        </Animated.View>
      </ScrollView>

      {/* QR Import Modal */}
      <QRModal
        visible={showQRImport}
        onClose={() => setShowQRImport(false)}
        data=""
        compactData=""
        title="Import via QR / Data"
        mode="import"
        onImport={handleQRImport}
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
  backBtn: { padding: 8 },
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  existingCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  existingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  existingTitle: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  existingName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  existingDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  jsonInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    padding: 14,
    color: Colors.radarGreen,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  importActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
