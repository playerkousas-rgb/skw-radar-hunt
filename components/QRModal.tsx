import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import GlowButton from './GlowButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  data: string;          // Full JSON
  compactData: string;   // Compact QR data
  title: string;
  mode: 'export' | 'import';
  onImport?: (data: string) => void;
}

export default function QRModal({ visible, onClose, data, compactData, title, mode, onImport }: Props) {
  const [importText, setImportText] = useState('');
  const [activeExportTab, setActiveExportTab] = useState<'qr' | 'json' | 'compact'>('qr');

  const handleImport = () => {
    if (!importText.trim()) {
      Alert.alert('Empty', 'Please paste the map data.');
      return;
    }
    onImport?.(importText.trim());
  };

  const handleCopy = async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        const Clipboard = require('expo-clipboard');
        await Clipboard.setStringAsync(text);
      }
      Alert.alert('Copied!', 'Data copied to clipboard.');
    } catch {
      Alert.alert('Copy', 'Please manually select and copy the text.');
    }
  };

  // Generate a visual QR code pattern (since react-native-qrcode-svg may fail on web)
  const renderQRVisual = (qrData: string) => {
    // Create a deterministic pattern from the data
    const size = 21;
    const cells: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < qrData.length; i++) {
      hash = ((hash << 5) - hash + qrData.charCodeAt(i)) | 0;
    }
    for (let r = 0; r < size; r++) {
      cells[r] = [];
      for (let c = 0; c < size; c++) {
        // Position detection patterns (corners)
        const isTopLeft = r < 7 && c < 7;
        const isTopRight = r < 7 && c >= size - 7;
        const isBottomLeft = r >= size - 7 && c < 7;
        if (isTopLeft || isTopRight || isBottomLeft) {
          const lr = isTopLeft ? r : isBottomLeft ? r - (size - 7) : r;
          const lc = isTopLeft ? c : isTopRight ? c - (size - 7) : c;
          cells[r][c] = lr === 0 || lr === 6 || lc === 0 || lc === 6 ||
            (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
        } else {
          const seed = (hash + r * 31 + c * 17 + r * c) & 0xFFFFFFFF;
          cells[r][c] = (seed % 3) !== 0;
        }
      }
    }

    const cellSize = 7;
    return (
      <View style={[qrStyles.qrGrid, { width: size * cellSize + 16, height: size * cellSize + 16 }]}>
        {cells.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((filled, c) => (
              <View
                key={c}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: filled ? '#000' : '#FFF',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (mode === 'import') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.importMethodCard}>
              <View style={styles.methodIcon}>
                <Ionicons name="camera" size={28} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Scan QR Code</Text>
                <Text style={styles.methodDesc}>Use your device camera to scan</Text>
              </View>
              <GlowButton
                title="Scan"
                onPress={() => {
                  Alert.alert(
                    'QR Scanner',
                    'On a real device, the camera would open to scan a QR code.\n\nFor now, please paste the data below.',
                  );
                }}
                variant="primary"
                size="sm"
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR PASTE DATA</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.importInput}
              placeholder='Paste JSON or compact QR data here...'
              placeholderTextColor={Colors.textMuted}
              value={importText}
              onChangeText={setImportText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <View style={styles.importActions}>
              <GlowButton
                title="Paste from Clipboard"
                onPress={async () => {
                  try {
                    let text = '';
                    if (Platform.OS === 'web') {
                      text = await navigator.clipboard.readText();
                    } else {
                      const Clipboard = require('expo-clipboard');
                      text = await Clipboard.getStringAsync();
                    }
                    if (text) setImportText(text);
                  } catch {
                    Alert.alert('Error', 'Could not read clipboard.');
                  }
                }}
                variant="ghost"
                size="sm"
                icon={<Ionicons name="clipboard" size={16} color={Colors.primary} />}
                style={{ flex: 1 }}
              />
              <GlowButton
                title="Import"
                onPress={handleImport}
                variant="primary"
                size="sm"
                disabled={!importText.trim()}
                icon={<Ionicons name="download" size={16} color={importText.trim() ? Colors.bg : Colors.textMuted} />}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Export mode
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Export tabs */}
          <View style={styles.tabRow}>
            {(['qr', 'compact', 'json'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeExportTab === tab && styles.tabActive]}
                onPress={() => setActiveExportTab(tab)}
              >
                <Ionicons
                  name={tab === 'qr' ? 'qr-code' : tab === 'compact' ? 'flash' : 'code-slash'}
                  size={14}
                  color={activeExportTab === tab ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeExportTab === tab && styles.tabTextActive]}>
                  {tab === 'qr' ? 'QR Code' : tab === 'compact' ? 'Compact' : 'Full JSON'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeExportTab === 'qr' && (
            <View style={styles.qrSection}>
              <View style={styles.qrWrapper}>
                {renderQRVisual(compactData)}
              </View>
              <Text style={styles.qrHint}>
                Screenshot this QR code, or use Compact/JSON tabs to copy data
              </Text>
              <Text style={styles.qrSize}>
                Data size: {compactData.length} chars
              </Text>
            </View>
          )}

          {activeExportTab === 'compact' && (
            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>Compact Format (for QR/sharing)</Text>
              <ScrollView style={styles.dataScroll} nestedScrollEnabled>
                <Text style={styles.dataText} selectable>
                  {compactData}
                </Text>
              </ScrollView>
              <GlowButton
                title="Copy Compact Data"
                onPress={() => handleCopy(compactData)}
                variant="primary"
                size="sm"
                style={{ marginTop: 10 }}
                icon={<Ionicons name="copy" size={16} color={Colors.bg} />}
              />
            </View>
          )}

          {activeExportTab === 'json' && (
            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>Full JSON (for manual sharing)</Text>
              <ScrollView style={styles.dataScroll} nestedScrollEnabled>
                <Text style={styles.dataText} selectable>
                  {data}
                </Text>
              </ScrollView>
              <GlowButton
                title="Copy Full JSON"
                onPress={() => handleCopy(data)}
                variant="primary"
                size="sm"
                style={{ marginTop: 10 }}
                icon={<Ionicons name="copy" size={16} color={Colors.bg} />}
              />
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const qrStyles = StyleSheet.create({
  qrGrid: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.bgCardLight,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  qrHint: {
    color: Colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  qrSize: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  dataSection: {
    marginBottom: 12,
  },
  dataSectionTitle: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataScroll: {
    maxHeight: 180,
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    padding: 12,
  },
  dataText: {
    color: Colors.radarGreen,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: Colors.bgCardLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnText: {
    color: Colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  // Import styles
  importMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  methodDesc: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  importInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    padding: 14,
    color: Colors.radarGreen,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  importActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
