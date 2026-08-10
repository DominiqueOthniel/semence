import type { Settings, Transaction } from '../types';
import { DON_LABELS } from '../types';

const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

function csvEscape(value: string | number) {
  const s = String(value);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Rapport mensuel simple (CSV) pour Excel / Sheets. */
export function buildMonthlyCsvReport(input: {
  settings: Settings;
  transactions: Transaction[];
  year: number;
  month: number; // 0-11
}): string {
  const { settings, transactions, year, month } = input;
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const rows = transactions
    .filter((t) => t.date.startsWith(prefix))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

  let revenus = 0;
  let depenses = 0;
  for (const t of rows) {
    if (t.type === 'revenu') revenus += t.amount;
    if (t.type === 'depense') depenses += t.amount;
  }

  const lines: string[] = [];
  lines.push('Rapport Semence');
  lines.push(`Profil;${csvEscape(settings.name)}`);
  lines.push(`Période;${csvEscape(`${MONTH_LABELS[month]} ${year}`)}`);
  lines.push(`Revenus;${revenus}`);
  lines.push(`Dépenses;${depenses}`);
  lines.push(`Solde période;${revenus - depenses}`);
  lines.push(
    `Répartition;Don ${settings.donRate}% · Épargne ${settings.epargneRate}% · Semence ${settings.semenceRate}%`,
  );
  if (settings.profil !== 'aucun') {
    lines.push(`Enveloppe don;${csvEscape(DON_LABELS[settings.profil] || 'Don')}`);
  }
  lines.push('');
  lines.push('Date;Type;Montant;Enveloppe;Libellé');
  for (const t of rows) {
    lines.push(
      [t.date.slice(0, 10), t.type, t.amount, t.envelope || '', csvEscape(t.note || '')].join(';'),
    );
  }
  lines.push('');
  lines.push(`Généré par Semence;${new Date().toISOString().slice(0, 10)}`);
  return lines.join('\n');
}

export function reportFileName(year: number, month: number) {
  return `semence-rapport-${year}-${String(month + 1).padStart(2, '0')}.csv`;
}
