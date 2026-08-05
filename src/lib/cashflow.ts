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

export type MonthCashflow = {
  month: number;
  label: string;
  short: string;
  revenus: number;
  depenses: number;
};

/** Agrège revenus et dépenses par mois civil pour une année. */
export function monthlyCashflow(transactions: Transaction[], year = new Date().getFullYear()): MonthCashflow[] {
  const rows: MonthCashflow[] = MONTH_LABELS.map((label, i) => ({
    month: i,
    label,
    short: MONTH_SHORT[i],
    revenus: 0,
    depenses: 0,
  }));

  for (const tx of transactions) {
    const d = parseTxDate(tx.date);
    if (!d || d.getFullYear() !== year) continue;
    const m = d.getMonth();
    if (tx.type === 'revenu') rows[m].revenus += tx.amount;
    else if (tx.type === 'depense') rows[m].depenses += tx.amount;
  }

  return rows;
}

function parseTxDate(raw: string): Date | null {
  if (!raw) return null;
  // ISO date YYYY-MM-DD or full ISO
  const day = raw.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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
