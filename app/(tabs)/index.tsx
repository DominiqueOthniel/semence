import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/store/AppContext';
import { DON_LABELS } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import {
  Amount,
  Body,
  Button,
  Eyebrow,
  ProgressBar,
  Row,
  Screen,
  Section,
} from '../../src/ui/primitives';
import { colors, fonts } from '../../src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { settings, envelopes, position, creditYear, eveningDone, transactions } = useApp();
  if (!settings || !envelopes || !position) return null;

  const donLabel = DON_LABELS[settings.profil];
  const hour = new Date().getHours();
  const salut = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.groundDeep, colors.ground, colors.ground]}
          locations={[0, 0.45, 1]}
          style={styles.hero}
        >
          <Text style={styles.brand}>SEMENCE</Text>
          <Text style={styles.hello}>
            {salut}
            {settings.name ? `, ${settings.name}` : ''}.
          </Text>
          <Text style={styles.heroLabel}>Reste à vivre aujourd’hui</Text>
          <Amount large style={styles.heroAmount}>
            {fcfa(Math.max(0, envelopes.perDay))}
          </Amount>
          <Body style={styles.heroMeta}>
            {envelopes.daysLeft} jour{envelopes.daysLeft > 1 ? 's' : ''} restants · {fcfa(envelopes.resteAVivre)} de
            courant
          </Body>

          <View style={styles.ctaRow}>
            <View style={{ flex: 1 }}>
              <Button label="Saisir" onPress={() => router.push('/saisie')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Revenu"
                variant="ghost"
                onPress={() => router.push({ pathname: '/saisie', params: { mode: 'revenu' } })}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Section>
            <Eyebrow>Enveloppes du mois</Eyebrow>
            {settings.profil !== 'aucun' && donLabel ? (
              <EnvelopeLine label={donLabel} spent={envelopes.donSpent} budget={envelopes.donBudget} color={colors.or} />
            ) : null}
            <EnvelopeLine
              label="Épargne"
              spent={envelopes.epargneSpent}
              budget={envelopes.epargneBudget}
              color={colors.vert}
            />
            <EnvelopeLine
              label="Semence"
              spent={envelopes.semenceSpent}
              budget={envelopes.semenceBudget}
              color={colors.orVif}
            />
            <EnvelopeLine
              label="Courant"
              spent={envelopes.courantSpent}
              budget={envelopes.courantBudget}
              color={colors.ink2}
              last
            />
          </Section>

          <Section>
            <Eyebrow>Position réelle</Eyebrow>
            <Amount style={{ marginBottom: 8 }}>{fcfa(position.net)}</Amount>
            <Row label="Disponible" value={fcfa(position.liquid)} />
            <Row label="Épargne objectifs" value={fcfa(position.savings)} tone="vert" />
            <Row label="On me doit" value={fcfa(position.owedToMe)} tone="vert" />
            <Row label="Je dois · personnes" value={fcfa(position.iOwePeople)} tone="rouge" />
            <Row label="Je dois · crédits" value={fcfa(position.iOweCredits)} tone="rouge" last />
          </Section>

          {!eveningDone && (
            <Section>
              <Eyebrow>Ce soir</Eyebrow>
              <Text style={styles.sectionTitle}>Deux minutes pour tenir.</Text>
              <Body style={{ marginBottom: 8 }}>
                Rendez-vous à {String(settings.eveningHour).padStart(2, '0')} h{' '}
                {String(settings.eveningMinute).padStart(2, '0')}.
              </Body>
              <Pressable onPress={() => router.push('/(tabs)/soir')}>
                <Text style={styles.link}>Ouvrir le rituel</Text>
              </Pressable>
            </Section>
          )}

          {creditYear.count > 0 && (
            <Section>
              <Eyebrow>Coût des emprunts</Eyebrow>
              <Amount>{fcfa(creditYear.cost)}</Amount>
              <Body style={{ marginTop: 6 }}>
                Surcoût de {creditYear.count} emprunt{creditYear.count > 1 ? 's' : ''} sur 12 mois.
              </Body>
            </Section>
          )}

          <Section last>
            <Eyebrow>Activité récente</Eyebrow>
            {transactions.length === 0 ? (
              <Body>Aucune opération pour l’instant.</Body>
            ) : (
              transactions.slice(0, 6).map((t, i, arr) => (
                <Row
                  key={t.id}
                  label={`${t.note || t.type}`}
                  value={`${t.type === 'revenu' ? '+' : t.type === 'depense' ? '−' : ''}${fcfa(t.amount)}`}
                  tone={t.type === 'revenu' ? 'vert' : t.type === 'depense' ? 'rouge' : 'ink'}
                  last={i === arr.length - 1}
                />
              ))
            )}
          </Section>
        </View>
      </ScrollView>
    </Screen>
  );
}

function EnvelopeLine({
  label,
  spent,
  budget,
  color,
  last,
}: {
  label: string;
  spent: number;
  budget: number;
  color: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.env, last && { marginBottom: 0 }]}>
      <View style={styles.envHead}>
        <View style={[styles.envDot, { backgroundColor: color }]} />
        <Text style={styles.envLabel}>{label}</Text>
        <Text style={styles.envVal}>
          {fcfa(spent)} / {fcfa(budget)}
        </Text>
      </View>
      <ProgressBar value={spent} max={budget || 1} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 36,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 28,
  },
  brand: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.or,
    marginBottom: 18,
  },
  hello: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    marginBottom: 22,
  },
  heroLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 6,
  },
  heroAmount: {
    marginBottom: 8,
  },
  heroMeta: {
    marginBottom: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  body: {
    paddingHorizontal: 22,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 8,
    lineHeight: 28,
  },
  link: {
    fontFamily: fonts.corpsSemi,
    color: colors.or,
    fontSize: 15,
    marginTop: 4,
  },
  env: {
    marginBottom: 18,
  },
  envHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  envDot: {
    width: 8,
    height: 8,
  },
  envLabel: {
    fontFamily: fonts.corpsSemi,
    color: colors.ink,
    fontSize: 15,
    flex: 1,
  },
  envVal: {
    fontFamily: fonts.chiffre,
    fontSize: 12,
    color: colors.ink3,
  },
});
