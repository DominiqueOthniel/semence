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

export function mascotStage(goals: SavingsGoal[]): MascotStage {
  const reached = goals.filter((g) => g.target > 0 && g.current >= g.target).length;
  if (reached >= 3) return 2;
  if (reached >= 1) return 1;
  return 0;
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

  const over = input.envelopes.filter((e) => e.budget > 0 && e.spent > e.budget);
  if (over.length > 0) {
    const names = over.map((e) => e.label).join(', ');
    return {
      id: `over:${names}`,
      mood: 'over',
      title: 'On ajuste, sans se juger',
      text:
        over.length > 1
          ? `${names} ont dépassé le cadre. Ce n’est pas un échec. Recadre les montants, et continue.`
          : `${names} a dépassé le cadre. Ce n’est pas un échec. Recadre le montant, et continue.`,
    };
  }

  const done = input.goals.find((g) => g.target > 0 && g.current >= g.target);
  if (done) {
    return {
      id: `goal:${done.id}`,
      mood: 'goal',
      title: 'Objectif atteint',
      text: `${done.name} est là. La semence pousse un peu.`,
    };
  }

  const lastMove = [...input.transactions]
    .reverse()
    .find((t) => t.type === 'revenu' || t.type === 'depense');
  if (lastMove?.type === 'revenu' && lastMove.date.slice(0, 10) === todayISO()) {
    return {
      id: `income:${lastMove.id}`,
      mood: 'income',
      title: 'Un revenu vient d’arriver',
      text: 'Répartis-le dans tes enveloppes, en montants. Le courant prendra ce qui reste.',
    };
  }

  if (input.streak >= 3 && input.eveningDone) {
    return {
      id: `progress:${input.streak}`,
      mood: 'progress',
      title: 'Tu reviens',
      text: `${input.streak} soirs d’affilée. C’est ça, la constance.`,
    };
  }

  const hour = new Date().getHours();
  if (!input.eveningDone && hour >= Math.max(0, input.settings.eveningHour - 1)) {
    return {
      id: `evening:${todayISO()}`,
      mood: 'evening',
      title: 'Rendez-vous du soir',
      text: 'Deux minutes. On note la journée, et on sème demain.',
    };
  }

  return null;
}

export const MASCOT_COPY = {
  welcome: {
    title: 'Bienvenue',
    text: 'Commençons par donner une direction à ton argent.',
  },
  income: {
    title: 'Répartir ce revenu',
    text: 'Indique les montants pour chaque enveloppe. Pas de calcul de pourcentage.',
  },
  evening: {
    title: 'On clôture la journée',
    text: 'Un petit compagnon du soir : tu notes, tu valides, tu te libères.',
  },
} as const;

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
