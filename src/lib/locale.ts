export type CurrencyCode =
  | 'XAF'
  | 'XOF'
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'CAD'
  | 'CHF'
  | 'NGN'
  | 'GHS'
  | 'MAD'
  | 'CDF'
  | 'KES';

export type CurrencyMeta = {
  code: CurrencyCode;
  label: string;
  suffix: string;
  /** Revenu mensuel d’exemple, dans l’unité de la devise. */
  sampleIncome: number;
  /** 0 pour les francs CFA et devises sans centimes utiles, 2 sinon. */
  decimals: 0 | 2;
  favorites: { label: string; amount: number }[];
};

export const CURRENCIES: CurrencyMeta[] = [
  {
    code: 'XAF',
    label: 'FCFA (BEAC)',
    suffix: 'FCFA',
    sampleIncome: 185000,
    decimals: 0,
    favorites: [
      { label: 'Taxi', amount: 300 },
      { label: 'Déjeuner', amount: 1500 },
      { label: 'Crédit tél.', amount: 1000 },
      { label: 'Pain', amount: 200 },
    ],
  },
  {
    code: 'XOF',
    label: 'FCFA (UEMOA)',
    suffix: 'FCFA',
    sampleIncome: 185000,
    decimals: 0,
    favorites: [
      { label: 'Taxi', amount: 300 },
      { label: 'Déjeuner', amount: 1500 },
      { label: 'Crédit tél.', amount: 1000 },
      { label: 'Pain', amount: 200 },
    ],
  },
  {
    code: 'EUR',
    label: 'Euro',
    suffix: '€',
    sampleIncome: 1800,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 12 },
      { label: 'Déjeuner', amount: 15 },
      { label: 'Crédit tél.', amount: 10 },
      { label: 'Pain', amount: 1.5 },
    ],
  },
  {
    code: 'USD',
    label: 'Dollar US',
    suffix: '$',
    sampleIncome: 2000,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 12 },
      { label: 'Déjeuner', amount: 15 },
      { label: 'Crédit tél.', amount: 10 },
      { label: 'Pain', amount: 3 },
    ],
  },
  {
    code: 'GBP',
    label: 'Livre',
    suffix: '£',
    sampleIncome: 1600,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 10 },
      { label: 'Déjeuner', amount: 12 },
      { label: 'Crédit tél.', amount: 10 },
      { label: 'Pain', amount: 1.5 },
    ],
  },
  {
    code: 'CAD',
    label: 'Dollar CA',
    suffix: 'CAD',
    sampleIncome: 2200,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 12 },
      { label: 'Déjeuner', amount: 18 },
      { label: 'Crédit tél.', amount: 10 },
      { label: 'Pain', amount: 3 },
    ],
  },
  {
    code: 'CHF',
    label: 'Franc suisse',
    suffix: 'CHF',
    sampleIncome: 1600,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 8 },
      { label: 'Déjeuner', amount: 18 },
      { label: 'Crédit tél.', amount: 10 },
      { label: 'Pain', amount: 2 },
    ],
  },
  {
    code: 'NGN',
    label: 'Naira',
    suffix: 'NGN',
    sampleIncome: 350000,
    decimals: 0,
    favorites: [
      { label: 'Taxi', amount: 1500 },
      { label: 'Déjeuner', amount: 2500 },
      { label: 'Crédit tél.', amount: 500 },
      { label: 'Pain', amount: 500 },
    ],
  },
  {
    code: 'GHS',
    label: 'Cedi',
    suffix: 'GHS',
    sampleIncome: 8000,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 20 },
      { label: 'Déjeuner', amount: 40 },
      { label: 'Crédit tél.', amount: 10 },
      { label: 'Pain', amount: 5 },
    ],
  },
  {
    code: 'MAD',
    label: 'Dirham',
    suffix: 'MAD',
    sampleIncome: 8000,
    decimals: 2,
    favorites: [
      { label: 'Taxi', amount: 20 },
      { label: 'Déjeuner', amount: 50 },
      { label: 'Crédit tél.', amount: 20 },
      { label: 'Pain', amount: 5 },
    ],
  },
  {
    code: 'CDF',
    label: 'Franc cong.',
    suffix: 'CDF',
    sampleIncome: 500000,
    decimals: 0,
    favorites: [
      { label: 'Taxi', amount: 3000 },
      { label: 'Déjeuner', amount: 5000 },
      { label: 'Crédit tél.', amount: 2000 },
      { label: 'Pain', amount: 1500 },
    ],
  },
  {
    code: 'KES',
    label: 'Shilling',
    suffix: 'KES',
    sampleIncome: 80000,
    decimals: 0,
    favorites: [
      { label: 'Taxi', amount: 200 },
      { label: 'Déjeuner', amount: 400 },
      { label: 'Crédit tél.', amount: 50 },
      { label: 'Pain', amount: 50 },
    ],
  },
];

