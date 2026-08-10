import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/colors';

const logo = require('../../assets/brand/marque-semence-or.png');

export function BrandLogo({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={logo}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessibilityLabel="Logo Semence"
    />
  );
}

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
              { fontSize: Math.max(18, size * 0.52) },
              inverted && { color: colors.white },
            ]}
          >
            Semence
          </Text>
        ) : null}
      </View>
      {tagline ? (
        <Text style={[styles.tagline, inverted && { color: colors.ambre }]}>{tagline}</Text>
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
  word: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
  tagline: {
    fontFamily: fonts.corpsSemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
    paddingLeft: 2,
  },
});
