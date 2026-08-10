import type { Profil } from '../types';

export type Verset = {
  text: string;
  ref: string;
};

/** Versets et paroles liés à l’argent, l’épargne, le don et la prudence. */
const CHRETIEN: Verset[] = [
  {
    text: 'Là où est ton trésor, là aussi sera ton cœur.',
    ref: 'Matthieu 6.21',
  },
  {
    text: 'Honore l’Éternel avec tes biens, et avec les prémices de tout ton revenu.',
    ref: 'Proverbes 3.9',
  },
  {
    text: 'L’homme sage amasse avec connaissance ; le fou dissipe ce qu’il a.',
    ref: 'Proverbes 21.20',
  },
  {
    text: 'La fortune hâtive diminue ; mais celui qui amasse peu à peu augmente son bien.',
    ref: 'Proverbes 13.11',
  },
  {
    text: 'Celui qui est fidèle dans les petites choses l’est aussi dans les grandes.',
    ref: 'Luc 16.10',
  },
  {
    text: 'Le riche domine sur les pauvres, et celui qui emprunte est esclave de celui qui prête.',
    ref: 'Proverbes 22.7',
  },
  {
    text: 'Que chacun donne comme il l’a résolu en son cœur, non avec tristesse ni par contrainte.',
    ref: '2 Corinthiens 9.7',
  },
  {
    text: 'Mieux vaut peu avec la justice, que de grands revenus avec l’injustice.',
    ref: 'Proverbes 16.8',
  },
  {
    text: 'Celui qui aime l’argent n’en est jamais rassasié.',
    ref: 'Ecclésiaste 5.10',
  },
  {
    text: 'Prépare dehors ton ouvrage, et tiens-toi prêt aux champs ; puis bâtiras-tu ta maison.',
    ref: 'Proverbes 24.27',
  },
];

const MUSULMAN: Verset[] = [
  {
    text: 'Ceux qui dépensent leurs biens dans le sentier d’Allah sont comme un grain qui produit sept épis.',
    ref: 'Coran 2.261',
  },
  {
    text: 'Ne prodigue pas avec gaspillages. Les gaspilleurs sont les frères des diables.',
    ref: 'Coran 17.26-27',
  },
  {
    text: 'Que celui qui a de larges moyens dépense selon ses moyens ; et que celui dont les biens sont mesurés dépense selon ce qu’Allah lui a accordé.',
    ref: 'Coran 65.7',
  },
  {
    text: 'Allah anéantit l’intérêt usuraire et fait fructifier les aumônes.',
    ref: 'Coran 2.276',
  },
  {
    text: 'Donnez de ce que vous aimez. Vous n’atteindrez la vraie piété qu’en donnant.',
    ref: 'Coran 3.92',
  },
  {
    text: 'La main d’en haut vaut mieux que la main d’en bas. Commence par ceux dont tu as la charge.',
    ref: 'Hadith · Bukhari',
  },
];

const SOLIDARITE: Verset[] = [
  {
    text: 'Seul on va plus vite ; ensemble on va plus loin. L’épargne partagée protège demain.',
    ref: 'Sagesse communautaire',
  },
  {
    text: 'Ce que tu gardes pour toi seul s’use ; ce que tu mets en commun fructifie.',
    ref: 'Parole de tontine',
  },
  {
    text: 'Donner d’abord, vivre ensuite : l’ordre des enveloppes commence par autrui.',
    ref: 'Semence',
  },
  {
    text: 'Un franc mis de côté aujourd’hui épargne une dette demain.',
    ref: 'Sagesse populaire',
  },
];

const NEUTRE: Verset[] = [
  {
    text: 'Semer avant de dépenser. Quatre enveloppes, un ordre fixe.',
    ref: 'Semence',
  },
  {
    text: 'Note chaque sortie. Ce qui n’est pas écrit disparaît dans le brouillard.',
    ref: 'Semence',
  },
  {
    text: 'L’épargne d’abord, le courant ensuite. Ton futur te remerciera.',
    ref: 'Semence',
  },
  {
    text: 'Mesure le vrai coût du crédit avant d’emprunter.',
    ref: 'Semence',
  },
];

const BY_PROFIL: Record<Profil, Verset[]> = {
  chretien: CHRETIEN,
  musulman: MUSULMAN,
  solidarite: SOLIDARITE,
  aucun: NEUTRE,
};

function dayIndex(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Verset du jour, lié aux finances, selon le profil. */
export function versetDuJour(profil: Profil, now = new Date()): Verset {
  const pool = BY_PROFIL[profil] || NEUTRE;
  return pool[dayIndex(now) % pool.length];
}

/** Libellé d’eyebrow selon le profil. */
export function versetEyebrow(profil: Profil): string {
  if (profil === 'chretien') return 'Parole du jour';
  if (profil === 'musulman') return 'Rappel du jour';
  if (profil === 'solidarite') return 'Mot du jour';
  return 'Pensée du jour';
}
