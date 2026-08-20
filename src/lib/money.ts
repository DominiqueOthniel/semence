import { currencyMeta, normalizeCurrency, UNITS_PER_EUR, type CurrencyCode } from './locale';

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

export function currencyDecimals(code?: string | null): 0 | 2 {
  return currencyMeta(code ?? activeCurrency).decimals;
}

export function moneyKeyboard(code?: string | null): 'number-pad' | 'decimal-pad' {
  return currencyDecimals(code) > 0 ? 'decimal-pad' : 'number-pad';
}

export function roundMoney(n: number, code?: string | null): number {
  const d = currencyDecimals(code);
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function groupInt(raw: string): string {
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

/** Format dans la devise active (ou celle passée). */
export function fcfa(n: number, currency?: string | null): string {
  const code = currency ?? getActiveCurrency();
  const rounded = roundMoney(n, code);
  const sign = rounded < 0 ? '−' : '';
  const abs = Math.abs(rounded);
  const d = currencyDecimals(code);
  let core: string;
  if (d === 0) {
    core = groupInt(String(Math.round(abs)));
  } else {
    const [int, frac] = abs.toFixed(d).split('.');
    core = `${groupInt(int)},${frac}`;
  }
  return `${sign}${core}\u00A0${currencySuffix(code)}`;
}

export function fcfaShort(n: number, currency?: string | null): string {
  const rounded = roundMoney(n, currency);
  const d = currencyDecimals(currency);
  const abs = Math.abs(rounded);
  if (d === 0) return groupInt(String(Math.round(abs)));
  const [int, frac] = abs.toFixed(d).split('.');
  const trimmed = frac.replace(/0+$/, '');
  return trimmed ? `${groupInt(int)},${trimmed}` : groupInt(int);
}

export function moneyToInput(n: number, code?: string | null): string {
  if (!n) return '';
  const rounded = roundMoney(n, code);
  const d = currencyDecimals(code);
  if (d === 0) return String(Math.round(rounded));
  const [int, frac] = Math.abs(rounded).toFixed(d).split('.');
  const trimmed = frac.replace(/0+$/, '');
  const body = trimmed ? `${int},${trimmed}` : int;
  return rounded < 0 ? `-${body}` : body;
}

export function sanitizeMoneyInput(raw: string, code?: string | null): string {
  const d = currencyDecimals(code);
  const compact = raw.replace(/\s/g, '');
  if (d === 0) return compact.replace(/[^\d]/g, '');
  let seenSep = false;
  let out = '';
  for (const ch of compact) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if ((ch === ',' || ch === '.') && !seenSep) {
      seenSep = true;
      out += ',';
    }
  }
  const [int = '', frac = ''] = out.split(',');
  return seenSep ? `${int},${frac.slice(0, d)}` : int;
}

export function parseFcfaInput(raw: string, code?: string | null): number {
  const cleaned = sanitizeMoneyInput(raw, code);
  if (!cleaned) return 0;
  const n = Number(cleaned.replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return roundMoney(n, code);
}

export function convertAmount(amount: number, from: string | null | undefined, to: string | null | undefined): number {
  const src = normalizeCurrency(from);
  const dst = normalizeCurrency(to);
  if (src === dst) return roundMoney(amount, dst);
  const srcPerEur = UNITS_PER_EUR[src];
  const dstPerEur = UNITS_PER_EUR[dst];
  if (!srcPerEur || !dstPerEur) return roundMoney(amount, dst);
  return roundMoney((amount * dstPerEur) / srcPerEur, dst);
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
  code?: string | null,
): EnvelopeSplit {
  const base = Math.max(0, income);
  const don = roundMoney((base * donRate) / 100, code);
  const epargne = roundMoney((base * epargneRate) / 100, code);
  const semence = roundMoney((base * semenceRate) / 100, code);
  const courant = roundMoney(base - don - epargne - semence, code);
  return {
    don,
    epargne,
    semence,
    courant,
  };
}

export function splitFromAmounts(
  income: number,
  don: number,
  epargne: number,
  semence: number,
  code?: string | null,
): EnvelopeSplit {
  const base = Math.max(0, income);
  const nextDon = Math.max(0, roundMoney(don, code));
  const nextEpargne = Math.max(0, roundMoney(epargne, code));
  const nextSemence = Math.max(0, roundMoney(semence, code));
  return {
    don: nextDon,
    epargne: nextEpargne,
    semence: nextSemence,
    courant: roundMoney(base - nextDon - nextEpargne - nextSemence, code),
  };
}

export function rateFromAmount(amount: number, income: number): number {
  if (income <= 0) return 0;
  return Math.round((amount * 1000) / income) / 10;
}

export function ratesFromAmounts(
  income: number,
  don: number,
  epargne: number,
  semence: number,
): { donRate: number; epargneRate: number; semenceRate: number } {
  return {
    donRate: rateFromAmount(don, income),
    epargneRate: rateFromAmount(epargne, income),
    semenceRate: rateFromAmount(semence, income),
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
