import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme/colors';
import { fcfa } from '../lib/money';
import { delta, type KpiBoardData, type KpiDelta } from '../lib/kpis';
import { Eyebrow, IconBadge, SoftCard } from './primitives';

function toneFor(d: KpiDelta, invert: boolean) {
  if (d.dir === 'flat') return colors.ink3;
  const good = invert ? d.dir === 'down' : d.dir === 'up';
  return good ? colors.vert : colors.rouge;
}

function DeltaLine({
  d,
  invert = false,
  suffix,
}: {
  d: KpiDelta | null;
  invert?: boolean;
  suffix: string;
}) {
  if (!d) return <Text style={styles.muted}>Pas encore de comparaison</Text>;
  if (d.dir === 'flat') return <Text style={styles.muted}>Stable {suffix}</Text>;
  const sign = d.abs > 0 ? '+' : '−';
  const pct = d.pct != null ? `${Math.abs(d.pct)} %` : fcfa(Math.abs(d.abs));
  return (
    <Text style={[styles.delta, { color: toneFor(d, invert) }]}>
      {sign}
      {pct} {suffix}
    </Text>
  );
}

function Tile({
  label,
  value,
  d,
  invert,
  suffix,
}: {
  label: string;
  value: string;
  d: KpiDelta | null;
  invert?: boolean;
  suffix: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={1}>
        {value}
      </Text>
      <DeltaLine d={d} invert={invert} suffix={suffix} />
    </View>
  );
}

export function KpiBoard({ data, vsLabel }: { data: KpiBoardData; vsLabel: string }) {
  const { current, previous, avg3, yearAgo, history, best, worst } = data;
  const prevSuffix = `vs ${vsLabel}`;
  const maxBar = Math.max(1, ...history.map((h) => Math.max(h.income, h.expense)));

  return (
    <SoftCard>
      <View style={styles.head}>
        <IconBadge name="stats-chart-outline" bg={colors.ambreWash} color={colors.ambre} />
        <Eyebrow>KPI du cycle</Eyebrow>
      </View>

      <View style={styles.grid}>
        <Tile
          label="Revenus"
          value={fcfa(current.income)}
          d={delta(current.income, previous?.income)}
          suffix={prevSuffix}
        />
        <Tile
          label="Dépenses"
          value={fcfa(current.expense)}
          d={delta(current.expense, previous?.expense)}
          invert
          suffix={prevSuffix}
        />
        <Tile
          label="Solde"
          value={fcfa(current.net)}
          d={delta(current.net, previous?.net)}
          suffix={prevSuffix}
        />
        <Tile
          label="Taux d’épargne"
          value={`${current.savingsRate} %`}
          d={
            previous
              ? {
                  abs: current.savingsRate - previous.savingsRate,
                  pct: current.savingsRate - previous.savingsRate,
                  dir:
                    current.savingsRate === previous.savingsRate
                      ? 'flat'
                      : current.savingsRate > previous.savingsRate
                        ? 'up'
                        : 'down',
                }
              : null
          }
          suffix={prevSuffix}
        />
      </View>

      {avg3 ? (
        <View style={styles.compare}>
          <Text style={styles.compareTitle}>Vs moyenne des 3 cycles précédents</Text>
          <Text style={styles.compareLine}>
            Revenus{' '}
            <Text style={styles.strong}>{signedPct(current.income, avg3.income)}</Text>
            {' · Dépenses '}
            <Text style={styles.strong}>{signedPct(current.expense, avg3.expense)}</Text>
            {' · Solde '}
            <Text style={styles.strong}>{signedPct(current.net, avg3.net)}</Text>
          </Text>
        </View>
      ) : null}

      {yearAgo ? (
        <Text style={styles.yearLine}>
          Même période l’an dernier ({yearAgo.short} {yearAgo.year}) : revenus {fcfa(yearAgo.income)},
          dépenses {fcfa(yearAgo.expense)}, solde {fcfa(yearAgo.net)}.
        </Text>
      ) : null}

      <View style={styles.spark}>
        {history.map((h) => {
          const hInc = Math.max(6, Math.round((h.income / maxBar) * 36));
          const hExp = Math.max(6, Math.round((h.expense / maxBar) * 36));
          const active = h.offset === current.offset;
          return (
            <View key={`${h.offset}-${h.short}`} style={styles.sparkCol}>
              <View style={styles.sparkBars}>
                <View style={[styles.barIncome, { height: hInc }]} />
                <View style={[styles.barExpense, { height: hExp }]} />
              </View>
              <Text style={[styles.sparkLabel, active && styles.sparkLabelOn]}>{h.short}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.chartRevenu }]} />
        <Text style={styles.legendText}>Revenus</Text>
        <View style={[styles.dot, { backgroundColor: colors.chartDepense }]} />
        <Text style={styles.legendText}>Dépenses</Text>
      </View>

      {best && worst && best.offset !== worst.offset ? (
        <Text style={styles.foot}>
          Meilleur solde : {best.short} {best.year} ({fcfa(best.net)}). Plus tendu : {worst.short}{' '}
          {worst.year} ({fcfa(worst.net)}).
        </Text>
      ) : null}
    </SoftCard>
  );
}

function signedPct(current: number, base: number) {
  if (base === 0 && current === 0) return 'stable';
  if (base === 0) return current > 0 ? 'en hausse' : 'en baisse';
  const pct = Math.round(((current - base) / Math.abs(base)) * 100);
  if (pct === 0) return 'stable';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct)} %`;
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  tileLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 4,
  },
  tileValue: {
    fontFamily: fonts.chiffreMed,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  delta: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
  },
  muted: {
    fontFamily: fonts.corps,
    fontSize: 12,
    color: colors.ink3,
  },
  compare: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.rule,
  },
  compareTitle: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 6,
  },
  compareLine: {
    fontFamily: fonts.corps,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
  strong: {
    fontFamily: fonts.chiffreMed,
    color: colors.ink,
  },
  yearLine: {
    marginTop: 10,
    fontFamily: fonts.corps,
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink2,
  },
  spark: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 52,
  },
  sparkCol: {
    flex: 1,
    alignItems: 'center',
  },
  sparkBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 36,
  },
  barIncome: {
    width: 7,
    borderRadius: 3,
    backgroundColor: colors.chartRevenu,
  },
  barExpense: {
    width: 7,
    borderRadius: 3,
    backgroundColor: colors.chartDepense,
  },
  sparkLabel: {
    marginTop: 6,
    fontFamily: fonts.corpsSemi,
    fontSize: 10,
    color: colors.ink3,
  },
  sparkLabelOn: {
    color: colors.or,
  },
  legend: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fonts.corps,
    fontSize: 11,
    color: colors.ink3,
    marginRight: 8,
  },
  foot: {
    marginTop: 12,
    fontFamily: fonts.corps,
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink2,
  },
});
