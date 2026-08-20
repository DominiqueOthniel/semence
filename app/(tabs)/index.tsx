import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/store/AppContext';
import { DON_LABELS } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { buildKpiBoard } from '../../src/lib/kpis';
import { useLayout, TOUCH } from '../../src/hooks/useLayout';
import {
  Amount,
  Avatar,
  Body,
  Button,
  Eyebrow,
  IconBadge,
  ProgressBar,
  Row,
  Screen,
  SoftCard,
} from '../../src/ui/primitives';
import { BrandMark } from '../../src/ui/BrandLogo';
import { CashflowChart } from '../../src/ui/CashflowChart';
import { DashboardInsights } from '../../src/ui/DashboardInsights';
import { KpiBoard } from '../../src/ui/KpiBoard';
import { VersetCard } from '../../src/ui/VersetCard';
import { colors, fonts, radius } from '../../src/theme/colors';
import { BotanicalField } from '../../src/ui/BotanicalMotif';
import { CycleSwitch } from '../../src/ui/CycleSwitch';
import { QuickMove } from '../../src/ui/QuickMove';
import { MascotTip, useMascotCue } from '../../src/ui/Mascot';
import { mascotStage, pickHomeCue } from '../../src/lib/mascot';
import { formatClock } from '../../src/lib/clock';
import { useNow } from '../../src/hooks/useNow';
import { ClockStamp } from '../../src/ui/ClockStamp';

