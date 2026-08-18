import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Account,
  AccountType,
  Category,
  Credit,
  Debt,
  EnvelopeKind,
  FavoriteAmount,
  Profil,
  SavingsGoal,
  Settings,
  Transaction,
} from '../types';
import { DEFAULT_RATES } from '../types';
import { nowISO, todayISO, convertAmount } from '../lib/money';
import { cycleAtOffset, isoFromDate } from '../lib/cycle';
import { DEFAULT_CURRENCY, DEFAULT_PHONE_CODE, favoritesForCurrency, normalizeCurrency, normalizePhoneCode } from '../lib/locale';
import { generateRecoveryCode, normalizeRecovery } from '../lib/recovery';

const KEY = 'semence.v1';

interface Store {
  settings: Settings;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  credits: Credit[];
  goals: SavingsGoal[];
  favorites: FavoriteAmount[];
  eveningLogs: { date: string; amount: number; done: number; note: string }[];
  seq: number;
}

let cache: Store | null = null;
let boot: Promise<Store> | null = null;

function defaultSettings(): Settings {
  return {
    id: 1,
    name: '',
    phone: '',
    phoneCode: DEFAULT_PHONE_CODE,
    currency: DEFAULT_CURRENCY,
    profil: 'chretien',
    pinHash: null,
    recoveryHash: null,
    monthStartDay: 1,
    eveningHour: 20,
    eveningMinute: 30,
    onboardingDone: 0,
    theme: 'system',
    donRate: 10,
    epargneRate: 10,
    semenceRate: 5,
    monthlyIncome: 0,
    avatarPreset: 'initials',
    avatarPhoto: null,
  };
}

function normalizeSettings(raw: Partial<Settings>): Settings {
  const base = defaultSettings();
  const merged = { ...base, ...raw };
  const day = Number(merged.monthStartDay);
  return {
    ...merged,
    monthStartDay: Number.isFinite(day) ? Math.min(28, Math.max(1, Math.round(day))) : base.monthStartDay,
    avatarPreset: typeof raw.avatarPreset === 'string' ? raw.avatarPreset : merged.avatarPreset || base.avatarPreset,
    avatarPhoto: typeof raw.avatarPhoto === 'string' ? raw.avatarPhoto : null,
    recoveryHash: typeof raw.recoveryHash === 'string' ? raw.recoveryHash : null,
    currency: normalizeCurrency(raw.currency ?? merged.currency),
    phoneCode: normalizePhoneCode(raw.phoneCode ?? merged.phoneCode),
  };
}

function defaultCategories(): Category[] {
  const rows: Array<[string, EnvelopeKind, string]> = [
    ['Dîme & offrande', 'don', '#8E6516'],
    ['Zakât & sadaqa', 'don', '#8E6516'],
    ['Entraide & famille', 'don', '#8E6516'],
    ['Épargne', 'epargne', '#4E6E39'],
    ['Semence', 'semence', '#B98A2A'],
    ['Nourriture', 'courant', '#585144'],
    ['Transport', 'courant', '#585144'],
    ['Loyer', 'courant', '#585144'],
    ['Téléphone', 'courant', '#585144'],
    ['Santé', 'courant', '#585144'],
    ['Divers', 'courant', '#8B8271'],
  ];
  return rows.map(([name, envelope, color], i) => ({
    id: i + 1,
    name,
    envelope,
    parentId: null,
    color,
  }));
}

function defaultFavorites(currency = DEFAULT_CURRENCY): FavoriteAmount[] {
  return favoritesForCurrency(currency).map((f, i) => ({
    id: i + 1,
    label: f.label,
    amount: f.amount,
    categoryId: null,
  }));
}

function emptyStore(): Store {
  return {
    settings: defaultSettings(),
    accounts: [],
    categories: defaultCategories(),
    transactions: [],
    debts: [],
    credits: [],
    goals: [],
    favorites: defaultFavorites(),
    eveningLogs: [],
    seq: 20,
  };
}

async function load(): Promise<Store> {
  if (cache) return cache;
  if (boot) return boot;
  boot = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Store;
        parsed.settings = normalizeSettings(parsed.settings as Settings);
        cache = parsed;
      } else {
        cache = emptyStore();
        await AsyncStorage.setItem(KEY, JSON.stringify(cache));
      }
    } catch (e) {
      console.warn('Semence storage fallback', e);
      cache = emptyStore();
    }
    return cache!;
  })();
  return boot;
}

