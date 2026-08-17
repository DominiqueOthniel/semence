import { currencyMeta, normalizeCurrency, type CurrencyCode } from './locale';

let activeCurrency: CurrencyCode = 'XAF';

export function setActiveCurrency(code?: string | null) {
  activeCurrency = normalizeCurrency(code);
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

export function currencySuffix(code?: string | null): string {
  return currencyMeta(code ?? activeCurrency).suffix;
}

/** Format entier dans la devise active (ou celle passée). */
export function fcfa(n: number, currency?: string | null): string {
  const rounded = Math.round(n);
  const abs = Math.abs(rounded);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  const suffix = currencySuffix(currency);
  return `${rounded < 0 ? '−' : ''}${formatted}\u00A0${suffix}`;
}

export function fcfaShort(n: number): string {
  const rounded = Math.round(n);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function parseFcfaInput(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

export interface EnvelopeSplit {
  don: number;
  epargne: number;
  semence: number;
  courant: number;
}

export function splitIncome(
  income: number,
  donRate: number,
  epargneRate: number,
  semenceRate: number,
): EnvelopeSplit {
  const base = Math.max(0, income);
  const don = Math.round((base * donRate) / 100);
  const epargne = Math.round((base * epargneRate) / 100);
  const semence = Math.round((base * semenceRate) / 100);
  const courant = base - don - epargne - semence;
  return {
    don,
    epargne,
    semence,
    courant,
  };
}

/** Jours restants jusqu'à la prochaine date de début de mois budgétaire. */
export function daysLeftInBudgetMonth(monthStartDay: number, from = new Date()): number {
  const day = from.getDate();
  const year = from.getFullYear();
  const month = from.getMonth();
  let next = new Date(year, month, monthStartDay);
  if (day >= monthStartDay) {
    next = new Date(year, month + 1, monthStartDay);
  }
  const ms = next.getTime() - from.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
