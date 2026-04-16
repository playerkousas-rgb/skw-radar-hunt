import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { ZOOM_PRESETS } from '../lib/types';
import { formatDistance } from '../lib/utils';

interface Props {
  visible: boolean;
  currentRange: number;
  onSelect: (range: number) => void;
  onClose: () => void;
}

export default function ZoomControl({ visible, currentRange, onSelect, onClose }: Props) {
  const [customValue, setCustomValue] = React.useState('');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="resize" size={20} color={Colors.primary} />
            <Text style={styles.title}>Map Scale</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Current range: <Text style={styles.currentValue}>{formatDistance(currentRange)}</Text>
          </Text>
          <Text style={styles.desc}>
            Choose how much area the radar / map view covers. Use a small range for park-level hunts, or a large range for city-wide adventures.
          </Text>

          <ScrollView style={styles.presetList} showsVerticalScrollIndicator={false}>
            {ZOOM_PRESETS.map((preset) => {
              const isActive = currentRange === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  style={[styles.presetItem, isActive && styles.presetItemActive]}
                  onPress={() => {
                    onSelect(preset.value);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.presetRange}>{formatDistance(preset.value)} radius</Text>
                  </View>
                  {/* Visual scale bar */}
                  <View style={styles.scaleBarContainer}>
                    <View
                      style={[
                        styles.scaleBar,
                        {
                          width: `${Math.min((preset.value / 60000) * 100, 100)}%`,
                          backgroundColor: isActive ? Colors.primary : Colors.borderLight,
                        },
                      ]}
                    />
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Custom input */}
            <View style={styles.customSection}>
              <Text style={styles.customLabel}>Custom Range (meters)</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="e.g. 2500"
                  placeholderTextColor={Colors.textMuted}
                  value={customValue}
                  onChangeText={setCustomValue}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.customBtn,
                    !customValue.trim() && styles.customBtnDisabled,
                  ]}
                  onPress={() => {
                    const val = parseInt(customValue);
                    if (val && val > 0 && val <= 200000) {
                      onSelect(val);
                      onClose();
                    }
                  }}
                  disabled={!customValue.trim()}
                >
                  <Text style={styles.customBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  subtitle: {
    color: Colors.textDim,
    fontSize: 13,
    marginBottom: 4,
  },
  currentValue: {
    color: Colors.primary,
    fontWeight: '700',
  },
  desc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  presetList: {
    maxHeight: 400,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  presetItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.glow,
  },
  presetIcon: {
    fontSize: 24,
  },
  presetInfo: {
    flex: 1,
  },
  presetLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  presetLabelActive: {
    color: Colors.primary,
  },
  presetRange: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  scaleBarContainer: {
    width: 50,
    height: 4,
    backgroundColor: Colors.bgInput,
    borderRadius: 2,
  },
  scaleBar: {
    height: 4,
    borderRadius: 2,
    minWidth: 4,
  },
  customSection: {
    marginTop: 8,
    backgroundColor: Colors.bgCardLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customLabel: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBtnDisabled: {
    backgroundColor: Colors.bgInput,
  },
  customBtnText: {
    color: Colors.bg,
    fontSize: 13,
    fontWeight: '700',
  },
});
