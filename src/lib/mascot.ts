import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavingsGoal, Settings, Transaction } from '../types';
import { todayISO } from './money';

const SEEN_KEY = 'semence.mascot.seen';

export type MascotMood = 'welcome' | 'income' | 'goal' | 'over' | 'progress' | 'evening';
export type MascotStage = 0 | 1 | 2;

export type MascotCue = {
  id: string;
  mood: MascotMood;
  title: string;
  text: string;
};

export const MASCOT_COPY = {
  welcome: {
    title: 'Bienvenue',
    text: 'Commençons par donner une direction à ton argent.',
  },
  income: {
    title: 'Revenu reçu',
    text: 'Répartis-le dans tes enveloppes, en montants. Le courant prend ce qui reste.',
  },
  goal: {
    title: 'Objectif atteint',
    text: 'La semence pousse un peu. Tu as tenu le rythme.',
  },
  over: {
    title: 'On recadre, sans se juger',
    text: 'Un cadre a dépassé. Ce n’est pas un échec. Recadre le montant, et continue.',
  },
  progress: {
    title: 'Belle régularité',
    text: 'Tu reviens. C’est ça, la constance.',
  },
  evening: {
    title: 'Rendez-vous du soir',
    text: 'Ton petit compagnon du quotidien. Deux minutes : on note, on sème demain.',
  },
} as const;

export function mascotStage(goals: SavingsGoal[]): MascotStage {
  const reached = goals.filter((g) => g.target > 0 && g.current >= g.target).length;
  if (reached >= 3) return 2;
  if (reached >= 1) return 1;
  return 0;
}

export function incomeToday(transactions: Transaction[], day = todayISO()): Transaction | null {
  const last = [...transactions].reverse().find((t) => t.type === 'revenu' && t.date.slice(0, 10) === day);
  return last ?? null;
}

export function reachedGoal(goals: SavingsGoal[]): SavingsGoal | null {
  return goals.find((g) => g.target > 0 && g.current >= g.target) ?? null;
}

export function overEnvelopes(envelopes: { label: string; spent: number; budget: number }[]) {
  return envelopes.filter((e) => e.budget > 0 && e.spent > e.budget);
}

function overCue(names: string[]): MascotCue {
  const list = names.join(', ');
  return {
    id: `over:${todayISO()}:${list}`,
    mood: 'over',
    title: MASCOT_COPY.over.title,
    text:
      names.length > 1
        ? `${list} ont dépassé le cadre. Ce n’est pas un échec. Recadre les montants, et continue.`
        : `${list} a dépassé le cadre. Ce n’est pas un échec. Recadre le montant, et continue.`,
  };
}

export function pickHomeCue(input: {
  live: boolean;
  envelopes: { label: string; spent: number; budget: number }[];
  goals: SavingsGoal[];
  transactions: Transaction[];
  streak: number;
  eveningDone: boolean;
  settings: Settings;
}): MascotCue | null {
  if (!input.live) return null;

  const over = overEnvelopes(input.envelopes);
  if (over.length > 0) return overCue(over.map((e) => e.label));

  const done = reachedGoal(input.goals);
  if (done) {
    return {
      id: `goal:${done.id}`,
      mood: 'goal',
      title: MASCOT_COPY.goal.title,
      text: `${done.name} est là. La semence pousse un peu.`,
    };
  }

  const lastIncome = incomeToday(input.transactions);
  if (lastIncome) {
    return {
      id: `income:${lastIncome.id}`,
      mood: 'income',
      title: MASCOT_COPY.income.title,
      text: MASCOT_COPY.income.text,
    };
  }

  if (input.streak >= 3 && input.eveningDone) {
    return {
      id: `progress:${input.streak}`,
      mood: 'progress',
      title: MASCOT_COPY.progress.title,
      text: `${input.streak} soirs d’affilée. C’est ça, la constance.`,
    };
  }

  const hour = new Date().getHours();
  if (!input.eveningDone && hour >= Math.max(0, input.settings.eveningHour - 1)) {
    return {
      id: `evening:${todayISO()}`,
      mood: 'evening',
      title: MASCOT_COPY.evening.title,
      text: MASCOT_COPY.evening.text,
    };
  }

  if (input.transactions.length === 0) {
    return {
      id: 'welcome:home',
      mood: 'welcome',
      title: MASCOT_COPY.welcome.title,
      text: MASCOT_COPY.welcome.text,
    };
  }

  return null;
}

export async function loadMascotSeen(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function markMascotSeen(id: string): Promise<void> {
  const seen = await loadMascotSeen();
  if (seen.includes(id)) return;
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id].slice(-40)));
}