async function save(store: Store): Promise<void> {
  cache = store;
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

function nextId(store: Store): number {
  store.seq += 1;
  return store.seq;
}

export async function getDb(): Promise<Store> {
  return load();
}

export async function getSettings(): Promise<Settings> {
  const s = await load();
  return { ...s.settings };
}

export async function updateSettings(patch: Partial<{
  name: string;
  phone: string;
  phoneCode: string;
  currency: string;
  profil: Profil;
  pinHash: string | null;
  recoveryHash: string | null;
  monthStartDay: number;
  eveningHour: number;
  eveningMinute: number;
  onboardingDone: number;
  theme: Settings['theme'];
  donRate: number;
  epargneRate: number;
  semenceRate: number;
  monthlyIncome: number;
  avatarPreset: string;
  avatarPhoto: string | null;
}>): Promise<Settings> {
  const store = await load();
  store.settings = normalizeSettings({ ...store.settings, ...patch });
  await save(store);
  return { ...store.settings };
}

function sameFavoriteSet(current: FavoriteAmount[], currency: string) {
  const expected = defaultFavorites(currency);
  if (current.length !== expected.length) return false;
  return expected.every((item, i) => current[i]?.label === item.label && current[i]?.amount === item.amount);
}

export async function applyCurrencyChange(nextCode: string): Promise<Settings> {
  const store = await load();
  const from = normalizeCurrency(store.settings.currency);
  const to = normalizeCurrency(nextCode);
  if (from === to) {
    store.settings = normalizeSettings({ ...store.settings, currency: to });
    await save(store);
    return { ...store.settings };
  }

  const conv = (n: number) => convertAmount(n, from, to);
  store.settings.monthlyIncome = conv(store.settings.monthlyIncome);
  store.settings.currency = to;

  if (sameFavoriteSet(store.favorites, from)) {
    store.favorites = defaultFavorites(to);
  } else {
    store.favorites = store.favorites.map((f) => ({ ...f, amount: conv(f.amount) }));
  }

  store.accounts = store.accounts.map((a) => ({ ...a, balance: conv(a.balance) }));
  store.transactions = store.transactions.map((t) => ({ ...t, amount: conv(t.amount) }));
  store.debts = store.debts.map((d) => ({
    ...d,
    amount: conv(d.amount),
    remaining: conv(d.remaining),
  }));
  store.credits = store.credits.map((c) => ({
    ...c,
    received: conv(c.received),
    totalDue: conv(c.totalDue),
    remaining: conv(c.remaining),
  }));
  store.goals = store.goals.map((g) => ({
    ...g,
    target: conv(g.target),
    current: conv(g.current),
    monthlyBudget: g.monthlyBudget == null ? null : conv(g.monthlyBudget),
  }));
  store.eveningLogs = store.eveningLogs.map((e) => ({ ...e, amount: conv(e.amount) }));

  store.settings = normalizeSettings(store.settings);
  await save(store);
  return { ...store.settings };
}

export function simpleHash(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (h << 5) - h + pin.charCodeAt(i);
    h |= 0;
  }
  return `s${Math.abs(h).toString(16)}:${pin.length}`;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const s = await getSettings();
  if (!s.pinHash) return true;
  return s.pinHash === simpleHash(pin);
}

export async function hasRecoveryCode(): Promise<boolean> {
  const s = await getSettings();
  return !!s.recoveryHash;
}

export async function verifyRecovery(code: string): Promise<boolean> {
  const s = await getSettings();
  if (!s.recoveryHash) return false;
  const key = normalizeRecovery(code);
  if (key.length < 8) return false;
  return s.recoveryHash === simpleHash(key);
}

export async function resetPinWithRecovery(code: string, newPin: string): Promise<boolean> {
  if (newPin.length < 4) return false;
  const ok = await verifyRecovery(code);
  if (!ok) return false;
  await updateSettings({ pinHash: simpleHash(newPin) });
  return true;
}

export async function issueRecoveryCode(): Promise<string> {
  const code = generateRecoveryCode();
  await updateSettings({ recoveryHash: simpleHash(normalizeRecovery(code)) });
  return code;
}

/** Efface le carnet local et repart d’un magasin vide. */
export async function resetStore(): Promise<void> {
  cache = null;
  boot = null;
  await AsyncStorage.removeItem(KEY);
  const store = emptyStore();
  cache = store;
  await save(store);
}

