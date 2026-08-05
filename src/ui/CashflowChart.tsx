import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { Transaction } from '../types';
import {
  axisTicks,
  formatAxisFcfa,
  monthlyCashflow,
  niceAxisMax,
  type MonthCashflow,
} from '../lib/cashflow';
import { colors, fonts, radius } from '../theme/colors';
import { Eyebrow } from './primitives';
import { useLayout } from '../hooks/useLayout';

const REVENU_COLOR = '#2C5F8A';
const DEPENSE_COLOR = '#E07A2F';
const PAD = { top: 16, right: 12, bottom: 36, left: 44 };

export function CashflowChart({
  transactions,
  year = new Date().getFullYear(),
}: {
  transactions: Transaction[];
  year?: number;
}) {
  const { isCompact } = useLayout();
  const [width, setWidth] = useState(0);
  const height = isCompact ? 220 : 260;

  const series = useMemo(() => monthlyCashflow(transactions, year), [transactions, year]);
  const maxY = useMemo(
    () => niceAxisMax(series.flatMap((r) => [r.revenus, r.depenses])),
    [series],
  );
  const ticks = useMemo(() => axisTicks(maxY, 6), [maxY]);
  const hasData = series.some((r) => r.revenus > 0 || r.depenses > 0);

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - width) > 1) setWidth(w);
  }

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = Math.max(0, height - PAD.top - PAD.bottom);

  const points = (key: 'revenus' | 'depenses') =>
    series
      .map((_row, i) => {
        const x = PAD.left + (plotW * i) / Math.max(1, series.length - 1);
        const y = PAD.top + plotH - (plotH * series[i][key]) / maxY;
        return `${x},${y}`;
      })
      .join(' ');

  const markerAt = (row: MonthCashflow, i: number, key: 'revenus' | 'depenses') => {
    const x = PAD.left + (plotW * i) / Math.max(1, series.length - 1);
    const y = PAD.top + plotH - (plotH * row[key]) / maxY;
    return { x, y };
  };

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.head}>
        <Eyebrow>Année {year}</Eyebrow>
        <Text style={styles.title}>Évolution revenus & dépenses</Text>
      </View>

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

      {!hasData ? (
        <Text style={styles.empty}>
          Pas encore d’opérations cette année. Les courbes apparaîtront ici.
        </Text>
      ) : null}

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
            const x = PAD.left + (plotW * i) / Math.max(1, series.length - 1);
            const show = isCompact ? i % 2 === 0 || i === series.length - 1 : true;
            if (!show) return null;
            return (
              <SvgText
                key={`x-${row.month}`}
                x={x}
                y={height - 10}
                fill={colors.ink3}
                fontSize={isCompact ? 9 : 10}
                fontFamily={fonts.corps}
                textAnchor="middle"
              >
                {isCompact ? row.short : row.label.slice(0, 3)}
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
            return (
              <React.Fragment key={`m-${i}`}>
                <Circle
                  cx={r.x}
                  cy={r.y}
                  r={4.5}
                  fill={REVENU_COLOR}
                  stroke={colors.white}
                  strokeWidth={1.5}
                />
                <Rect
                  x={d.x - 4}
                  y={d.y - 4}
                  width={8}
                  height={8}
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
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.or,
    marginTop: 2,
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
