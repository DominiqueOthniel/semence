import { MONTH_LABELS, MONTH_SHORT } from './cashflow';

export type CycleStatus = 'en_cours' | 'clos' | 'a_venir';

export type Cycle = {
  key: string;
  year: number;
  month: number;
  fromISO: string;
  toISO: string;
  lastISO: string;
  label: string;
  short: string;
  rangeLabel: string;
  status: CycleStatus;
  statusLabel: string;
  offset: number;
  dayCount: number;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODate(raw: string): Date {
  const day = raw.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return new Date(NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

const MONTH_LOWER = MONTH_LABELS.map((m) => m.toLowerCase());

export function startOfCycle(monthStartDay: number, ref = new Date()): Date {
  const day = ref.getDate();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  if (day >= monthStartDay) return new Date(year, month, monthStartDay);
  return new Date(year, month - 1, monthStartDay);
}

export function nextCycleStart(start: Date, monthStartDay: number): Date {
  return new Date(start.getFullYear(), start.getMonth() + 1, monthStartDay);
}

export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function formatDayMonth(d: Date) {
  return `${d.getDate()} ${MONTH_LOWER[d.getMonth()]}`;
}

export function buildCycle(start: Date, monthStartDay: number, now = new Date()): Cycle {
  const from = startOfDay(start);
  const to = nextCycleStart(from, monthStartDay);
  const last = addDays(to, -1);
  const currentStart = startOfCycle(monthStartDay, now);
  const offset = monthsBetween(currentStart, from);
  const status: CycleStatus = offset === 0 ? 'en_cours' : offset > 0 ? 'a_venir' : 'clos';
  const dayCount = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const sameMonth = from.getMonth() === last.getMonth() && from.getFullYear() === last.getFullYear();
  const rangeLabel = sameMonth
    ? `${from.getDate()} au ${last.getDate()} ${MONTH_LOWER[from.getMonth()]}`
    : `${formatDayMonth(from)} au ${formatDayMonth(last)}`;

  return {
    key: `${from.getFullYear()}-${pad2(from.getMonth() + 1)}`,
    year: from.getFullYear(),
    month: from.getMonth(),
    fromISO: isoFromDate(from),
    toISO: isoFromDate(to),
    lastISO: isoFromDate(last),
    label: `${MONTH_LABELS[from.getMonth()]} ${from.getFullYear()}`,
    short: MONTH_SHORT[from.getMonth()],
    rangeLabel,
    status,
    statusLabel: status === 'en_cours' ? 'En cours' : status === 'clos' ? 'Clos' : 'À venir',
    offset,
    dayCount,
  };
}

export function cycleAtOffset(monthStartDay: number, offset: number, now = new Date()): Cycle {
  const current = startOfCycle(monthStartDay, now);
  const start = new Date(current.getFullYear(), current.getMonth() + offset, monthStartDay);
  return buildCycle(start, monthStartDay, now);
}

export function cycleForMonth(
  monthStartDay: number,
  year: number,
  month: number,
  now = new Date(),
): Cycle {
  const start = new Date(year, month, monthStartDay);
  return buildCycle(start, monthStartDay, now);
}

export function daysLeftInCycle(cycle: Cycle, from = new Date()): number {
  if (cycle.status !== 'en_cours') return 0;
  const end = parseISODate(cycle.toISO);
  const ms = startOfDay(end).getTime() - startOfDay(from).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function inCycle(dateISO: string, cycle: Cycle): boolean {
  const day = dateISO.slice(0, 10);
  return day >= cycle.fromISO && day < cycle.toISO;
}

export const MAX_CYCLE_BACK = 36;

export function clampCycleOffset(offset: number): number {
  if (offset > 0) return 0;
  if (offset < -MAX_CYCLE_BACK) return -MAX_CYCLE_BACK;
  return offset;
}
