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
  const dateColor =
    variant === 'gold'
      ? 'rgba(255,255,255,0.92)'
      : variant === 'onDark'
        ? 'rgba(255,255,255,0.86)'
        : variant === 'muted'
          ? colors.ink3
          : colors.ink2;
  const timeColor =
    variant === 'gold'
      ? colors.ambreVif
      : variant === 'onDark'
        ? 'rgba(255,255,255,0.92)'
        : variant === 'muted'
          ? colors.ink3
          : colors.ink;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${stamp.dateLine}, ${stamp.timeLine}`}
      style={[styles.wrap, stacked && styles.wrapStacked]}
    >
      <Text style={[styles.date, compact && styles.dateCompact, { color: dateColor }]}>
        {stamp.dateLine}
      </Text>
      <Text style={[styles.time, compact && styles.timeCompact, stacked && styles.timeStacked, { color: timeColor }]}>
        {stamp.timeLine}
      </Text>
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
    fontSize: 15,
  },
  timeStacked: {
    fontSize: 22,
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
