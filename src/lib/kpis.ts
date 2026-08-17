import type { Transaction } from '../types';
import { cycleAtOffset } from './cycle';

export type CycleKpi = {
  offset: number;
  label: string;
  short: string;
  year: number;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
};

export type KpiDelta = {
  abs: number;
  pct: number | null;
  dir: 'up' | 'down' | 'flat';
};

export type KpiBoardData = {
  current: CycleKpi;
  previous: CycleKpi | null;
  avg3: { income: number; expense: number; net: number; savingsRate: number } | null;
  yearAgo: CycleKpi | null;
  history: CycleKpi[];
  best: CycleKpi | null;
  worst: CycleKpi | null;
};

function sumCycle(txs: Transaction[], fromISO: string, toISO: string) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    const day = t.date.slice(0, 10);
    if (day < fromISO || day >= toISO) continue;
    if (t.type === 'revenu') income += t.amount;
    else if (t.type === 'depense') expense += t.amount;
  }
  const net = income - expense;
  return {
    income,
    expense,
    net,
    savingsRate: income > 0 ? Math.round((net / income) * 100) : 0,
  };
}

export function snapshotAt(
  monthStartDay: number,
  txs: Transaction[],
  offset: number,
): CycleKpi {
  const cycle = cycleAtOffset(monthStartDay, offset);
  const sums = sumCycle(txs, cycle.fromISO, cycle.toISO);
  return {
    offset,
    label: cycle.label,
    short: cycle.short,
    year: cycle.year,
    ...sums,
  };
}

export function buildKpiBoard(
  monthStartDay: number,
  txs: Transaction[],
  viewOffset: number,
  depth = 6,
): KpiBoardData {
  const history: CycleKpi[] = [];
  for (let i = 0; i < depth; i += 1) {
    history.push(snapshotAt(monthStartDay, txs, viewOffset - i));
  }
  const current = history[0];
  const previous = history[1] ?? null;
  const past = history.slice(1).filter((s) => s.income > 0 || s.expense > 0);
  const sample = past.slice(0, 3);
  const avg3 =
    sample.length > 0
      ? (() => {
          const income = Math.round(sample.reduce((s, x) => s + x.income, 0) / sample.length);
          const expense = Math.round(sample.reduce((s, x) => s + x.expense, 0) / sample.length);
          const net = income - expense;
          return {
            income,
            expense,
            net,
            savingsRate: income > 0 ? Math.round((net / income) * 100) : 0,
          };
        })()
      : null;

  const yearAgoRaw = snapshotAt(monthStartDay, txs, viewOffset - 12);
  const yearAgo = yearAgoRaw.income > 0 || yearAgoRaw.expense > 0 ? yearAgoRaw : null;

  const ranked = past.length ? past : history.filter((s) => s.offset !== current.offset);
  let best: CycleKpi | null = null;
  let worst: CycleKpi | null = null;
  for (const s of ranked) {
    if (!best || s.net > best.net) best = s;
    if (!worst || s.net < worst.net) worst = s;
  }

  return { current, previous, avg3, yearAgo, history: history.slice().reverse(), best, worst };
}

export function delta(current: number, previous: number | null | undefined): KpiDelta | null {
  if (previous == null) return null;
  const abs = current - previous;
  if (abs === 0) return { abs: 0, pct: 0, dir: 'flat' };
  const pct = previous !== 0 ? Math.round((abs / Math.abs(previous)) * 100) : null;
  return { abs, pct, dir: abs > 0 ? 'up' : 'down' };
}
