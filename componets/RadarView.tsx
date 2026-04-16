import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../lib/colors';
import { formatDistance } from '../lib/utils';

interface Props {
  distance: number;
  direction: number;
  emoji: string;
  size?: number;
  maxRange?: number;  // Dynamic range in meters
}

export default function RadarView({ distance, direction, emoji, size = 220, maxRange = 5000 }: Props) {
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweep.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.3, 1.2]);
    const opacity = interpolate(pulse.value, [0, 0.5, 1], [0.6, 0.3, 0]);
    return { transform: [{ scale }], opacity };
  });

  const normalizedDist = Math.min(distance / maxRange, 0.9);
  const dotRadius = (size / 2 - 20) * normalizedDist;
  const rad = (direction - 90) * (Math.PI / 180);
  const dotX = Math.cos(rad) * dotRadius;
  const dotY = Math.sin(rad) * dotRadius;

  const ringCount = 4;
  const rings = Array.from({ length: ringCount }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background rings with distance labels */}
      {rings.map((r) => {
        const ringSize = (size / ringCount) * r;
        const ringDist = (maxRange / ringCount) * r;
        return (
          <View key={r}>
            <View
              style={[
                styles.ring,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                },
              ]}
            />
            {/* Distance label on ring */}
            <View style={[styles.ringLabel, { top: size / 2 - ringSize / 2 - 6, left: size / 2 + 4 }]}>
              <Text style={styles.ringLabelText}>{formatDistance(ringDist)}</Text>
            </View>
          </View>
        );
      })}

      {/* Pulse effect */}
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          pulseStyle,
        ]}
      />

      {/* Sweep line */}
      <Animated.View
        style={[
          styles.sweepContainer,
          { width: size, height: size },
          sweepStyle,
        ]}
      >
        <View
          style={[
            styles.sweepLine,
            { width: size / 2 - 10, left: size / 2 },
          ]}
        />
      </Animated.View>

      {/* Crosshairs */}
      <View style={[styles.crossH, { width: size - 20, top: size / 2 }]} />
      <View style={[styles.crossV, { height: size - 20, left: size / 2 }]} />

      {/* N/S/E/W labels */}
      <Text style={[styles.dirLabel, { top: 4, left: size / 2 - 4 }]}>N</Text>
      <Text style={[styles.dirLabel, { bottom: 4, left: size / 2 - 4 }]}>S</Text>
      <Text style={[styles.dirLabel, { top: size / 2 - 6, right: 4 }]}>E</Text>
      <Text style={[styles.dirLabel, { top: size / 2 - 6, left: 4 }]}>W</Text>

      {/* Target dot */}
      <View
        style={[
          styles.targetDot,
          {
            left: size / 2 + dotX - 16,
            top: size / 2 + dotY - 16,
          },
        ]}
      >
        <Text style={styles.targetEmoji}>{emoji}</Text>
      </View>

      {/* Center dot */}
      <View
        style={[
          styles.centerDot,
          { left: size / 2 - 6, top: size / 2 - 6 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: Colors.radarRing,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  ringLabel: {
    position: 'absolute',
  },
  ringLabelText: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: 'monospace',
    opacity: 0.6,
  },
  pulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  sweepContainer: {
    position: 'absolute',
  },
  sweepLine: {
    position: 'absolute',
    height: 1.5,
    top: '50%',
    backgroundColor: Colors.radarGreen,
    opacity: 0.6,
  },
  crossH: {
    position: 'absolute',
    height: 1,
    left: 10,
    backgroundColor: Colors.borderLight,
  },
  crossV: {
    position: 'absolute',
    width: 1,
    top: 10,
    backgroundColor: Colors.borderLight,
  },
  dirLabel: {
    position: 'absolute',
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.5,
  },
  targetDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,240,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.4)',
  },
  targetEmoji: {
    fontSize: 18,
  },
  centerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
});
