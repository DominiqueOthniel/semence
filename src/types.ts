export type Profil = 'chretien' | 'musulman' | 'solidarite' | 'aucun';

export type AccountType = 'especes' | 'mtn_momo' | 'orange_money' | 'banque' | 'tontine' | 'autre';

export type TxType = 'depense' | 'revenu' | 'transfert' | 'enveloppe';

export type EnvelopeKind = 'don' | 'epargne' | 'semence' | 'courant';

export interface Settings {
  id: number;
  name: string;
  phone: string;
  phoneCode: string;
  currency: string;
  profil: Profil;
  pinHash: string | null;
  /** Empreinte du code de secours, pour un PIN oublié. */
  recoveryHash: string | null;
  monthStartDay: number;
  eveningHour: number;
  eveningMinute: number;
  onboardingDone: number;
  theme: 'light' | 'dark' | 'system';
  donRate: number;
  epargneRate: number;
  semenceRate: number;
  monthlyIncome: number;
  /** Preset id (`initials`, `leaf`, …) utilisé si pas de photo. */
  avatarPreset: string;
  /** Data URI base64 de la photo de profil, ou null. */
  avatarPhoto: string | null;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  archived: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  envelope: EnvelopeKind;
  parentId: number | null;
  color: string;
}

export interface Transaction {
  id: number;
  accountId: number;
  toAccountId: number | null;
  type: TxType;
  amount: number;
  categoryId: number | null;
  envelope: EnvelopeKind | null;
  note: string;
  date: string;
  createdAt: string;
}

export interface Debt {
  id: number;
  person: string;
  amount: number;
  remaining: number;
  direction: 'je_dois' | 'on_me_doit';
  dueDate: string | null;
  note: string;
  createdAt: string;
}

export interface Credit {
  id: number;
  label: string;
  received: number;
  totalDue: number;
  remaining: number;
  startDate: string;
  note: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target: number;
  current: number;
  dueDate: string | null;
  /** Durée prévue, en mois. */
  months: number | null;
  /** Versement prévu chaque mois. */
  monthlyBudget: number | null;
  createdAt: string;
}

export interface FavoriteAmount {
  id: number;
  label: string;
  amount: number;
  categoryId: number | null;
}

export const PROFIL_LABELS: Record<Profil, string> = {
  chretien: 'Chrétien',
  musulman: 'Musulman',
  solidarite: 'Solidarité',
  aucun: 'Aucun',
};

export const DON_LABELS: Record<Profil, string> = {
  chretien: 'Dîme & offrande',
  musulman: 'Zakât & sadaqa',
  solidarite: 'Entraide & famille',
  aucun: '',
};

export const DEFAULT_RATES: Record<Profil, { don: number; epargne: number; semence: number }> = {
  chretien: { don: 10, epargne: 10, semence: 5 },
  musulman: { don: 2.5, epargne: 10, semence: 5 },
  solidarite: { don: 5, epargne: 10, semence: 5 },
  aucun: { don: 0, epargne: 10, semence: 5 },
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  especes: 'Espèces',
  mtn_momo: 'MTN MoMo',
  orange_money: 'Orange Money',
  banque: 'Banque',
  tontine: 'Tontine',
  autre: 'Autre',
};
