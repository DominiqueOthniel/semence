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
import { Ionicons } from '@expo/vector-icons';
import { avatarColor, colors, fonts, initials, radius, space } from '../theme/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({
  name,
  size = 20,
  color = colors.or,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Avatar({
  name,
  size = 44,
  icon,
}: {
  name: string;
  size?: number;
  icon?: IconName;
}) {
  const bg = avatarColor(name || 'Semence');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={size * 0.45} color={colors.white} />
      ) : (
        <Text
          style={{
            fontFamily: fonts.corpsBold,
            color: colors.white,
            fontSize: size * 0.34,
            letterSpacing: 0.5,
          }}
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

export function IconBadge({
  name,
  color = colors.or,
  bg = colors.orWash,
  size = 40,
}: {
  name: IconName;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.48} color={color} />
    </View>
  );
}

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
  return <View style={[styles.section, style]}>{children}</View>;
}

export function SoftCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.softCard, style]}>{children}</View>;
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

export function Amount({
  children,
  large,
  style,
}: {
  children: React.ReactNode;
  large?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.amount, large && styles.amountLarge, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.softCard, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  compact,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
  compact?: boolean;
  icon?: IconName;
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
      <View style={styles.btnInner}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={variant === 'ghost' || variant === 'soft' ? colors.or : colors.white}
            style={{ marginRight: 8 }}
          />
        ) : null}
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
      </View>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput placeholderTextColor={colors.ink3} style={[styles.input, style]} {...rest} />
    </View>
  );
}

export function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
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
            {o.icon ? (
              <Ionicons
                name={o.icon}
                size={15}
                color={active ? colors.or : colors.ink3}
                style={{ marginRight: 6 }}
              />
            ) : null}
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
  icon,
}: {
  label: string;
  value: string;
  tone?: 'or' | 'vert' | 'rouge' | 'ink' | 'ambre';
  last?: boolean;
  icon?: IconName;
}) {
  const color =
    tone === 'or' || tone === 'vert'
      ? colors.or
      : tone === 'ambre'
        ? colors.ambre
        : tone === 'rouge'
          ? colors.rouge
          : colors.ink;
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowLeft}>
        {icon ? (
          <View style={styles.rowIcon}>
            <Ionicons name={icon} size={16} color={colors.ink3} />
          </View>
        ) : null}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

export function Chip({
  label,
  onPress,
  active,
  icon,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.8 }]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={active ? colors.or : colors.ink2} style={{ marginRight: 6 }} />
      ) : null}
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
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: space.lg,
  },
  softCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  eyebrow: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 1.4,
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
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.corps,
    fontSize: 16,
    color: colors.ink2,
    lineHeight: 25,
  },
  amount: {
    fontFamily: fonts.chiffre,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  amountLarge: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    fontFamily: fonts.chiffreMed,
  },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 52,
    borderRadius: radius.full,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.ruleFort,
  },
  btnSoft: {
    backgroundColor: colors.orWash,
  },
  btnDanger: {
    backgroundColor: colors.rouge,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontFamily: fonts.corpsBold,
    color: colors.white,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  field: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.rule,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: fonts.corpsMed,
    color: colors.ink,
  },
  segment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.rule,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
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
    fontFamily: fonts.corpsBold,
    color: colors.or,
  },
  track: {
    height: 8,
    backgroundColor: colors.groundDeep,
    marginTop: 10,
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  fill: {
    height: 8,
    borderRadius: radius.full,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowLabel: {
    fontFamily: fonts.corps,
    color: colors.ink2,
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  rowValue: {
    fontFamily: fonts.chiffre,
    fontSize: 15,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.rule,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.full,
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
    fontFamily: fonts.corpsBold,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ruleFort,
  },
  dotOn: {
    width: 24,
    backgroundColor: colors.or,
  },
});
