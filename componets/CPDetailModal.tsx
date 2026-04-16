import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../lib/colors';
import { Checkpoint } from '../lib/types';
import { formatDistance } from '../lib/utils';

interface Props {
  visible: boolean;
  checkpoint: Checkpoint | null;
  distance?: number;
  isFound?: boolean;
  onClose: () => void;
}

export default function CPDetailModal({ visible, checkpoint, distance, isFound, onClose }: Props) {
  if (!checkpoint) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.emoji}>{checkpoint.emoji}</Text>
              <View>
                <Text style={styles.title}>{checkpoint.label}</Text>
                <Text style={styles.coords}>
                  {checkpoint.latitude.toFixed(5)}, {checkpoint.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Status badges */}
          <View style={styles.badgeRow}>
            {isFound && (
              <View style={styles.foundBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.foundText}>Found!</Text>
              </View>
            )}
            <View style={styles.radiusBadge}>
              <Ionicons name="radio-outline" size={14} color={Colors.primary} />
              <Text style={styles.radiusText}>{checkpoint.radius}m radius</Text>
            </View>
            {distance !== undefined && (
              <View style={styles.distBadge}>
                <Ionicons name="navigate" size={14} color={Colors.warning} />
                <Text style={styles.distText}>{formatDistance(distance)}</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Image */}
            {checkpoint.imageUrl ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: checkpoint.imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                  placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
                  transition={300}
                />
              </View>
            ) : null}

            {/* Text content */}
            {checkpoint.content ? (
              <View style={styles.contentBox}>
                <View style={styles.contentHeader}>
                  <Ionicons name="document-text" size={16} color={Colors.secondary} />
                  <Text style={styles.contentLabel}>Content</Text>
                </View>
                <Text style={styles.contentText}>{checkpoint.content}</Text>
              </View>
            ) : null}

            {/* Hint */}
            {checkpoint.hint ? (
              <View style={styles.hintBox}>
                <View style={styles.hintHeader}>
                  <Ionicons name="bulb" size={16} color={Colors.warning} />
                  <Text style={styles.hintLabel}>Hint</Text>
                </View>
                <Text style={styles.hintText}>{checkpoint.hint}</Text>
              </View>
            ) : null}

            {/* No content message */}
            {!checkpoint.content && !checkpoint.imageUrl && !checkpoint.hint && (
              <View style={styles.emptyContent}>
                <Ionicons name="information-circle-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No additional content for this checkpoint</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  coords: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  foundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  foundText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  radiusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.glow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  radiusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  contentBox: {
    backgroundColor: Colors.bgCardLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  contentLabel: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  hintBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  hintLabel: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintText: {
    color: Colors.warning,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  doneBtn: {
    backgroundColor: Colors.bgCardLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnText: {
    color: Colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
});
