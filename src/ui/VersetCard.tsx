import { StyleSheet, Text, View } from 'react-native';
import type { Profil } from '../types';
import { versetDuJour, versetEyebrow } from '../lib/versets';
import { colors, fonts, radius } from '../theme/colors';
import { BrandWatermark } from './BrandLogo';
import { Eyebrow, IconBadge, SoftCard } from './primitives';

export function VersetCard({
  profil,
  variant = 'light',
}: {
  profil: Profil;
  variant?: 'light' | 'dark' | 'amber';
}) {
  const v = versetDuJour(profil);
  const eyebrow = versetEyebrow(profil);

  if (variant === 'dark') {
    return (
      <View style={styles.darkBox}>
        <Text style={styles.darkEyebrow}>{eyebrow}</Text>
        <Text style={styles.darkText}>« {v.text} »</Text>
        <Text style={styles.darkRef}>{v.ref}</Text>
      </View>
    );
  }

  if (variant === 'amber') {
    return (
      <View style={styles.amberBox}>
        <BrandWatermark size={92} opacity={0.16} />
        <Text style={styles.amberText}>« {v.text} »</Text>
        <Text style={styles.amberRef}>{v.ref}</Text>
      </View>
    );
  }

  return (
    <SoftCard style={styles.card}>
      <View style={styles.head}>
        <IconBadge name="book-outline" bg={colors.ambreWash} color={colors.ambre} />
        <Eyebrow>{eyebrow}</Eyebrow>
      </View>
      <Text style={styles.text}>« {v.text} »</Text>
      <Text style={styles.ref}>{v.ref}</Text>
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ambreWash,
    borderColor: '#E8D6AE',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  text: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
  },
  ref: {
    marginTop: 10,
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  darkBox: {
    marginTop: 4,
  },
  darkEyebrow: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 8,
  },
  darkText: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
  },
  darkRef: {
    marginTop: 8,
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ambre,
  },
  amberBox: {
    backgroundColor: colors.ambreWash,
    borderRadius: radius.md,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  amberText: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.panel,
  },
  amberRef: {
    marginTop: 8,
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ambre,
  },
});
