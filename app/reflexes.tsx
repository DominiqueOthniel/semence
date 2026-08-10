import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REFLEXES } from '../src/lib/reflexes';
import { useLayout, TOUCH } from '../src/hooks/useLayout';
import { colors, fonts, radius } from '../src/theme/colors';

export default function ReflexesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gutter, isCompact, maxWidth } = useLayout();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ambre} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>

        <Text style={styles.pack}>Pack · Reprends le contrôle de ton argent</Text>
        <Text style={styles.title}>Les 10 Réflexes</Text>
        <Text style={styles.subtitle}>qui maîtrisent ton argent</Text>
        <Text style={styles.tagline}>Relis-les là où tu les verras chaque jour.</Text>
        <View style={styles.goldLine} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.body,
          {
            paddingHorizontal: gutter,
            paddingBottom: Math.max(insets.bottom, 28) + 12,
            maxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, isCompact && styles.gridCompact]}>
          {REFLEXES.map((r, i) => {
            const cols = isCompact ? 1 : 2;
            const row = Math.floor(i / cols);
            const cream = row % 2 === 1;
            return (
              <View
                key={r.n}
                style={[
                  styles.card,
                  cream ? styles.cardCream : styles.cardGrey,
                  isCompact ? styles.cardFull : styles.cardHalf,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{r.n}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{r.title}</Text>
                </View>
                <Text style={styles.cardBody}>{r.body}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  header: {
    backgroundColor: colors.panel,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: TOUCH,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: fonts.corpsSemi,
    fontSize: 15,
    color: colors.ambre,
  },
  pack: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
  },
  subtitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ambre,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  goldLine: {
    height: 2,
    backgroundColor: colors.ambre,
    opacity: 0.85,
    borderRadius: 1,
  },
  body: {
    paddingTop: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCompact: {
    flexDirection: 'column',
  },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    minHeight: 118,
  },
  cardHalf: {
    width: '48.5%',
    flexGrow: 1,
    flexBasis: '46%',
  },
  cardFull: {
    width: '100%',
  },
  cardGrey: {
    backgroundColor: '#F2F4F3',
  },
  cardCream: {
    backgroundColor: '#FFF9EF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.chiffreMed,
    fontSize: 13,
    color: colors.ambre,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.corpsBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.panel,
    paddingTop: 6,
  },
  cardBody: {
    fontFamily: fonts.corps,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink2,
    paddingLeft: 48,
  },
});
