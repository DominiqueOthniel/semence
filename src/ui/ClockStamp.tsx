import { StyleSheet, Text, View } from 'react-native';
import { formatClock } from '../lib/clock';
import { useNow } from '../hooks/useNow';
import { colors, fonts } from '../theme/colors';

export function ClockStamp({
  variant = 'ink',
  compact,
  stacked,
}: {
  variant?: 'ink' | 'muted' | 'onDark' | 'gold';
  compact?: boolean;
  stacked?: boolean;
}) {
  const stamp = formatClock(useNow());
  const color =
    variant === 'onDark'
      ? 'rgba(255,255,255,0.78)'
      : variant === 'gold'
        ? colors.ambre
        : variant === 'muted'
          ? colors.ink3
          : colors.ink2;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${stamp.dateLine}, ${stamp.timeLine}`}
      style={[styles.wrap, stacked && styles.wrapStacked]}
    >
      <Text style={[styles.date, compact && styles.dateCompact, { color }]}>{stamp.dateLine}</Text>
      <Text style={[styles.time, compact && styles.timeCompact, { color }]}>{stamp.timeLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
  },
  wrapStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  date: {
    fontFamily: fonts.corpsSemi,
    fontSize: 14,
  },
  dateCompact: {
    fontSize: 13,
  },
  time: {
    fontFamily: fonts.chiffreMed,
    fontSize: 16,
    letterSpacing: 0.4,
  },
  timeCompact: {
    fontSize: 14,
  },
});
