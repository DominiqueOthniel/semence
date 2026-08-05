import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { Transaction } from '../types';
import {
  axisTicks,
  cashflowForPeriod,
  formatAxisFcfa,
  niceAxisMax,
  periodCaption,
  type CashflowPeriod,
  type CashflowPoint,
} from '../lib/cashflow';
import { colors, fonts, radius } from '../theme/colors';
import { Eyebrow, Segment } from './primitives';
import { useLayout } from '../hooks/useLayout';

const REVENU_COLOR = '#2C5F8A';
const DEPENSE_COLOR = '#E07A2F';
const PAD = { top: 16, right: 12, bottom: 36, left: 44 };

export function CashflowChart({ transactions }: { transactions: Transaction[] }) {
  const { isCompact } = useLayout();
  const [period, setPeriod] = useState<CashflowPeriod>('annuel');
  const [width, setWidth] = useState(0);
  const height = isCompact ? 220 : 260;

  const series = useMemo(() => cashflowForPeriod(transactions, period), [transactions, period]);
  const maxY = useMemo(
    () => niceAxisMax(series.flatMap((r) => [r.revenus, r.depenses])),
    [series],
  );
  const ticks = useMemo(() => axisTicks(maxY, 6), [maxY]);
  const hasData = series.some((r) => r.revenus > 0 || r.depenses > 0);
  const caption = periodCaption(period);

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - width) > 1) setWidth(w);
  }

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = Math.max(0, height - PAD.top - PAD.bottom);
  const denom = Math.max(1, series.length - 1);

  const points = (key: 'revenus' | 'depenses') =>
    series
      .map((_row, i) => {
        const x = PAD.left + (plotW * i) / denom;
        const y = PAD.top + plotH - (plotH * series[i][key]) / maxY;
        return `${x},${y}`;
      })
      .join(' ');

  const markerAt = (row: CashflowPoint, i: number, key: 'revenus' | 'depenses') => {
    const x = PAD.left + (plotW * i) / denom;
    const y = PAD.top + plotH - (plotH * row[key]) / maxY;
    return { x, y };
  };

  function showXLabel(i: number) {
    if (series.length <= 8) return true;
    if (period === 'mensuel') {
      if (isCompact) return i === 0 || i === series.length - 1 || (i + 1) % 5 === 0;
      return i === 0 || i === series.length - 1 || (i + 1) % 3 === 0;
    }
    if (isCompact) return i % 2 === 0 || i === series.length - 1;
    return true;
  }

  const emptyMsg =
    period === 'hebdo'
      ? 'Pas d’opérations sur les 7 derniers jours.'
      : period === 'mensuel'
        ? 'Pas encore d’opérations ce mois-ci.'
        : 'Pas encore d’opérations cette année.';

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.head}>
        <Eyebrow>{caption}</Eyebrow>
        <Text style={styles.title}>Évolution revenus & dépenses</Text>
      </View>

      <Segment
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'hebdo', label: 'Hebdo', icon: 'calendar-outline' },
          { value: 'mensuel', label: 'Mensuel', icon: 'calendar' },
          { value: 'annuel', label: 'Annuel', icon: 'stats-chart-outline' },
        ]}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMark, styles.diamond, { backgroundColor: REVENU_COLOR }]} />
          <Text style={styles.legendText}>Revenus</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMark, styles.square, { backgroundColor: DEPENSE_COLOR }]} />
          <Text style={styles.legendText}>Dépenses</Text>
        </View>
      </View>

      {!hasData ? <Text style={styles.empty}>{emptyMsg}</Text> : null}

      {width > 0 ? (
        <Svg width={width} height={height} accessibilityLabel="Courbe revenus et dépenses">
          <Rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill={colors.groundDeep}
            rx={8}
          />

          {ticks.map((t) => {
            const y = PAD.top + plotH - (plotH * t) / maxY;
            return (
              <Line
                key={`g-${t}`}
                x1={PAD.left}
                y1={y}
                x2={PAD.left + plotW}
                y2={y}
                stroke={colors.ruleFort}
                strokeWidth={1}
                strokeDasharray={t === 0 ? undefined : '4 4'}
              />
            );
          })}

          {ticks.map((t) => {
            const y = PAD.top + plotH - (plotH * t) / maxY;
            return (
              <SvgText
                key={`y-${t}`}
                x={PAD.left - 6}
                y={y + 3}
                fill={colors.ink3}
                fontSize={10}
                fontFamily={fonts.corps}
                textAnchor="end"
              >
                {formatAxisFcfa(t)}
              </SvgText>
            );
          })}

          {series.map((row, i) => {
            if (!showXLabel(i)) return null;
            const x = PAD.left + (plotW * i) / denom;
            return (
              <SvgText
                key={`x-${row.key}`}
                x={x}
                y={height - 10}
                fill={colors.ink3}
                fontSize={isCompact ? 9 : 10}
                fontFamily={fonts.corps}
                textAnchor="middle"
              >
                {period === 'hebdo' ? row.label : row.short}
              </SvgText>
            );
          })}

          <Polyline
            points={points('revenus')}
            fill="none"
            stroke={REVENU_COLOR}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Polyline
            points={points('depenses')}
            fill="none"
            stroke={DEPENSE_COLOR}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {series.map((row, i) => {
            const r = markerAt(row, i, 'revenus');
            const d = markerAt(row, i, 'depenses');
            const showMarker = period !== 'mensuel' || !isCompact || i % 2 === 0;
            if (!showMarker) return null;
            return (
              <React.Fragment key={`m-${row.key}`}>
                <Circle
                  cx={r.x}
                  cy={r.y}
                  r={period === 'mensuel' ? 3 : 4.5}
                  fill={REVENU_COLOR}
                  stroke={colors.white}
                  strokeWidth={1.5}
                />
                <Rect
                  x={d.x - (period === 'mensuel' ? 3 : 4)}
                  y={d.y - (period === 'mensuel' ? 3 : 4)}
                  width={period === 'mensuel' ? 6 : 8}
                  height={period === 'mensuel' ? 6 : 8}
                  rx={1}
                  fill={DEPENSE_COLOR}
                  stroke={colors.white}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  head: {
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.or,
    marginTop: 2,
    marginBottom: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendMark: {
    width: 10,
    height: 10,
  },
  diamond: {
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  square: {
    borderRadius: 1,
  },
  legendText: {
    fontFamily: fonts.corpsSemi,
    fontSize: 13,
    color: colors.ink2,
  },
  empty: {
    fontFamily: fonts.corps,
    fontSize: 14,
    color: colors.ink3,
    marginBottom: 8,
    lineHeight: 20,
  },
});
