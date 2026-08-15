import type { Transaction } from '../types';
import { fcfaShort } from './money';

export const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

export const MONTH_SHORT = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
] as const;

/** Ordre calendaire lundi → dimanche. */
export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export type CashflowPeriod = 'hebdo' | 'mensuel' | 'annuel';

export type CashflowPoint = {
  key: string;
  label: string;
  short: string;
  revenus: number;
  depenses: number;
};

function parseTxDate(raw: string): Date | null {
  if (!raw) return null;
  const day = raw.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lundi 00:00 de la semaine contenant `now`. */
export function startOfWeekMonday(now: Date): Date {
  const d = startOfDay(now);
  const dow = d.getDay(); // 0 = dimanche … 6 = samedi
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}

function emptyPoint(key: string, label: string, short: string): CashflowPoint {
  return { key, label, short, revenus: 0, depenses: 0 };
}

function addTx(point: CashflowPoint, tx: Transaction) {
  if (tx.type === 'revenu') point.revenus += tx.amount;
  else if (tx.type === 'depense') point.depenses += tx.amount;
}

/** Semaine calendaire : lundi → dimanche (7 jours fixes). */
export function weeklyCashflow(transactions: Transaction[], now = new Date()): CashflowPoint[] {
  const monday = startOfWeekMonday(now);
  const rows: CashflowPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    rows.push(emptyPoint(isoDay(d), WEEKDAY_LABELS[i], String(d.getDate())));
  }
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const tx of transactions) {
    const d = parseTxDate(tx.date);
    if (!d) continue;
    const i = index.get(isoDay(d));
    if (i == null) continue;
    addTx(rows[i], tx);
  }
  return rows;
}

/** Jours du mois civil en cours. */
export function monthlyDaysCashflow(transactions: Transaction[], now = new Date()): CashflowPoint[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: CashflowPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    rows.push(emptyPoint(isoDay(d), String(day), String(day)));
  }
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const tx of transactions) {
    const d = parseTxDate(tx.date);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    const i = index.get(isoDay(d));
    if (i == null) continue;
    addTx(rows[i], tx);
  }
  return rows;
}

/** Mois de l’année civile. */
export function yearlyCashflow(transactions: Transaction[], year = new Date().getFullYear()): CashflowPoint[] {
  const rows: CashflowPoint[] = MONTH_LABELS.map((label, i) =>
    emptyPoint(`${year}-${i}`, label, MONTH_SHORT[i]),
  );
  for (const tx of transactions) {
    const d = parseTxDate(tx.date);
    if (!d || d.getFullYear() !== year) continue;
    addTx(rows[d.getMonth()], tx);
  }
  return rows;
}

export function cashflowForPeriod(
  transactions: Transaction[],
  period: CashflowPeriod,
  now = new Date(),
  cycleRange?: { fromISO: string; toISO: string; lastISO: string },
): CashflowPoint[] {
  if (period === 'hebdo') return weeklyCashflow(transactions, now);
  if (period === 'mensuel') {
    if (cycleRange) return cycleDaysCashflow(transactions, cycleRange);
    return monthlyDaysCashflow(transactions, now);
  }
  return yearlyCashflow(transactions, now.getFullYear());
}

/** Jours d’un cycle budgétaire (du jour de salaire au suivant). */
export function cycleDaysCashflow(
  transactions: Transaction[],
  cycle: { fromISO: string; toISO: string; lastISO: string },
): CashflowPoint[] {
  const from = parseTxDate(cycle.fromISO);
  const last = parseTxDate(cycle.lastISO);
  if (!from || !last) return monthlyDaysCashflow(transactions);
  const rows: CashflowPoint[] = [];
  for (let d = new Date(from); d.getTime() <= last.getTime(); d.setDate(d.getDate() + 1)) {
    const key = isoDay(d);
    rows.push(emptyPoint(key, String(d.getDate()), String(d.getDate())));
  }
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const tx of transactions) {
    const day = tx.date.slice(0, 10);
    const i = index.get(day);
    if (i == null) continue;
    addTx(rows[i], tx);
  }
  return rows;
}

export function periodCaption(
  period: CashflowPeriod,
  now = new Date(),
  cycleRange?: { rangeLabel: string; year: number },
): string {
  if (period === 'hebdo') {
    const mon = startOfWeekMonday(now);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const sameMonth = mon.getMonth() === sun.getMonth();
    if (sameMonth) {
      return `Lun ${mon.getDate()} – Dim ${sun.getDate()} ${MONTH_SHORT[sun.getMonth()]}`;
    }
    return `Lun ${mon.getDate()} ${MONTH_SHORT[mon.getMonth()]} – Dim ${sun.getDate()} ${MONTH_SHORT[sun.getMonth()]}`;
  }
  if (period === 'mensuel') return cycleRange?.rangeLabel ?? MONTH_LABELS[now.getMonth()];
  return `Année ${cycleRange?.year ?? now.getFullYear()}`;
}

export function niceAxisMax(values: number[]): number {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return 100_000;
  const padded = peak * 1.12;
  const mag = Math.pow(10, Math.floor(Math.log10(padded)));
  const norm = padded / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return Math.ceil(norm / step) * step * mag;
}

export function axisTicks(max: number, count = 5): number[] {
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round((max * i) / (count - 1)));
  }
  return ticks;
}

export function formatAxisFcfa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return fcfaShort(n);
}
