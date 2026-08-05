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
      style={[{ width: size, height: size * 1.15, resizeMode: 'contain' }, style]}
      accessibilityLabel="Logo Semence"
    />
  );
}

export function BrandMark({
  size = 40,
  showWord = true,
  style,
}: {
  size?: number;
  showWord?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      <BrandLogo size={size} />
      {showWord ? <Text style={[styles.word, { fontSize: Math.max(18, size * 0.52) }]}>Semence</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  word: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
});
