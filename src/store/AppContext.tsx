import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Account, Credit, Debt, FavoriteAmount, SavingsGoal, Settings, Transaction } from '../types';
import * as db from '../db/database';
import { splitIncome } from '../lib/money';
import {
  clampCycleOffset,
  cycleAtOffset,
  daysLeftInCycle,
  type Cycle,
} from '../lib/cycle';

interface AppState {
  ready: boolean;
  unlocked: boolean;
  settings: Settings | null;
  accounts: Account[];
  transactions: Transaction[];
  yearTransactions: Transaction[];
  debts: Debt[];
  credits: Credit[];
  goals: SavingsGoal[];
  favorites: FavoriteAmount[];
  position: Awaited<ReturnType<typeof db.realPosition>> | null;
  envelopes: {
    donBudget: number;
    epargneBudget: number;
    semenceBudget: number;
    courantBudget: number;
    donSpent: number;
    epargneSpent: number;
    semenceSpent: number;
    courantSpent: number;
    perDay: number;
    daysLeft: number;
    resteAVivre: number;
    cycleIncome: number;
    cycleExpense: number;
  } | null;
  eveningDone: boolean;
  streak: number;
  creditYear: { count: number; cost: number };
  cycle: Cycle;
  cycleOffset: number;
  setCycleOffset: (offset: number | ((prev: number) => number)) => void;
  shiftCycle: (delta: number) => void;
  goToCurrentCycle: () => void;
  refresh: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  setUnlocked: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

function fallbackCycle(): Cycle {
  return cycleAtOffset(1, 0);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [yearTransactions, setYearTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAmount[]>([]);
  const [position, setPosition] = useState<AppState['position']>(null);
  const [envelopes, setEnvelopes] = useState<AppState['envelopes']>(null);
  const [eveningDone, setEveningDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [creditYear, setCreditYear] = useState({ count: 0, cost: 0 });
  const [cycleOffset, setCycleOffsetState] = useState(0);
  const [cycle, setCycle] = useState<Cycle>(fallbackCycle);

  const setCycleOffset = useCallback((offset: number | ((prev: number) => number)) => {
    setCycleOffsetState((prev) => {
      const next = typeof offset === 'function' ? offset(prev) : offset;
      return clampCycleOffset(next);
    });
  }, []);

  const shiftCycle = useCallback((delta: number) => {
    setCycleOffsetState((prev) => clampCycleOffset(prev + delta));
  }, []);

  const goToCurrentCycle = useCallback(() => {
    setCycleOffsetState(0);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await db.getDb();
      const s = await db.getSettings();
      setSettings(s);

      if (!s.onboardingDone) {
        setUnlocked(true);
        return;
      }

      const viewed = cycleAtOffset(s.monthStartDay, clampCycleOffset(cycleOffset));
      setCycle(viewed);

      const [acc, txs, yearTxs, d, c, g, fav, pos, eve, str, cy, donSpent, epargneSpent, semenceSpent, courantSpent] =
        await Promise.all([
          db.listAccounts(),
          db.listTransactionsInRange(viewed.fromISO, viewed.toISO),
          db.listAllTransactions(),
          db.listDebts(),
          db.listCredits(),
          db.listGoals(),
          db.listFavorites(),
          db.realPosition(),
          db.eveningDoneToday(),
          db.eveningStreak(),
          db.creditCostYear(),
          db.envelopeSpentInRange('don', viewed.fromISO, viewed.toISO),
          db.envelopeSpentInRange('epargne', viewed.fromISO, viewed.toISO),
          db.envelopeSpentInRange('semence', viewed.fromISO, viewed.toISO),
          db.envelopeSpentInRange('courant', viewed.fromISO, viewed.toISO),
        ]);

      setAccounts(acc);
      setTransactions(txs);
      setYearTransactions(yearTxs);
      setDebts(d);
      setCredits(c);
      setGoals(g);
      setFavorites(fav);
      setPosition(pos);
      setEveningDone(eve);
      setStreak(str);
      setCreditYear(cy);

      const split = splitIncome(s.monthlyIncome, s.donRate, s.epargneRate, s.semenceRate);
      const daysLeft = daysLeftInCycle(viewed);
      const resteCourant = split.courant - courantSpent;
      const cycleIncome = txs.filter((t) => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0);
      const cycleExpense = txs.filter((t) => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0);
      const perDay =
        viewed.status === 'en_cours'
          ? Math.round(resteCourant / daysLeft)
          : Math.round(courantSpent / viewed.dayCount);

      setEnvelopes({
        donBudget: split.don,
        epargneBudget: split.epargne,
        semenceBudget: split.semence,
        courantBudget: split.courant,
        donSpent,
        epargneSpent,
        semenceSpent,
        courantSpent,
        perDay,
        daysLeft,
        resteAVivre: resteCourant,
        cycleIncome,
        cycleExpense,
      });
    } finally {
      setReady(true);
    }
  }, [cycleOffset]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 4000);

    refresh()
      .catch((e) => console.error(e))
      .finally(() => {
        cancelled = true;
        clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  const unlock = useCallback(async (pin: string) => {
    const ok = await db.verifyPin(pin);
    if (ok) setUnlocked(true);
    return ok;
  }, []);

  const value = useMemo(
    () => ({
      ready,
      unlocked,
      settings,
      accounts,
      transactions,
      yearTransactions,
      debts,
      credits,
      goals,
      favorites,
      position,
      envelopes,
      eveningDone,
      streak,
      creditYear,
      cycle,
      cycleOffset,
      setCycleOffset,
      shiftCycle,
      goToCurrentCycle,
      refresh,
      unlock,
      setUnlocked,
    }),
    [
      ready,
      unlocked,
      settings,
      accounts,
      transactions,
      yearTransactions,
      debts,
      credits,
      goals,
      favorites,
      position,
      envelopes,
      eveningDone,
      streak,
      creditYear,
      cycle,
      cycleOffset,
      setCycleOffset,
      shiftCycle,
      goToCurrentCycle,
      refresh,
      unlock,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp hors AppProvider');
  return ctx;
}
