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

export const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

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

function emptyPoint(key: string, label: string, short: string): CashflowPoint {
  return { key, label, short, revenus: 0, depenses: 0 };
}

function addTx(point: CashflowPoint, tx: Transaction) {
  if (tx.type === 'revenu') point.revenus += tx.amount;
  else if (tx.type === 'depense') point.depenses += tx.amount;
}

/** 7 derniers jours (aujourd’hui inclus). */
export function weeklyCashflow(transactions: Transaction[], now = new Date()): CashflowPoint[] {
  const end = startOfDay(now);
  const rows: CashflowPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = isoDay(d);
    rows.push(emptyPoint(key, DAY_SHORT[d.getDay()], `${d.getDate()}`));
  }
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const tx of transactions) {
    const d = parseTxDate(tx.date);
    if (!d) continue;
    const key = isoDay(d);
    const i = index.get(key);
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
    const key = isoDay(d);
    rows.push(emptyPoint(key, String(day), String(day)));
  }
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const tx of transactions) {
    const d = parseTxDate(tx.date);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = isoDay(d);
    const i = index.get(key);
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
): CashflowPoint[] {
  if (period === 'hebdo') return weeklyCashflow(transactions, now);
  if (period === 'mensuel') return monthlyDaysCashflow(transactions, now);
  return yearlyCashflow(transactions, now.getFullYear());
}

export function periodCaption(period: CashflowPeriod, now = new Date()): string {
  if (period === 'hebdo') return '7 derniers jours';
  if (period === 'mensuel') return MONTH_LABELS[now.getMonth()];
  return `Année ${now.getFullYear()}`;
}

export function niceAxisMax(values: number[]): number {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return 100_000;
  const padded = peak * 1.15;
  const mag = Math.pow(10, Math.floor(Math.log10(padded)));
  const norm = padded / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return Math.ceil(norm / step) * step * mag;
}

export function axisTicks(max: number, count = 6): number[] {
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round((max * i) / (count - 1)));
  }
  return ticks;
}

export function formatAxisFcfa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} M`;
  if (n >= 1000) return `${fcfaShort(Math.round(n / 1000))} k`;
  return fcfaShort(n);
}