function capitalizeFirst(raw?: string) {
  if (!raw) return '';
  const first = raw.trim().split(/\s+/)[0] || '';
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const { gutter, isCompact, isWide } = useLayout();
  const now = useNow();
  const clock = formatClock(now);
  const {
    settings,
    envelopes,
    position,
    creditYear,
    eveningDone,
    streak,
    transactions,
    yearTransactions,
    accounts,
    favorites,
    goals,
    refresh,
    cycle,
    shiftCycle,
    setCycleOffset,
    goToCurrentCycle,
  } = useApp();

  const kpiData = useMemo(
    () =>
      settings
        ? buildKpiBoard(settings.monthStartDay, yearTransactions, cycle.offset)
        : null,
    [settings, yearTransactions, cycle.offset],
  );

  const homeCue = useMemo(() => {
    if (!settings || !envelopes) return null;
    const donName = DON_LABELS[settings.profil];
    return pickHomeCue({
      live: cycle.status === 'en_cours',
      envelopes: [
        ...(settings.profil !== 'aucun' && donName
          ? [{ label: donName, spent: envelopes.donSpent, budget: envelopes.donBudget }]
          : []),
        { label: 'Épargne', spent: envelopes.epargneSpent, budget: envelopes.epargneBudget },
        { label: 'Semence', spent: envelopes.semenceSpent, budget: envelopes.semenceBudget },
        { label: 'Courant', spent: envelopes.courantSpent, budget: envelopes.courantBudget },
      ],
      goals,
      transactions,
      streak,
      eveningDone,
      settings,
    });
  }, [settings, envelopes, cycle.status, goals, transactions, streak, eveningDone, clock.timeLine]);

  const { visible: mascotCue, dismiss: dismissMascot } = useMascotCue(homeCue);
  const sproutStage = mascotStage(goals);

  useEffect(() => {
    void refresh();
  }, [clock.dayKey, refresh]);

  if (!settings || !envelopes || !position || !kpiData) return null;

  const donLabel = DON_LABELS[settings.profil];
  const salut = clock.greeting;
  const firstName = capitalizeFirst(settings.name);

  const yearIncome = yearTransactions
    .filter((t) => t.type === 'revenu' && t.date.startsWith(`${cycle.year}-`))
    .reduce((s, t) => s + t.amount, 0);
  const yearExpense = yearTransactions
    .filter((t) => t.type === 'depense' && t.date.startsWith(`${cycle.year}-`))
    .reduce((s, t) => s + t.amount, 0);
  const savingsRate =
    yearIncome > 0 ? Math.max(0, Math.round(((yearIncome - yearExpense) / yearIncome) * 100)) : 0;
  const isLive = cycle.status === 'en_cours';

  const vsLabel = kpiData.previous
    ? `${kpiData.previous.short} ${kpiData.previous.year}`
    : 'le cycle précédent';
  const kpiCard = (
    <MoreFold title="Comparer aux autres mois" hint="Revenus, dépenses, solde">
      <KpiBoard data={kpiData} vsLabel={vsLabel} />
    </MoreFold>
  );

  const quickMove = (
    <QuickMove
      accounts={accounts}
      favorites={favorites}
      transactions={transactions}
      onSaved={async () => {
        await refresh();
        goToCurrentCycle();
      }}
      onMore={() => router.push('/saisie')}
      onIncome={() => router.push({ pathname: '/saisie', params: { mode: 'revenu' } })}
    />
  );

  const mascotCard = mascotCue ? (
    <MascotTip
      mood={mascotCue.mood}
      stage={sproutStage}
      title={mascotCue.title}
      text={mascotCue.text}
      onDismiss={() => void dismissMascot()}
      onPress={
        mascotCue.mood === 'evening'
          ? () => router.push('/(tabs)/soir')
          : mascotCue.mood === 'income'
            ? () => router.push('/(tabs)/plus')
            : mascotCue.mood === 'goal'
              ? () => router.push('/objectif')
              : mascotCue.mood === 'progress'
                ? () => router.push('/(tabs)/soir')
                : undefined
      }
    />
  ) : null;

  const envelopesCard = (
    <SoftCard
      style={
        isCompact
          ? undefined
          : {
              flex: 1,
              marginBottom: 0,
              borderRadius: radius.xl,
              padding: 18,
              shadowColor: '#1A2420',
              shadowOpacity: 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }
      }
    >
      <View style={styles.cardHead}>
        <IconBadge name="layers-outline" />
        <Eyebrow>Enveloppes du cycle</Eyebrow>
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
        <Eyebrow>{isLive ? 'Activité récente' : `Opérations · ${cycle.short} ${cycle.year}`}</Eyebrow>
      </View>
      {transactions.length === 0 ? (
        <Body>Aucune opération sur ce cycle.</Body>
      ) : (
        transactions.slice(0, isWide ? 8 : 4).map((t, i, arr) => (
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

  const chartCard = <CashflowChart transactions={yearTransactions} cycle={cycle} />;

  const cycleSwitch = (
    <CycleSwitch
      cycle={cycle}
      monthStartDay={settings.monthStartDay}
      daysLeft={envelopes.daysLeft}
      onShift={shiftCycle}
      onSelectOffset={setCycleOffset}
      onNow={goToCurrentCycle}
    />
  );

  const insightsCard = (
    <DashboardInsights
      daysLeft={envelopes.daysLeft}
      resteAVivre={envelopes.resteAVivre}
      closed={!isLive}
      cycleLabel={cycle.label}
      envelopes={[
        ...(settings.profil !== 'aucun' && donLabel
          ? [{ label: donLabel, spent: envelopes.donSpent, budget: envelopes.donBudget }]
          : []),
        { label: 'Épargne', spent: envelopes.epargneSpent, budget: envelopes.epargneBudget },
        { label: 'Semence', spent: envelopes.semenceSpent, budget: envelopes.semenceBudget },
        { label: 'Courant', spent: envelopes.courantSpent, budget: envelopes.courantBudget },
      ]}
    />
  );

  const extraCards = (
    <MoreFold title="Graphique et conseils" hint="Flux et alertes du cycle">
      {insightsCard}
      {chartCard}
    </MoreFold>
  );

  const ctas = (
    <View style={styles.ctaRow}>
      <View style={styles.ctaItem}>
        <Button
          label="Saisir"
          icon="add-circle-outline"
          variant="amber"
          onPress={() => router.push('/saisie')}
        />
      </View>
      <View style={styles.ctaItem}>
        <Button
          label="Revenu"
          icon="arrow-down-circle-outline"
          variant="onDark"
          onPress={() => router.push({ pathname: '/saisie', params: { mode: 'revenu' } })}
        />
      </View>
    </View>
  );

  const cycleRecap = (
    <View style={styles.recapRow}>
      <View style={styles.recapItem}>
        <Text style={styles.darkMeta}>Entré</Text>
        <Text style={styles.recapValue}>{fcfa(envelopes.cycleIncome)}</Text>
      </View>
      <View style={styles.recapDivider} />
      <View style={styles.recapItem}>
        <Text style={styles.darkMeta}>Sorti</Text>
        <Text style={styles.recapValue}>{fcfa(envelopes.cycleExpense)}</Text>
      </View>
    </View>
  );

  if (isCompact) {
    return (
      <Screen padded={false} maxWidth="app" scroll>
        <LinearGradient
          colors={['rgba(228,237,227,0.5)', 'rgba(241,238,230,0.18)', 'rgba(247,244,238,0.06)']}
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
          <View style={styles.clockPad}>
            <ClockStamp />
          </View>
          <VersetCard profil={settings.profil} />
          <View style={styles.darkCardMobile}>
            <BotanicalField variant="dark" density="card" style={{ borderRadius: radius.xl }} />
            <View style={styles.cardForeground}>
              <Text style={styles.darkLabel}>
                {isLive ? 'Reste à vivre ce mois' : `Cycle ${cycle.short} ${cycle.year}`}
              </Text>
              <Text style={styles.darkAmount}>
                {fcfa(Math.max(0, isLive ? envelopes.resteAVivre : envelopes.courantSpent))}
              </Text>
              <Text style={styles.darkMeta}>
                {isLive
                  ? `${fcfa(envelopes.courantBudget)} de courant · ${envelopes.daysLeft} jour${envelopes.daysLeft > 1 ? 's' : ''} restants`
                  : `Courant dépensé · ${cycle.rangeLabel}`}
              </Text>
              {isLive ? null : cycleRecap}
            </View>
          </View>
        </LinearGradient>
        <View style={[styles.body, { paddingHorizontal: gutter }]}>
          {mascotCard}
          {quickMove}
          {cycleSwitch}
          {envelopesCard}
          {activityCard}
          {soirCard}
          {creditCard}
          {kpiCard}
          {extraCards}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} maxWidth="wide" scroll>
      <LinearGradient
        colors={['rgba(234,242,236,0.48)', 'rgba(241,238,230,0.16)', 'rgba(247,244,238,0.05)']}
        locations={[0, 0.45, 1]}
        style={[styles.deskCanvas, { paddingHorizontal: gutter }]}
      >
        <View style={styles.deskHead}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ClockStamp variant="muted" compact />
            <Text style={styles.helloDesktop}>
              {salut}
              {firstName ? `, ${firstName}` : ''}.
            </Text>
          </View>
          <Avatar
            name={settings.name || 'Toi'}
            size={52}
            preset={settings.avatarPreset}
            photoUri={settings.avatarPhoto}
          />
        </View>

        <VersetCard profil={settings.profil} />

        {cycleSwitch}

        {mascotCard}

        {quickMove}

        <View style={[styles.deskTopRow, styles.deskTopRowFixed]}>
          <View style={[styles.darkCard, styles.cardShadow]}>
            <BotanicalField variant="dark" density="card" style={{ borderRadius: radius.xl }} />
            <View style={styles.cardForeground}>
              <Text style={styles.darkLabel}>
                {isLive ? 'Reste à vivre ce mois' : `Cycle ${cycle.short} ${cycle.year}`}
              </Text>
              <Text style={styles.darkAmount} numberOfLines={1}>
                {fcfa(Math.max(0, isLive ? envelopes.resteAVivre : envelopes.courantSpent))}
              </Text>
              <Text style={styles.darkMeta}>
                {isLive
                  ? `${fcfa(envelopes.courantBudget)} de courant · ${envelopes.daysLeft} jour${envelopes.daysLeft > 1 ? 's' : ''} restants`
                  : `Courant dépensé · ${cycle.rangeLabel}`}
              </Text>
              {isLive ? ctas : cycleRecap}
            </View>
          </View>

          <View style={styles.lightCard}>{envelopesCard}</View>

          <View style={[styles.darkCard, styles.cardShadow]}>
            <BotanicalField variant="dark" density="card" style={{ borderRadius: radius.xl }} />
            <View style={styles.cardForeground}>
              <Text style={styles.darkLabel}>Position réelle</Text>
              <Text style={styles.darkAmount} numberOfLines={1}>
                {fcfa(position.net)}
              </Text>
              <Text style={styles.darkMeta}>Disponible {fcfa(position.liquid)}</Text>
              <Text style={styles.darkMeta}>Épargne {fcfa(position.savings)}</Text>
              <Text style={[styles.darkMeta, styles.debtMeta]}>
                Dettes {fcfa(position.iOwePeople + position.iOweCredits)}
              </Text>
            </View>
          </View>
        </View>

        {kpiCard}

        <View style={[styles.deskMidRow, styles.deskMidRowFixed]}>
          <View style={styles.deskMidMain}>{chartCard}</View>
          <View style={styles.deskMidSide}>
            {insightsCard}
          </View>
        </View>

          <View style={[styles.summaryBar, styles.summaryBarFixed, styles.cardShadow]}>
          <BotanicalField variant="dark" density="card" style={{ borderRadius: radius.xl }} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Revenus {cycle.year}</Text>
            <Text style={styles.summaryValue}>{fcfa(yearIncome)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Dépenses {cycle.year}</Text>
            <Text style={styles.summaryValue}>{fcfa(yearExpense)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Épargne objectifs</Text>
            <Text style={styles.summaryValue}>{fcfa(position.savings)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Taux d’épargne</Text>
            <Text style={styles.summaryValue}>{savingsRate} %</Text>
          </View>
        </View>

        <View style={[styles.deskBottom, styles.deskBottomFixed]}>
          <View style={styles.deskBottomMain}>
            {soirCard}
            {creditCard}
            {activityCard}
          </View>
          <View style={[styles.rightRail, styles.cardShadowLight]}>
            <Text style={styles.railTitle}>Résumé rapide</Text>
            <Text style={styles.railBig}>{fcfa(position.liquid)}</Text>
            <Text style={styles.railHint}>Disponible</Text>
            <View style={styles.railDivider} />
            <Text style={styles.railLine}>Épargne objectifs · {fcfa(position.savings)}</Text>
            <Text style={styles.railLine}>On me doit · {fcfa(position.owedToMe)}</Text>
            <Text style={[styles.railLine, { color: colors.rouge }]}>
              Je dois · {fcfa(position.iOwePeople + position.iOweCredits)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}

function MoreFold({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fold}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={({ pressed }) => [styles.foldBtn, pressed && { opacity: 0.88 }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.foldTitle}>{title}</Text>
          <Text style={styles.foldHint}>{hint}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.or} />
      </Pressable>
      {open ? <View style={styles.foldBody}>{children}</View> : null}
    </View>
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
  const over = budget > 0 && spent > budget;
  const barColor = over ? colors.rouge : color;
  return (
    <View style={[styles.env, last && { marginBottom: 0 }]}>
      <View style={styles.envHead}>
        <View style={[styles.envDot, { backgroundColor: barColor }]} />
        <Text style={styles.envLabel}>{label}</Text>
        <Text style={[styles.envVal, over && { color: colors.rouge }]}>
          {fcfa(spent)} / {fcfa(budget)}
          {over ? ' · dépassé' : ''}
        </Text>
      </View>
      <ProgressBar value={spent} max={budget || 1} color={barColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  heroMobile: {
    paddingTop: 8,
    paddingBottom: 28,
    position: 'relative',
  },
  deskCanvas: {
    paddingTop: 22,
    paddingBottom: 48,
    minHeight: '100%',
    position: 'relative',
  },
  deskHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22,
  },
  deskTopRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 16,
    marginBottom: 16,
    alignItems: 'stretch',
  },
  deskTopRowFixed: {
    flexWrap: 'nowrap',
  },
  deskMidRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'stretch',
  },
  deskMidRowFixed: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  deskMidMain: {
    flex: 1.55,
    minWidth: 0,
  },
  deskMidSide: {
    flex: 0.85,
    minWidth: 260,
    maxWidth: 380,
  },
  cardShadow: {
    shadowColor: '#0F241C',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardShadowLight: {
    shadowColor: '#1A2420',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  darkCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,137,42,0.22)',
    position: 'relative',
  },
  darkCardMobile: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(196,137,42,0.22)',
    position: 'relative',
  },
  lightCard: {
    flex: 1.25,
    minWidth: 0,
  },
  cardForeground: {
    zIndex: 1,
  },
  darkLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 10,
  },
  darkAmount: {
    fontFamily: fonts.chiffreMed,
    fontSize: 28,
    color: colors.white,
    marginBottom: 10,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  darkMeta: {
    fontFamily: fonts.corps,
    fontSize: 13,
    color: colors.inkOnDark,
    marginBottom: 5,
  },
  debtMeta: {
    color: '#F3C4BE',
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    gap: 8,
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(196,137,42,0.18)',
    position: 'relative',
  },
  summaryBarFixed: {
    flexWrap: 'nowrap',
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
    zIndex: 1,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.ruleOnDark,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 6,
  },
  summaryValue: {
    fontFamily: fonts.chiffreMed,
    fontSize: 17,
    color: colors.white,
  },
  deskBottom: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  deskBottomFixed: {
    flexWrap: 'nowrap',
  },
  deskBottomMain: {
    flex: 1,
    minWidth: 0,
  },
  rightRail: {
    width: 280,
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 20,
  },
  railTitle: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.or,
    marginBottom: 10,
  },
  railBig: {
    fontFamily: fonts.chiffreMed,
    fontSize: 28,
    color: colors.ink,
  },
  railHint: {
    fontFamily: fonts.corps,
    fontSize: 13,
    color: colors.ink3,
    marginBottom: 10,
  },
  railDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.rule,
    marginVertical: 14,
  },
  railLine: {
    fontFamily: fonts.corps,
    fontSize: 14,
    color: colors.ink2,
    marginBottom: 10,
    lineHeight: 20,
  },
  quoteBox: {
    backgroundColor: colors.ambreWash,
    borderRadius: radius.md,
    padding: 14,
  },
  railQuote: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.panel,
  },
  hello: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    marginBottom: 6,
  },
  clockPad: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    minHeight: TOUCH,
  },
  helloDesktop: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 44,
    color: colors.ink,
    marginTop: 6,
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
    marginTop: 16,
    marginBottom: 2,
  },
  ctaItem: {
    flexGrow: 1,
    flexBasis: 110,
    minWidth: 100,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  recapItem: {
    flex: 1,
    minWidth: 0,
  },
  recapDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: 12,
  },
  recapValue: {
    fontFamily: fonts.chiffreMed,
    fontSize: 16,
    color: colors.white,
    marginTop: 2,
  },
  fold: {
    marginBottom: 8,
  },
  foldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH,
    paddingVertical: 8,
    gap: 12,
  },
  foldTitle: {
    fontFamily: fonts.corpsSemi,
    fontSize: 15,
    color: colors.ink,
  },
  foldHint: {
    fontFamily: fonts.corps,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 2,
  },
  foldBody: {
    paddingBottom: 4,
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