export async function completeOnboarding(input: {
  name: string;
  phone: string;
  phoneCode: string;
  currency: string;
  profil: Profil;
  monthlyIncome: number;
  donRate: number;
  epargneRate: number;
  semenceRate: number;
  monthStartDay: number;
  pin: string;
  recoveryCode: string;
  avatarPreset?: string;
  avatarPhoto?: string | null;
}): Promise<void> {
  const rates = DEFAULT_RATES[input.profil];
  const donRate = input.profil === 'aucun' ? 0 : input.donRate || rates.don;

  await updateSettings({
    name: input.name,
    phone: input.phone,
    phoneCode: normalizePhoneCode(input.phoneCode),
    currency: normalizeCurrency(input.currency),
    profil: input.profil,
    monthlyIncome: input.monthlyIncome,
    donRate,
    epargneRate: input.epargneRate || rates.epargne,
    semenceRate: input.semenceRate || rates.semence,
    monthStartDay: input.monthStartDay,
    pinHash: simpleHash(input.pin),
    recoveryHash: simpleHash(normalizeRecovery(input.recoveryCode)),
    onboardingDone: 1,
    avatarPreset: input.avatarPreset || 'initials',
    avatarPhoto: input.avatarPhoto ?? null,
  });

  const store = await load();
  store.favorites = defaultFavorites(normalizeCurrency(input.currency));
  await save(store);
  if (store.accounts.filter((a) => !a.archived).length === 0) {
    const defaults: Array<[string, AccountType]> = [
      ['Espèces', 'especes'],
      ['MTN MoMo', 'mtn_momo'],
      ['Orange Money', 'orange_money'],
    ];
    for (const [name, type] of defaults) {
      store.accounts.push({
        id: nextId(store),
        name,
        type,
        balance: 0,
        archived: 0,
        createdAt: nowISO(),
      });
    }
    await save(store);
  }

  if (input.monthlyIncome > 0) {
    const accounts = await listAccounts();
    const cash = accounts.find((a) => a.type === 'especes') ?? accounts[0];
    if (cash) {
      await addIncome(cash.id, input.monthlyIncome, 'Revenu du mois', todayISO());
      const { splitIncome } = await import('../lib/money');
      const split = splitIncome(input.monthlyIncome, donRate, input.epargneRate, input.semenceRate, input.currency);
      if (donRate > 0 && split.don > 0) {
        await addExpense(cash.id, split.don, 'don', `Prélèvement ${input.profil}`, todayISO());
      }
      if (split.epargne > 0) {
        await addExpense(cash.id, split.epargne, 'epargne', 'Prélèvement épargne', todayISO());
      }
      if (split.semence > 0) {
        await addExpense(cash.id, split.semence, 'semence', 'Prélèvement semence', todayISO());
      }
    }
  }
}

export async function listAccounts(includeArchived = false): Promise<Account[]> {
  const store = await load();
  return store.accounts
    .filter((a) => includeArchived || !a.archived)
    .slice()
    .sort((a, b) => a.id - b.id);
}

export async function createAccount(name: string, type: AccountType, balance = 0): Promise<Account> {
  const store = await load();
  const account: Account = {
    id: nextId(store),
    name,
    type,
    balance,
    archived: 0,
    createdAt: nowISO(),
  };
  store.accounts.push(account);
  await save(store);
  return account;
}

export async function archiveAccount(id: number): Promise<void> {
  const store = await load();
  const a = store.accounts.find((x) => x.id === id);
  if (a) a.archived = 1;
  await save(store);
}

function bumpBalance(store: Store, accountId: number, delta: number) {
  const a = store.accounts.find((x) => x.id === accountId);
  if (a) a.balance += delta;
}

export async function addExpense(
  accountId: number,
  amount: number,
  envelope: EnvelopeKind,
  note: string,
  date = todayISO(),
  categoryId: number | null = null,
): Promise<Transaction> {
  const store = await load();
  const tx: Transaction = {
    id: nextId(store),
    accountId,
    toAccountId: null,
    type: 'depense',
    amount,
    categoryId,
    envelope,
    note,
    date,
    createdAt: nowISO(),
  };
  store.transactions.push(tx);
  bumpBalance(store, accountId, -amount);
  await save(store);
  return tx;
}

export async function addIncome(
  accountId: number,
  amount: number,
  note: string,
  date = todayISO(),
): Promise<Transaction> {
  const store = await load();
  const tx: Transaction = {
    id: nextId(store),
    accountId,
    toAccountId: null,
    type: 'revenu',
    amount,
    categoryId: null,
    envelope: null,
    note,
    date,
    createdAt: nowISO(),
  };
  store.transactions.push(tx);
  bumpBalance(store, accountId, amount);
  await save(store);
  return tx;
}

