import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import GlowButton from '../components/GlowButton';

interface Props {
  onSelectRole: (role: 'leader' | 'member') => void;
}

export default function RoleSelectScreen({ onSelectRole }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>📡</Text>
          <View style={styles.logoGlow} />
        </View>
        <Text style={styles.title}>RADAR HUNT</Text>
        <Text style={styles.subtitle}>City Checkpoint Tracker</Text>
        <View style={styles.divider} />
        <Text style={styles.desc}>
          Create treasure hunts across the city or join as a member to find hidden checkpoints.
        </Text>
      </Animated.View>

      <View style={styles.roles}>
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.roleCard}>
          <View style={styles.roleIconWrap}>
            <Ionicons name="compass" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.roleTitle}>Leader</Text>
          <Text style={styles.roleDesc}>
            Create maps, place checkpoints with emojis & images, set detection radius, and export for your team.
          </Text>
          <GlowButton
            title="Create Game"
            onPress={() => onSelectRole('leader')}
            variant="primary"
            size="lg"
            style={{ marginTop: 16, width: '100%' }}
            icon={<Ionicons name="add-circle" size={20} color={Colors.bg} />}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.roleCard}>
          <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
            <Ionicons name="search" size={36} color={Colors.secondary} />
          </View>
          <Text style={styles.roleTitle}>Member</Text>
          <Text style={styles.roleDesc}>
            Import a map, use radar to track checkpoints, see distances, and find them all!
          </Text>
          <GlowButton
            title="Join Game"
            onPress={() => onSelectRole('member')}
            variant="secondary"
            size="lg"
            style={{ marginTop: 16, width: '100%' }}
            icon={<Ionicons name="download" size={20} color="#FFF" />}
          />
        </Animated.View>
      </View>

      {/* --- 修改部分：將原本單一嘅 Text 改為 View 包住兩行文字 --- */}
      <Animated.View entering={FadeInDown.delay(900).duration(600)}>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Works offline • iOS & Android</Text>
          <Text style={styles.copyrightText}>© 2026 SKWSCOUT. All rights reserved.</Text>
        </View>
      </Animated.View>
      {/* -------------------------------------------------------- */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 64,
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glowStrong,
    top: -8,
    left: -8,
    zIndex: -1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textDim,
    letterSpacing: 2,
    marginTop: 4,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.primary,
    marginVertical: 16,
    borderRadius: 1,
  },
  desc: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  roles: {
    flex: 1,
    gap: 16,
  },
  roleCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  roleDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  // --- 修改及新增 Styles ---
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4, // 加少少少 margin 分開兩行
  },
  copyrightText: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.6, // 半透明，唔搶鏡
    letterSpacing: 0.5,
  },
  // -------------------------
});
