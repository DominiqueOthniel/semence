import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, space } from '../theme/colors';

export function Screen({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, padded && styles.screenPad]}>{children}</View>
    </SafeAreaView>
  );
}

export function Section({
  children,
  style,
  last,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  last?: boolean;
}) {
  return <View style={[styles.section, !last && styles.sectionRule, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Amount({ children, large, style }: { children: React.ReactNode; large?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.amount, large && styles.amountLarge, style]}>{children}</Text>;
}

/** @deprecated use Section */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        variant === 'soft' && styles.btnSoft,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'ghost' && { color: colors.or },
          variant === 'soft' && { color: colors.ink },
          variant === 'danger' && { color: colors.white },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        placeholderTextColor={colors.ink3}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              styles.segmentItem,
              active && styles.segmentActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, max, color = colors.or }: { value: number; max: number; color?: string }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Row({
  label,
  value,
  tone,
  last,
}: {
  label: string;
  value: string;
  tone?: 'or' | 'vert' | 'rouge' | 'ink';
  last?: boolean;
}) {
  const color =
    tone === 'or'
      ? colors.or
      : tone === 'vert'
        ? colors.vert
        : tone === 'rouge'
          ? colors.rouge
          : colors.ink;
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

export function Chip({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  screenPad: {
    paddingHorizontal: 22,
  },
  section: {
    paddingVertical: space.lg,
  },
  sectionRule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ruleFort,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.rule,
    padding: space.md,
    marginBottom: space.md,
  },
  eyebrow: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.or,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.corps,
    fontSize: 16,
    color: colors.ink2,
    lineHeight: 24,
    marginBottom: space.md,
  },
  label: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.corps,
    fontSize: 16,
    color: colors.ink2,
    lineHeight: 24,
  },
  amount: {
    fontFamily: fonts.chiffreMed,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  amountLarge: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
  },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 52,
  },
  btnCompact: {
    minHeight: 44,
    paddingVertical: 11,
    marginTop: 0,
  },
  btnPrimary: {
    backgroundColor: colors.or,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ruleFort,
  },
  btnSoft: {
    backgroundColor: colors.orWash,
  },
  btnDanger: {
    backgroundColor: colors.rouge,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontFamily: fonts.corpsSemi,
    color: colors.white,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  field: {
    marginBottom: 16,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ruleFort,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: fonts.corps,
    color: colors.ink,
  },
  segment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  segmentItem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ruleFort,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  segmentActive: {
    borderColor: colors.or,
    backgroundColor: colors.orWash,
  },
  segmentText: {
    fontFamily: fonts.corpsMed,
    color: colors.ink2,
    fontSize: 14,
  },
  segmentTextActive: {
    fontFamily: fonts.corpsSemi,
    color: colors.or,
  },
  track: {
    height: 4,
    backgroundColor: colors.groundDeep,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
  },
  rowLabel: {
    fontFamily: fonts.corps,
    color: colors.ink2,
    fontSize: 15,
    flex: 1,
    paddingRight: 12,
    lineHeight: 20,
  },
  rowValue: {
    fontFamily: fonts.chiffre,
    fontSize: 14,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ruleFort,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: colors.orWash,
    borderColor: colors.or,
  },
  chipText: {
    fontFamily: fonts.corpsMed,
    color: colors.ink,
    fontSize: 14,
  },
  chipTextActive: {
    color: colors.or,
    fontFamily: fonts.corpsSemi,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 7,
    height: 7,
    backgroundColor: colors.ruleFort,
  },
  dotOn: {
    width: 22,
    backgroundColor: colors.or,
  },
});
