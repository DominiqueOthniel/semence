import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONTH_SHORT } from '../lib/cashflow';
import { cycleForMonth, MAX_CYCLE_BACK, type Cycle } from '../lib/cycle';
import { colors, fonts, radius } from '../theme/colors';
import { TOUCH, useLayout } from '../hooks/useLayout';

export function CycleSwitch({
  cycle,
  monthStartDay,
  onShift,
  onSelectOffset,
  onNow,
  daysLeft,
}: {
  cycle: Cycle;
  monthStartDay: number;
  onShift: (delta: number) => void;
  onSelectOffset: (offset: number) => void;
  onNow: () => void;
  daysLeft?: number;
}) {
  const { isCompact } = useLayout();
  const [viewYear, setViewYear] = useState(cycle.year);
  const [open, setOpen] = useState(!isCompact);

  useEffect(() => {
    setViewYear(cycle.year);
  }, [cycle.year]);

  const now = new Date();
  const minYear = now.getFullYear() - Math.ceil(MAX_CYCLE_BACK / 12);
  const maxYear = cycleAtPresentYear(monthStartDay);

  function pickMonth(month: number) {
    const next = cycleForMonth(monthStartDay, viewYear, month);
    if (next.status === 'a_venir') return;
    if (next.offset < -MAX_CYCLE_BACK) return;
    onSelectOffset(next.offset);
  }

  const canPrev = cycle.offset > -MAX_CYCLE_BACK;
  const canNext = cycle.offset < 0;
  const canYearPrev = viewYear > minYear;
  const canYearNext = viewYear < maxYear;

  return (
    <View style={[styles.wrap, !isCompact && styles.wrapDesk]}>
      <View style={styles.head}>
        <NavBtn
          icon="chevron-back"
          label="Cycle précédent"
          disabled={!canPrev}
          onPress={() => onShift(-1)}
        />
        <View style={styles.headCenter}>
          <Pressable
            onPress={() => isCompact && setOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Masquer le calendrier' : 'Choisir un autre mois'}
          >
            <Text style={styles.kicker}>Cycle budgétaire</Text>
            <Text style={styles.title} numberOfLines={1}>
              {cycle.label}
            </Text>
            <Text style={styles.range}>{cycle.rangeLabel}</Text>
          </Pressable>
          <View style={[styles.badge, cycle.status === 'en_cours' ? styles.badgeOn : styles.badgeOff]}>
            <View style={[styles.badgeDot, cycle.status === 'en_cours' ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.badgeText, cycle.status === 'en_cours' && styles.badgeTextOn]}>
              {cycle.status === 'en_cours' && daysLeft
                ? `${cycle.statusLabel} · ${daysLeft} j restants`
                : `${cycle.statusLabel} · ${cycle.dayCount} j`}
            </Text>
          </View>
        </View>
        <NavBtn
          icon="chevron-forward"
          label="Cycle suivant"
          disabled={!canNext}
          onPress={() => onShift(1)}
        />
      </View>

      {open ? (
        <>
          <View style={styles.yearRow}>
        <NavBtn
          icon="caret-back-outline"
          label="Année précédente"
          compact
          disabled={!canYearPrev}
          onPress={() => canYearPrev && setViewYear((y) => y - 1)}
        />
        <Text style={styles.yearLabel}>Saison {viewYear}</Text>
        <NavBtn
          icon="caret-forward-outline"
          label="Année suivante"
          compact
          disabled={!canYearNext}
          onPress={() => canYearNext && setViewYear((y) => y + 1)}
        />
      </View>

      <View style={styles.crown} accessibilityRole="tablist">
        <View style={styles.stem} />
        {MONTH_SHORT.map((label, month) => {
          const bead = cycleForMonth(monthStartDay, viewYear, month);
          const selected = bead.key === cycle.key;
          const current = bead.status === 'en_cours';
          const future = bead.status === 'a_venir';
          return (
            <Pressable
              key={`${viewYear}-${month}`}
              onPress={() => pickMonth(month)}
              disabled={future}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: future }}
              accessibilityLabel={`Cycle ${label} ${viewYear}${current ? ', en cours' : ''}${future ? ', à venir' : ''}`}
              hitSlop={4}
              style={({ pressed }) => [styles.beadHit, pressed && !future && { opacity: 0.85 }]}
            >
              <View
                style={[
                  styles.bead,
                  future && styles.beadFuture,
                  !future && !selected && styles.beadPast,
                  current && !selected && styles.beadCurrent,
                  selected && styles.beadSelected,
                ]}
              >
                {selected ? <View style={styles.beadCore} /> : null}
                {current && !selected ? <Ionicons name="leaf" size={9} color={colors.or} /> : null}
              </View>
              <Text
                style={[
                  styles.beadLabel,
                  selected && styles.beadLabelOn,
                  future && styles.beadLabelFuture,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
          </View>
        </>
      ) : isCompact ? (
        <Text style={styles.hint}>Touche le mois pour comparer un autre cycle.</Text>
      ) : null}

      {cycle.status !== 'en_cours' ? (
        <Pressable
          onPress={onNow}
          accessibilityRole="button"
          accessibilityLabel="Revenir au cycle en cours"
          style={({ pressed }) => [styles.nowBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="return-up-back-outline" size={16} color={colors.or} />
          <Text style={styles.nowText}>Revenir au cycle en cours</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function cycleAtPresentYear(monthStartDay: number) {
  return cycleForMonth(monthStartDay, new Date().getFullYear(), new Date().getMonth()).year;
}

function NavBtn({
  icon,
  label,
  onPress,
  disabled,
  compact,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        compact ? styles.navMini : styles.nav,
        pressed && !disabled && { opacity: 0.8 },
        disabled && { opacity: 0.28 },
      ]}
    >
      <Ionicons name={icon} size={compact ? 16 : 22} color={colors.or} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  wrapDesk: {
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 18,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headCenter: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  kicker: {
    fontFamily: fonts.corpsSemi,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  range: {
    fontFamily: fonts.corps,
    fontSize: 13,
    color: colors.ink2,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeOn: {
    backgroundColor: colors.orWash,
    borderColor: 'rgba(42,99,73,0.22)',
  },
  badgeOff: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.rule,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: colors.orVif,
  },
  dotOff: {
    backgroundColor: colors.ink3,
  },
  badgeText: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    color: colors.ink2,
  },
  badgeTextOn: {
    color: colors.or,
  },
  nav: {
    width: TOUCH,
    height: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.orWash,
  },
  navMini: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  yearLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ink3,
    paddingHorizontal: 8,
  },
  crown: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  stem: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 22,
    height: 1.5,
    backgroundColor: colors.goldLine,
    borderRadius: 1,
  },
  beadHit: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    minHeight: TOUCH,
  },
  bead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ruleFort,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  beadPast: {
    backgroundColor: colors.orWash,
    borderColor: 'rgba(42,99,73,0.28)',
  },
  beadCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: colors.or,
    backgroundColor: colors.surface,
  },
  beadSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ambreVif,
    borderColor: colors.ambre,
  },
  beadCore: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  beadFuture: {
    backgroundColor: 'transparent',
    borderColor: colors.rule,
    opacity: 0.45,
  },
  beadLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 9,
    letterSpacing: 0.2,
    color: colors.ink3,
  },
  beadLabelOn: {
    color: colors.ambre,
    fontFamily: fonts.corpsBold,
  },
  beadLabelFuture: {
    color: colors.ruleFort,
  },
  nowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    minHeight: TOUCH,
    paddingHorizontal: 12,
  },
  nowText: {
    fontFamily: fonts.corpsBold,
    fontSize: 14,
    color: colors.or,
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.corps,
    fontSize: 12,
    color: colors.ink3,
  },
});
