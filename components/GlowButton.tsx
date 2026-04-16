import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../lib/colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function GlowButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
}: Props) {
  const bgColor =
    variant === 'primary'
      ? Colors.primary
      : variant === 'secondary'
      ? Colors.secondary
      : variant === 'danger'
      ? Colors.danger
      : 'transparent';

  const txtColor =
    variant === 'ghost' ? Colors.primary : variant === 'primary' ? Colors.bg : '#FFF';

  const borderColor = variant === 'ghost' ? Colors.primary : bgColor;

  const padV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const padH = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? Colors.bgCardLight : bgColor,
          borderColor: disabled ? Colors.borderLight : borderColor,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
        variant === 'primary' && !disabled && styles.glowShadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: disabled ? Colors.textMuted : txtColor, fontSize },
              icon ? { marginLeft: 8 } : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  glowShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
