import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { Transaction } from '../types';
import {
  axisTicks,
  cashflowForPeriod,
  formatAxisFcfa,
  niceAxisMax,
  periodCaption,
  type CashflowPeriod,
} from '../lib/cashflow';
import { colors, fonts, radius } from '../theme/colors';
import { Eyebrow, Segment } from './primitives';
import { useLayout } from '../hooks/useLayout';

const REVENU_COLOR = colors.chartRevenu;
const DEPENSE_COLOR = colors.chartDepense;

export function CashflowChart({ transactions }: { transactions: Transaction[] }) {
  const { isCompact } = useLayout();
  const [period, setPeriod] = useState<CashflowPeriod>(isCompact ? 'hebdo' : 'annuel');
  const [boxW, setBoxW] = useState(0);

  const series = useMemo(() => cashflowForPeriod(transactions, period), [transactions, period]);
  const maxY = useMemo(
    () => niceAxisMax(series.flatMap((r) => [r.revenus, r.depenses])),
    [series],
  );
  const ticks = useMemo(() => axisTicks(maxY, 5), [maxY]);
  const hasData = series.some((r) => r.revenus > 0 || r.depenses > 0);
  const caption = periodCaption(period);
  const useBars = period === 'annuel' || period === 'mensuel';

  const pad = {
    top: 12,
    right: 10,
    bottom: period === 'hebdo' ? 44 : 34,
    left: isCompact ? 40 : 48,
  };

  const pointGap = period === 'mensuel' ? 36 : 0;
  const minChartW =
    period === 'mensuel' ? Math.max(series.length * pointGap, boxW || 0) : boxW;
  const chartW = Math.max(minChartW, boxW);
  const chartH = isCompact ? 200 : 248;
  const plotW = Math.max(0, chartW - pad.left - pad.right);
  const plotH = Math.max(0, chartH - pad.top - pad.bottom);
  const n = series.length;
  const edge = Math.min(12, plotW * 0.04);
  const groupW = n > 0 ? (plotW - edge * 2) / n : 0;
  const barW = Math.max(4, Math.min(14, groupW * 0.32));

  function xAt(i: number) {
    if (n <= 1) return pad.left + plotW / 2;
    return pad.left + edge + ((plotW - edge * 2) * i) / (n - 1);
  }

  function groupCenter(i: number) {
    return pad.left + edge + groupW * i + groupW / 2;
  }

  function yAt(value: number) {
    return pad.top + plotH - (plotH * value) / maxY;
  }

  function onLayout(e: LayoutChangeEvent) {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && Math.abs(w - boxW) > 1) setBoxW(w);
  }

  const linePoints = (key: 'revenus' | 'depenses') =>
    series.map((row, i) => `${xAt(i)},${yAt(row[key])}`).join(' ');

  function showXLabel(i: number) {
    if (period === 'hebdo') return true;
    if (period === 'annuel') return true;
    if (isCompact) return i === 0 || i === n - 1 || (i + 1) % 5 === 0;
    return i === 0 || i === n - 1 || (i + 1) % 2 === 0;
  }

  const emptyMsg =
    period === 'hebdo'
      ? 'Pas d’opérations cette semaine (lundi → dimanche).'
      : period === 'mensuel'
        ? 'Pas encore d’opérations ce mois-ci.'
        : 'Pas encore d’opérations cette année.';

  const chart = boxW > 0 ? (
    <Svg
      width={chartW}
      height={chartH}
      accessibilityLabel="Courbe revenus et dépenses"
      style={{ overflow: 'hidden' }}
    >
      <Defs>
        <ClipPath id="plotClip">
          <Rect x={pad.left} y={pad.top} width={plotW} height={plotH} rx={8} />
        </ClipPath>
      </Defs>

      <Rect
        x={pad.left}
        y={pad.top}
        width={plotW}
        height={plotH}
        fill={colors.groundDeep}
        rx={8}
      />

      {ticks.map((t) => {
        const y = yAt(t);
        return (
          <Line
            key={`g-${t}`}
            x1={pad.left}
            y1={y}
            x2={pad.left + plotW}
            y2={y}
            stroke={colors.ruleFort}
            strokeWidth={1}
            strokeDasharray={t === 0 ? undefined : '4 4'}
          />
        );
      })}

      {ticks.map((t) => (
        <SvgText
          key={`y-${t}`}
          x={pad.left - 6}
          y={yAt(t) + 3}
          fill={colors.ink3}
          fontSize={10}
          fontFamily={fonts.corps}
          textAnchor="end"
        >
          {formatAxisFcfa(t)}
        </SvgText>
      ))}

      <G clipPath="url(#plotClip)">
        {useBars
          ? series.map((row, i) => {
              const cx = groupCenter(i);
              const yR = yAt(row.revenus);
              const yD = yAt(row.depenses);
              const hR = Math.max(0, pad.top + plotH - yR);
              const hD = Math.max(0, pad.top + plotH - yD);
              return (
                <React.Fragment key={`b-${row.key}`}>
                  <Rect
                    x={cx - barW - 2}
                    y={yR}
                    width={barW}
                    height={hR}
                    rx={3}
                    fill={REVENU_COLOR}
                  />
                  <Rect x={cx + 2} y={yD} width={barW} height={hD} rx={3} fill={DEPENSE_COLOR} />
                </React.Fragment>
              );
            })
          : (
            <>
              <Polyline
                points={linePoints('revenus')}
                fill="none"
                stroke={REVENU_COLOR}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Polyline
                points={linePoints('depenses')}
                fill="none"
                stroke={DEPENSE_COLOR}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}
      </G>

      {!useBars
        ? series.map((row, i) => {
            const xr = xAt(i);
            const yr = yAt(row.revenus);
            const yd = yAt(row.depenses);
            const r = 4;
            return (
              <React.Fragment key={`m-${row.key}`}>
                <Circle cx={xr} cy={yr} r={r} fill={REVENU_COLOR} stroke={colors.white} strokeWidth={1.5} />
                <Rect
                  x={xr - r}
                  y={yd - r}
                  width={r * 2}
                  height={r * 2}
                  rx={1}
                  fill={DEPENSE_COLOR}
                  stroke={colors.white}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })
        : null}

      {series.map((row, i) => {
        if (!showXLabel(i)) return null;
        const x = useBars ? groupCenter(i) : xAt(i);
        if (period === 'hebdo') {
          return (
            <React.Fragment key={`x-${row.key}`}>
              <SvgText
                x={x}
                y={chartH - 22}
                fill={colors.ink2}
                fontSize={11}
                fontFamily={fonts.corpsSemi}
                textAnchor="middle"
              >
                {row.label}
              </SvgText>
              <SvgText
                x={x}
                y={chartH - 8}
                fill={colors.ink3}
                fontSize={10}
                fontFamily={fonts.corps}
                textAnchor="middle"
              >
                {row.short}
              </SvgText>
            </React.Fragment>
          );
        }
        return (
          <SvgText
            key={`x-${row.key}`}
            x={x}
            y={chartH - 10}
            fill={colors.ink3}
            fontSize={10}
            fontFamily={fonts.corps}
            textAnchor="middle"
          >
            {row.short}
          </SvgText>
        );
      })}
    </Svg>
  ) : (
    <View style={{ height: chartH }} />
  );

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Eyebrow>{caption}</Eyebrow>
        <Text style={styles.title}>Évolution revenus & dépenses</Text>
      </View>

      <Segment
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'hebdo', label: 'Semaine', icon: 'calendar-outline' },
          { value: 'mensuel', label: 'Mois', icon: 'calendar' },
          { value: 'annuel', label: 'Année', icon: 'stats-chart-outline' },
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

      <View style={styles.plotBox} onLayout={onLayout}>
        {period === 'mensuel' && chartW > boxW + 2 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            {chart}
          </ScrollView>
        ) : (
          chart
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.rule,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
    shadowColor: '#1A2420',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  head: {
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.panel,
    marginTop: 2,
    marginBottom: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendMark: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  diamond: {
    borderRadius: 2,
  },
  square: {
    borderRadius: 2,
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
  plotBox: {
    width: '100%',
    overflow: 'hidden',
  },
});