export const PHONE_CODES: {
  code: string;
  country: string;
  currency: CurrencyCode;
}[] = [
  { code: '237', country: 'Cameroun', currency: 'XAF' },
  { code: '33', country: 'France', currency: 'EUR' },
  { code: '32', country: 'Belgique', currency: 'EUR' },
  { code: '41', country: 'Suisse', currency: 'CHF' },
  { code: '1', country: 'Canada / US', currency: 'CAD' },
  { code: '221', country: 'Sénégal', currency: 'XOF' },
  { code: '225', country: 'Côte d’Ivoire', currency: 'XOF' },
  { code: '241', country: 'Gabon', currency: 'XAF' },
  { code: '243', country: 'RD Congo', currency: 'CDF' },
  { code: '212', country: 'Maroc', currency: 'MAD' },
  { code: '234', country: 'Nigeria', currency: 'NGN' },
  { code: '233', country: 'Ghana', currency: 'GHS' },
  { code: '44', country: 'Royaume-Uni', currency: 'GBP' },
  { code: '49', country: 'Allemagne', currency: 'EUR' },
  { code: '351', country: 'Portugal', currency: 'EUR' },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'XAF';
export const DEFAULT_PHONE_CODE = '237';

/**
 * Unités de cette devise pour 1 euro.
 * XAF / XOF : parité officielle. Autres : référence hors ligne, août 2026.
 */
export const UNITS_PER_EUR: Record<CurrencyCode, number> = {
  EUR: 1,
  XAF: 655.957,
  XOF: 655.957,
  USD: 1.1605,
  GBP: 0.8561,
  CAD: 1.6098,
  CHF: 0.9402,
  NGN: 1606.76,
  GHS: 12.6607,
  MAD: 10.7628,
  CDF: 3340,
  KES: 149.91,
};

export function isCurrency(value: string): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

export function normalizeCurrency(value?: string | null): CurrencyCode {
  return value && isCurrency(value) ? value : DEFAULT_CURRENCY;
}

export function normalizePhoneCode(value?: string | null): string {
  const digits = String(value || '').replace(/[^\d]/g, '');
  if (!digits) return DEFAULT_PHONE_CODE;
  if (PHONE_CODES.some((c) => c.code === digits)) return digits;
  return digits.slice(0, 4);
}

export function currencyMeta(code?: string | null) {
  const key = normalizeCurrency(code);
  return CURRENCIES.find((c) => c.code === key) ?? CURRENCIES[0];
}

export function phoneMeta(code?: string | null) {
  const key = normalizePhoneCode(code);
  return PHONE_CODES.find((c) => c.code === key) ?? PHONE_CODES[0];
}

export function formatPhone(code?: string | null, local?: string | null): string {
  const prefix = normalizePhoneCode(code);
  const number = String(local || '').replace(/[^\d]/g, '');
  if (!number) return `+${prefix}`;
  return `+${prefix} ${number}`;
}

export function favoritesForCurrency(code?: string | null) {
  return currencyMeta(code).favorites.map((f) => ({ ...f }));
}
