import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors, fonts, radius } from '../theme/colors';
import { loadMascotSeen, markMascotSeen, type MascotCue, type MascotMood, type MascotStage } from '../lib/mascot';
import { TOUCH } from '../hooks/useLayout';

export function useMascotCue(cue: MascotCue | null) {
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => {
    void loadMascotSeen().then(setSeen);
  }, []);

  const visible = cue && !seen.includes(cue.id) ? cue : null;

  async function dismiss() {
    if (!cue) return;
    await markMascotSeen(cue.id);
    setSeen((prev) => (prev.includes(cue.id) ? prev : [...prev, cue.id]));
  }

  return { visible, dismiss };
}

function Sprout({
  size = 52,
  mood,
  stage,
}: {
  size?: number;
  mood: MascotMood;
  stage: MascotStage;
}) {
  const grown = mood === 'goal' ? Math.max(stage, 1) : mood === 'welcome' ? 0 : stage;
  const gold = mood === 'over' ? colors.ambre : colors.ambreVif;
  const leaf = mood === 'over' ? '#6F8A6A' : colors.orVif;
  const pot = mood === 'evening' ? colors.panelSoft : colors.panel;
  const droop = mood === 'over' ? 6 : 0;
  const lift = mood === 'goal' || mood === 'progress' ? -4 : 0;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 72" accessibilityElementsHidden>
      <Ellipse cx="32" cy="66" rx="16" ry="3.2" fill="rgba(21,32,28,0.08)" />
      <Path
        d="M18 58 C18 46, 46 46, 46 58 C46 64, 40 68, 32 68 C24 68, 18 64, 18 58 Z"
        fill={pot}
      />
      <Path d="M22 52 C24 48, 40 48, 42 52 L40 58 L24 58 Z" fill={colors.orWash} />
      {grown === 0 ? (
        <Ellipse cx="32" cy={44 + lift} rx="9" ry="11" fill={gold} />
      ) : (
        <>
          <Path
            d={`M32 ${50 + lift} C32 ${38 + lift}, 32 ${28 + lift}, 32 ${20 + lift + droop}`}
            stroke={colors.or}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M32 ${30 + lift} C20 ${26 + lift + droop}, 16 ${18 + lift}, 22 ${14 + lift} C28 ${18 + lift}, 32 ${24 + lift}, 32 ${30 + lift} Z`}
            fill={leaf}
          />
          <Path
            d={`M32 ${28 + lift} C44 ${22 + lift + droop}, 50 ${16 + lift}, 44 ${11 + lift} C36 ${16 + lift}, 32 ${22 + lift}, 32 ${28 + lift} Z`}
            fill={colors.or}
          />
          {grown >= 2 ? (
            <Path
              d={`M32 ${22 + lift} C26 ${8 + lift}, 38 ${4 + lift}, 40 ${12 + lift} C36 ${12 + lift}, 33 ${16 + lift}, 32 ${22 + lift} Z`}
              fill={gold}
            />
          ) : null}
        </>
      )}
      {mood === 'income' ? <Circle cx="50" cy="46" r="4.2" fill={gold} /> : null}
      {mood === 'evening' ? (
        <Path d="M50 16 C46 18, 44 24, 48 28 C54 26, 56 20, 50 16 Z" fill={gold} />
      ) : null}
      {mood === 'progress' || mood === 'goal' ? (
        <>
          <Circle cx="48" cy="12" r="3.2" fill={gold} />
          <Circle cx="54" cy="20" r="2" fill={leaf} />
        </>
      ) : null}
    </Svg>
  );
}

export function MascotTip({
  mood,
  stage = 1,
  title,
  text,
  onDismiss,
  onPress,
}: {
  mood: MascotMood;
  stage?: MascotStage;
  title: string;
  text: string;
  onDismiss?: () => void;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}. ${text}`}
      style={({ pressed }) => [styles.wrap, pressed && onPress && { opacity: 0.92 }]}
    >
      <Sprout mood={mood} stage={stage} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Masquer"
          style={styles.dismiss}
        >
          <Text style={styles.dismissText}>Lu</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    minHeight: TOUCH + 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.corpsSemi,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  text: {
    fontFamily: fonts.corps,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink2,
  },
  dismiss: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dismissText: {
    fontFamily: fonts.corpsSemi,
    fontSize: 13,
    color: colors.or,
  },
});
