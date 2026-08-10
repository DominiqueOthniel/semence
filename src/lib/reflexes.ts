export type Reflexe = {
  n: string;
  title: string;
  body: string;
};

/** Les 10 réflexes, adaptés à Semence (même esprit que le poster du pack). */
export const REFLEXES: Reflexe[] = [
  {
    n: '01',
    title: 'Je note chaque dépense',
    body: 'Je ne gère plus dans ma tête. Tout passe par Semence : saisie rapide ou rendez-vous du soir.',
  },
  {
    n: '02',
    title: 'J’épargne en premier',
    body: 'Dès que le salaire arrive, j’alimente l’enveloppe Épargne avant de toucher au courant.',
  },
  {
    n: '03',
    title: 'Je construis mon budget chaque mois',
    body: 'Je fixe mes revenus, mes enveloppes et mon début de mois. Le reste suit cet ordre.',
  },
  {
    n: '04',
    title: 'Je distingue besoin et envie',
    body: 'Avant un achat non planifié, je me demande : est-ce vraiment nécessaire aujourd’hui ?',
  },
  {
    n: '05',
    title: 'Je consulte mon tableau de bord chaque semaine',
    body: 'Vingt-cinq minutes par semaine suffisent pour rester en contrôle : courbes, enveloppes, alertes.',
  },
  {
    n: '06',
    title: 'Je donne un objectif à mon épargne',
    body: 'Chaque franc mis de côté a une destination : scolarité, fond d’urgence, projet nommé.',
  },
  {
    n: '07',
    title: 'Je respecte l’ordre des enveloppes',
    body: 'Don, épargne, semence, puis courant. Je ne pioche pas dans l’épargne pour une envie.',
  },
  {
    n: '08',
    title: 'Je fais mon rendez-vous du soir',
    body: 'Chaque soir, je note ce qui est sorti. Une habitude courte, un mois plus clair.',
  },
  {
    n: '09',
    title: 'Je mesure le vrai coût du crédit',
    body: 'Avant d’emprunter, je regarde le surcoût. Semence me rappelle ce que le crédit m’a déjà coûté.',
  },
  {
    n: '10',
    title: 'Je suis mon reste à vivre',
    body: 'Chaque jour, je sais ce que je peux dépenser. Si le rythme casse, j’ajuste tout de suite.',
  },
];
