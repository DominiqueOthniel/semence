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

export const CURRENCIES: {
  code: CurrencyCode;
  label: string;
  suffix: string;
  sampleIncome: string;
}[] = [
  { code: 'XAF', label: 'FCFA (BEAC)', suffix: 'FCFA', sampleIncome: '185000' },
  { code: 'XOF', label: 'FCFA (UEMOA)', suffix: 'FCFA', sampleIncome: '185000' },
  { code: 'EUR', label: 'Euro', suffix: '€', sampleIncome: '1800' },
  { code: 'USD', label: 'Dollar US', suffix: '$', sampleIncome: '2000' },
  { code: 'GBP', label: 'Livre', suffix: '£', sampleIncome: '1600' },
  { code: 'CAD', label: 'Dollar CA', suffix: 'CAD', sampleIncome: '2200' },
  { code: 'CHF', label: 'Franc suisse', suffix: 'CHF', sampleIncome: '1600' },
  { code: 'NGN', label: 'Naira', suffix: 'NGN', sampleIncome: '350000' },
  { code: 'GHS', label: 'Cedi', suffix: 'GHS', sampleIncome: '8000' },
  { code: 'MAD', label: 'Dirham', suffix: 'MAD', sampleIncome: '8000' },
  { code: 'CDF', label: 'Franc cong.', suffix: 'CDF', sampleIncome: '500000' },
  { code: 'KES', label: 'Shilling', suffix: 'KES', sampleIncome: '80000' },
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
