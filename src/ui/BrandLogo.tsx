import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/colors';

const monogram = require('../../assets/brand/semence-monogramme-or.png');
const lockup = require('../../assets/brand/semence-logo-or.png');

/** Proportions des visuels dorés, pour ne jamais déformer le tracé. */
const MONOGRAM_RATIO = 266 / 529;
const LOCKUP_RATIO = 509 / 600;

/** Monogramme seul, dimensionné par sa hauteur. */
export function BrandLogo({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={monogram}
      style={[{ width: size * MONOGRAM_RATIO, height: size, resizeMode: 'contain' }, style]}
      accessibilityLabel="Logo Semence"
    />
  );
}

/** Bloc de marque complet : monogramme, mot gravé, filet et signature. */
export function BrandLockup({
  height = 180,
  tagline,
  align = 'center',
  style,
}: {
  height?: number;
  tagline?: string;
  align?: 'center' | 'left';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[align === 'center' ? styles.lockupCenter : styles.lockupLeft, style]}>
      <Image
        source={lockup}
        style={{ width: height * LOCKUP_RATIO, height, resizeMode: 'contain' }}
        accessibilityLabel="Semence"
      />
      {tagline ? (
        <>
          <View style={[styles.hair, align === 'left' && { alignSelf: 'flex-start' }]} />
          <Text
            style={[styles.tagline, styles.taglineOnDark, align === 'left' && { textAlign: 'left' }]}
          >
            {tagline}
          </Text>
        </>
      ) : null}
    </View>
  );
}

/** Monogramme en filigrane, calé dans un coin de carte. */
export function BrandWatermark({
  size = 96,
  opacity = 0.12,
  style,
}: {
  size?: number;
  opacity?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={monogram}
      style={[
        styles.watermark,
        { width: size * MONOGRAM_RATIO, height: size, opacity },
        style,
      ]}
    />
  );
}

/** Marque en ligne : monogramme + mot, pour les en-têtes compacts. */
export function BrandMark({
  size = 40,
  showWord = true,
  inverted = false,
  tagline,
  style,
}: {
  size?: number;
  showWord?: boolean;
  inverted?: boolean;
  tagline?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <BrandLogo size={size} />
        {showWord ? (
          <Text
            style={[
              styles.word,
              { fontSize: Math.max(15, size * 0.42) },
              inverted && { color: colors.white },
            ]}
          >
            Semence
          </Text>
        ) : null}
      </View>
      {tagline ? (
        <Text style={[styles.tagline, inverted && styles.taglineOnDark]}>{tagline}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockupCenter: {
    alignItems: 'center',
  },
  lockupLeft: {
    alignItems: 'flex-start',
  },
  word: {
    fontFamily: fonts.display,
    color: colors.ink,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  watermark: {
    position: 'absolute',
    right: -6,
    bottom: -10,
    resizeMode: 'contain',
    pointerEvents: 'none',
  },
  hair: {
    marginTop: 14,
    width: 44,
    height: 1,
    backgroundColor: colors.goldLine,
  },
  tagline: {
    marginTop: 10,
    fontFamily: fonts.corpsSemi,
    fontSize: 10,
    letterSpacing: 1.8,
    lineHeight: 16,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.ink3,
    paddingLeft: 2,
  },
  taglineOnDark: {
    color: 'rgba(247, 238, 220, 0.92)',
    fontSize: 11,
    letterSpacing: 1.6,
    lineHeight: 17,
  },
});