export async function transfer(
  fromId: number,
  toId: number,
  amount: number,
  note = 'Transfert',
  date = todayISO(),
): Promise<void> {
  const store = await load();
  store.transactions.push({
    id: nextId(store),
    accountId: fromId,
    toAccountId: toId,
    type: 'transfert',
    amount,
    categoryId: null,
    envelope: null,
    note,
    date,
    createdAt: nowISO(),
  });
  bumpBalance(store, fromId, -amount);
  bumpBalance(store, toId, amount);
  await save(store);
}

export async function listTransactions(limit = 50): Promise<Transaction[]> {
  const store = await load();
  return store.transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))
    .slice(0, limit);
}

/** Toutes les transactions (courbes hebdo / mensuel / annuel). */
export async function listAllTransactions(): Promise<Transaction[]> {
  const store = await load();
  return store.transactions.slice();
}

/** Toutes les transactions d’une année civile (pour les courbes). */
export async function listTransactionsForYear(year = new Date().getFullYear()): Promise<Transaction[]> {
  const store = await load();
  const prefix = `${year}-`;
  return store.transactions.filter((t) => t.date.startsWith(prefix));
}

export async function spentCourantThisMonth(monthStartDay: number): Promise<number> {
  const cycle = cycleAtOffset(monthStartDay, 0);
  return envelopeSpentInRange('courant', cycle.fromISO, cycle.toISO);
}

export async function envelopeSpent(kind: EnvelopeKind, monthStartDay: number): Promise<number> {
  const cycle = cycleAtOffset(monthStartDay, 0);
  return envelopeSpentInRange(kind, cycle.fromISO, cycle.toISO);
}

export async function envelopeSpentInRange(
  kind: EnvelopeKind,
  fromISO: string,
  toISOExclusive: string,
): Promise<number> {
  const store = await load();
  return store.transactions
    .filter(
      (t) =>
        t.type === 'depense' &&
        t.envelope === kind &&
        t.date.slice(0, 10) >= fromISO &&
        t.date.slice(0, 10) < toISOExclusive,
    )
    .reduce((s, t) => s + t.amount, 0);
}

export async function listTransactionsInRange(
  fromISO: string,
  toISOExclusive: string,
  limit = 80,
): Promise<Transaction[]> {
  const store = await load();
  return store.transactions
    .filter((t) => t.date.slice(0, 10) >= fromISO && t.date.slice(0, 10) < toISOExclusive)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))
    .slice(0, limit);
}

export async function listCategories(): Promise<Category[]> {
  const store = await load();
  return store.categories.slice();
}

export async function listFavorites(): Promise<FavoriteAmount[]> {
  const store = await load();
  return store.favorites.slice();
}

export async function listDebts(): Promise<Debt[]> {
  const store = await load();
  return store.debts.filter((d) => d.remaining > 0).slice().reverse();
}

export async function addDebt(input: {
  person: string;
  amount: number;
  direction: Debt['direction'];
  dueDate?: string | null;
  note?: string;
}): Promise<void> {
  const store = await load();
  store.debts.push({
    id: nextId(store),
    person: input.person,
    amount: input.amount,
    remaining: input.amount,
    direction: input.direction,
    dueDate: input.dueDate ?? null,
    note: input.note ?? '',
    createdAt: nowISO(),
  });
  await save(store);
}

export async function repayDebt(id: number, amount: number): Promise<void> {
  const store = await load();
  const d = store.debts.find((x) => x.id === id);
  if (d) d.remaining = Math.max(0, d.remaining - amount);
  await save(store);
}

export async function listCredits(): Promise<Credit[]> {
  const store = await load();
  return store.credits.slice().reverse();
}

export async function addCredit(input: {
  label: string;
  received: number;
  totalDue: number;
  startDate?: string;
  note?: string;
}): Promise<void> {
  const store = await load();
  store.credits.push({
    id: nextId(store),
    label: input.label,
    received: input.received,
    totalDue: input.totalDue,
    remaining: input.totalDue,
    startDate: input.startDate ?? todayISO(),
    note: input.note ?? '',
    createdAt: nowISO(),
  });
  await save(store);
}

