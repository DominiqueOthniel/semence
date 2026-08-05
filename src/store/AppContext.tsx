import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Account, Credit, Debt, FavoriteAmount, SavingsGoal, Settings, Transaction } from '../types';
import * as db from '../db/database';
import { daysLeftInBudgetMonth, splitIncome } from '../lib/money';

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
  } | null;
  eveningDone: boolean;
  streak: number;
  creditYear: { count: number; cost: number };
  refresh: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  setUnlocked: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

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

  const refresh = useCallback(async () => {
    try {
      await db.getDb();
      const s = await db.getSettings();
      setSettings(s);

      if (!s.onboardingDone) {
        setUnlocked(true);
        return;
      }

      const [acc, txs, yearTxs, d, c, g, fav, pos, eve, str, cy] = await Promise.all([
        db.listAccounts(),
        db.listTransactions(40),
        db.listAllTransactions(),
        db.listDebts(),
        db.listCredits(),
        db.listGoals(),
        db.listFavorites(),
        db.realPosition(),
        db.eveningDoneToday(),
        db.eveningStreak(),
        db.creditCostYear(),
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
      const daysLeft = daysLeftInBudgetMonth(s.monthStartDay);
      const [donSpent, epargneSpent, semenceSpent, courantSpent] = await Promise.all([
        db.envelopeSpent('don', s.monthStartDay),
        db.envelopeSpent('epargne', s.monthStartDay),
        db.envelopeSpent('semence', s.monthStartDay),
        db.spentCourantThisMonth(s.monthStartDay),
      ]);
      const resteCourant = split.courant - courantSpent;
      setEnvelopes({
        donBudget: split.don,
        epargneBudget: split.epargne,
        semenceBudget: split.semence,
        courantBudget: split.courant,
        donSpent,
        epargneSpent,
        semenceSpent,
        courantSpent,
        perDay: Math.round(resteCourant / daysLeft),
        daysLeft,
        resteAVivre: resteCourant,
      });
    } finally {
      setReady(true);
    }
  }, []);

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
