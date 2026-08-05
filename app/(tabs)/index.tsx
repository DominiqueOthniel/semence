import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/store/AppContext';
import { DON_LABELS } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { useLayout, TOUCH } from '../../src/hooks/useLayout';
import {
  Amount,
  Avatar,
  Body,
  Button,
  Eyebrow,
  IconBadge,
  PageCol,
  PageGrid,
  ProgressBar,
  Row,
  Screen,
  SoftCard,
} from '../../src/ui/primitives';
import { BrandMark } from '../../src/ui/BrandLogo';
import { CashflowChart } from '../../src/ui/CashflowChart';
import { colors, fonts, radius } from '../../src/theme/colors';

function capitalizeFirst(raw?: string) {
  if (!raw) return '';
  const first = raw.trim().split(/\s+/)[0] || '';
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const { gutter, isCompact, isWide } = useLayout();
  const { settings, envelopes, position, creditYear, eveningDone, transactions, yearTransactions } =
    useApp();
  if (!settings || !envelopes || !position) return null;

  const donLabel = DON_LABELS[settings.profil];
  const hour = new Date().getHours();
  const salut = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = capitalizeFirst(settings.name);

  const envelopesCard = (
    <SoftCard>
      <View style={styles.cardHead}>
        <IconBadge name="layers-outline" />
        <Eyebrow>Enveloppes du mois</Eyebrow>
      </View>
      {settings.profil !== 'aucun' && donLabel ? (
        <EnvelopeLine
          label={donLabel}
          spent={envelopes.donSpent}
          budget={envelopes.donBudget}
          color={colors.ambre}
        />
      ) : null}
      <EnvelopeLine
        label="Épargne"
        spent={envelopes.epargneSpent}
        budget={envelopes.epargneBudget}
        color={colors.or}
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
        color={colors.ink3}
        last
      />
    </SoftCard>
  );

  const positionCard = (
    <SoftCard>
      <View style={styles.cardHead}>
        <IconBadge name="pie-chart-outline" bg={colors.ambreWash} color={colors.ambre} />
        <Eyebrow>Position réelle</Eyebrow>
      </View>
      <Amount style={{ marginBottom: 4 }}>{fcfa(position.net)}</Amount>
      <Row label="Disponible" value={fcfa(position.liquid)} icon="wallet-outline" />
      <Row label="Épargne objectifs" value={fcfa(position.savings)} tone="vert" icon="flag-outline" />
      <Row label="On me doit" value={fcfa(position.owedToMe)} tone="vert" icon="arrow-down-outline" />
      <Row label="Je dois · personnes" value={fcfa(position.iOwePeople)} tone="rouge" icon="arrow-up-outline" />
      <Row
        label="Je dois · crédits"
        value={fcfa(position.iOweCredits)}
        tone="rouge"
        icon="card-outline"
        last
      />
    </SoftCard>
  );

  const soirCard = !eveningDone ? (
    <Pressable
      onPress={() => router.push('/(tabs)/soir')}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le rendez-vous du soir"
      style={({ pressed }) => [pressed && { opacity: 0.92 }]}
    >
      <SoftCard style={styles.soirCard}>
        <View style={styles.soirRow}>
          <IconBadge name="moon-outline" bg={colors.ambreWash} color={colors.ambre} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.sectionTitle}>Rendez-vous du soir</Text>
            <Body>
              À {String(settings.eveningHour).padStart(2, '0')} h{' '}
              {String(settings.eveningMinute).padStart(2, '0')} · deux minutes
            </Body>
          </View>
          <Text style={styles.link}>Ouvrir</Text>
        </View>
      </SoftCard>
    </Pressable>
  ) : null;

  const activityCard = (
    <SoftCard style={{ marginBottom: 8 }}>
      <View style={styles.cardHead}>
        <IconBadge name="time-outline" />
        <Eyebrow>Activité récente</Eyebrow>
      </View>
      {transactions.length === 0 ? (
        <Body>Aucune opération pour l’instant.</Body>
      ) : (
        transactions.slice(0, isWide ? 10 : 6).map((t, i, arr) => (
          <Row
            key={t.id}
            label={t.note || t.type}
            value={`${t.type === 'revenu' ? '+' : t.type === 'depense' ? '−' : ''}${fcfa(t.amount)}`}
            tone={t.type === 'revenu' ? 'vert' : t.type === 'depense' ? 'rouge' : 'ink'}
            icon={
              t.type === 'revenu'
                ? 'arrow-down-circle-outline'
                : t.type === 'transfert'
                  ? 'swap-horizontal-outline'
                  : 'arrow-up-circle-outline'
            }
            last={i === arr.length - 1}
          />
        ))
      )}
    </SoftCard>
  );

  const creditCard =
    creditYear.count > 0 ? (
      <SoftCard>
        <View style={styles.cardHead}>
          <IconBadge name="alert-circle-outline" bg={colors.rougeWash} color={colors.rouge} />
          <Eyebrow>Coût des emprunts</Eyebrow>
        </View>
        <Amount>{fcfa(creditYear.cost)}</Amount>
        <Body style={{ marginTop: 6 }}>
          Surcoût de {creditYear.count} emprunt{creditYear.count > 1 ? 's' : ''} sur 12 mois.
        </Body>
      </SoftCard>
    ) : null;

  const chartCard = <CashflowChart transactions={yearTransactions} />;

  const ctas = (
    <View style={styles.ctaRow}>
      <View style={styles.ctaItem}>
        <Button label="Saisir" icon="add-circle-outline" onPress={() => router.push('/saisie')} />
      </View>
      <View style={styles.ctaItem}>
        <Button
          label="Revenu"
          icon="arrow-down-circle-outline"
          variant="ghost"
          onPress={() => router.push({ pathname: '/saisie', params: { mode: 'revenu' } })}
        />
      </View>
    </View>
  );

  if (isCompact) {
    return (
      <Screen padded={false} maxWidth="app">
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[colors.groundDeep, colors.ground, colors.ground]}
            locations={[0, 0.55, 1]}
            style={[styles.heroMobile, { paddingHorizontal: gutter }]}
          >
            <View style={styles.topRow}>
              <BrandMark size={36} />
              <Avatar
                name={settings.name || 'Toi'}
                size={44}
                preset={settings.avatarPreset}
                photoUri={settings.avatarPhoto}
              />
            </View>
            <Text style={styles.hello}>
              {salut}
              {firstName ? `, ${firstName}` : ''}.
            </Text>
            <Text style={styles.heroLabel}>Reste à vivre aujourd’hui</Text>
            <Amount large style={styles.heroAmount}>
              {fcfa(Math.max(0, envelopes.perDay))}
            </Amount>
            <Body style={styles.heroMeta}>
              {envelopes.daysLeft} jour{envelopes.daysLeft > 1 ? 's' : ''} restants · {fcfa(envelopes.resteAVivre)}{' '}
              de courant
            </Body>
            {ctas}
          </LinearGradient>
          <View style={[styles.body, { paddingHorizontal: gutter }]}>
            {chartCard}
            {envelopesCard}
            {positionCard}
            {soirCard}
            {creditCard}
            {activityCard}
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen padded={false} maxWidth="wide">
      <View style={[styles.desktopRow, { paddingHorizontal: gutter, paddingTop: 20, gap: gutter }]}>
        <View style={styles.desktopHero}>
          <View style={styles.topRow}>
            <Text style={styles.desktopKicker}>Aujourd’hui</Text>
            <Avatar
              name={settings.name || 'Toi'}
              size={44}
              preset={settings.avatarPreset}
              photoUri={settings.avatarPhoto}
            />
          </View>
          <Text style={styles.helloDesktop}>
            {salut}
            {firstName ? `, ${firstName}` : ''}.
          </Text>
          <Text style={styles.heroLabel}>Reste à vivre</Text>
          <Amount large style={styles.heroAmount}>
            {fcfa(Math.max(0, envelopes.perDay))}
          </Amount>
          <Body style={styles.heroMeta}>
            {envelopes.daysLeft} jour{envelopes.daysLeft > 1 ? 's' : ''} restants
          </Body>
          <Body style={{ marginBottom: 12 }}>{fcfa(envelopes.resteAVivre)} encore en courant</Body>
          {ctas}
          {soirCard}
        </View>

        <ScrollView
          style={styles.desktopScroll}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <PageGrid>
            <PageCol>{envelopesCard}</PageCol>
            <PageCol>{positionCard}</PageCol>
          </PageGrid>
          {chartCard}
          {creditCard}
          {activityCard}
        </ScrollView>
      </View>
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
  scroll: { paddingBottom: 40 },
  heroMobile: {
    paddingTop: 8,
    paddingBottom: 28,
  },
  desktopRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  desktopHero: {
    width: 340,
    maxWidth: '38%',
    backgroundColor: colors.groundDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 22,
    alignSelf: 'flex-start',
  },
  desktopScroll: {
    flex: 1,
    minWidth: 0,
  },
  desktopKicker: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.or,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    minHeight: TOUCH,
  },
  hello: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    marginBottom: 18,
  },
  helloDesktop: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.ink,
    marginBottom: 18,
  },
  heroLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 6,
  },
  heroAmount: { marginBottom: 8 },
  heroMeta: { marginBottom: 8 },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  ctaItem: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 120,
  },
  body: { paddingTop: 4 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 2,
  },
  soirCard: {
    backgroundColor: colors.ambreWash,
    borderColor: '#E8D6AE',
    marginTop: 8,
  },
  soirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH,
  },
  link: {
    fontFamily: fonts.corpsBold,
    color: colors.ambre,
    fontSize: 14,
  },
  env: { marginBottom: 16 },
  envHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  envDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