export async function repayCredit(id: number, amount: number): Promise<void> {
  const store = await load();
  const c = store.credits.find((x) => x.id === id);
  if (c) c.remaining = Math.max(0, c.remaining - amount);
  await save(store);
}

export async function creditCostYear(): Promise<{ count: number; cost: number }> {
  const store = await load();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const from = yearAgo.toISOString().slice(0, 10);
  const rows = store.credits.filter((c) => c.startDate >= from);
  let cost = 0;
  for (const r of rows) cost += r.totalDue - r.received;
  return { count: rows.length, cost };
}

function normalizeGoal(raw: Partial<SavingsGoal>): SavingsGoal {
  return {
    id: Number(raw.id) || 0,
    name: String(raw.name || ''),
    target: Number(raw.target) || 0,
    current: Number(raw.current) || 0,
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : null,
    months: typeof raw.months === 'number' && raw.months > 0 ? raw.months : null,
    monthlyBudget: typeof raw.monthlyBudget === 'number' && raw.monthlyBudget > 0 ? raw.monthlyBudget : null,
    createdAt: String(raw.createdAt || nowISO()),
  };
}

export async function listGoals(): Promise<SavingsGoal[]> {
  const store = await load();
  store.goals = store.goals.map(normalizeGoal);
  return store.goals.slice().reverse();
}

export async function addGoal(input: {
  name: string;
  target: number;
  months?: number | null;
  monthlyBudget?: number | null;
  dueDate?: string | null;
}): Promise<void> {
  const store = await load();
  store.goals.push(
    normalizeGoal({
      id: nextId(store),
      name: input.name,
      target: input.target,
      current: 0,
      months: input.months ?? null,
      monthlyBudget: input.monthlyBudget ?? null,
      dueDate: input.dueDate ?? null,
      createdAt: nowISO(),
    }),
  );
  await save(store);
}

export async function updateGoal(
  id: number,
  patch: Partial<Pick<SavingsGoal, 'name' | 'target' | 'months' | 'monthlyBudget' | 'dueDate' | 'current'>>,
): Promise<void> {
  const store = await load();
  const g = store.goals.find((x) => x.id === id);
  if (!g) return;
  Object.assign(g, patch);
  store.goals = store.goals.map(normalizeGoal);
  await save(store);
}

export async function deleteGoal(id: number): Promise<void> {
  const store = await load();
  store.goals = store.goals.filter((g) => g.id !== id);
  await save(store);
}

export async function contributeGoal(id: number, amount: number): Promise<void> {
  const store = await load();
  const g = store.goals.find((x) => x.id === id);
  if (g) g.current = Math.max(0, g.current + amount);
  await save(store);
}

export async function markEveningDone(amount: number, note = ''): Promise<void> {
  const store = await load();
  const date = todayISO();
  const existing = store.eveningLogs.find((e) => e.date === date);
  if (existing) {
    existing.amount = amount;
    existing.done = 1;
    existing.note = note;
  } else {
    store.eveningLogs.push({ date, amount, done: 1, note });
  }
  await save(store);
}

export async function eveningDoneToday(): Promise<boolean> {
  const store = await load();
  return !!store.eveningLogs.find((e) => e.date === todayISO() && e.done);
}

export async function eveningStreak(): Promise<number> {
  const store = await load();
  const doneDates = new Set(store.eveningLogs.filter((e) => e.done).map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (doneDates.has(isoFromDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function exportBackup(): Promise<string> {
  const store = await load();
  return JSON.stringify({ version: 1, exportedAt: nowISO(), data: store }, null, 2);
}

export async function realPosition(): Promise<{
  liquid: number;
  savings: number;
  owedToMe: number;
  iOwePeople: number;
  iOweCredits: number;
  net: number;
}> {
  const accounts = await listAccounts();
  const debts = await listDebts();
  const credits = await listCredits();
  const goals = await listGoals();

  const liquid = accounts.reduce((s, a) => s + a.balance, 0);
  const savings = goals.reduce((s, g) => s + g.current, 0);
  const owedToMe = debts.filter((d) => d.direction === 'on_me_doit').reduce((s, d) => s + d.remaining, 0);
  const iOwePeople = debts.filter((d) => d.direction === 'je_dois').reduce((s, d) => s + d.remaining, 0);
  const iOweCredits = credits.reduce((s, c) => s + c.remaining, 0);
  const net = liquid + savings + owedToMe - iOwePeople - iOweCredits;

  return { liquid, savings, owedToMe, iOwePeople, iOweCredits, net };
}
