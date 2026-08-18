import type { Settings, Transaction } from '../types';
import { DON_LABELS } from '../types';
import { fcfa, splitIncome } from './money';

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

const TX_LABELS: Record<Transaction['type'], string> = {
  revenu: 'Revenu',
  depense: 'Dépense',
  transfert: 'Transfert',
  enveloppe: 'Enveloppe',
};

export type MonthlyReport = {
  settings: Settings;
  year: number;
  month: number;
  periodLabel: string;
  rows: Transaction[];
  revenus: number;
  depenses: number;
  solde: number;
  split: ReturnType<typeof splitIncome>;
  donLabel: string;
};

function csvEscape(value: string | number) {
  const s = String(value);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function htmlEscape(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMonthlyReport(input: {
  settings: Settings;
  transactions: Transaction[];
  year: number;
  month: number;
}): MonthlyReport {
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

  return {
    settings,
    year,
    month,
    periodLabel: `${MONTH_LABELS[month]} ${year}`,
    rows,
    revenus,
    depenses,
    solde: revenus - depenses,
    split: splitIncome(
      settings.monthlyIncome,
      settings.donRate,
      settings.epargneRate,
      settings.semenceRate,
      settings.currency,
    ),
    donLabel: DON_LABELS[settings.profil] || 'Don',
  };
}

/** Rapport mensuel simple (CSV) pour Excel / Sheets. */
export function buildMonthlyCsvReport(input: {
  settings: Settings;
  transactions: Transaction[];
  year: number;
  month: number;
}): string {
  const report = buildMonthlyReport(input);
  const { settings, split } = report;
  const currency = settings.currency || 'XAF';
  const lines: string[] = [];
  lines.push('Rapport Semence');
  lines.push(`Profil;${csvEscape(settings.name)}`);
  lines.push(`Devise;${csvEscape(currency)}`);
  lines.push(`Période;${csvEscape(report.periodLabel)}`);
  lines.push(`Revenus;${report.revenus}`);
  lines.push(`Dépenses;${report.depenses}`);
  lines.push(`Solde période;${report.solde}`);
  lines.push(
    `Répartition;Don ${split.don} · Épargne ${split.epargne} · Semence ${split.semence} · Courant ${split.courant}`,
  );
  if (settings.profil !== 'aucun') {
    lines.push(`Enveloppe don;${csvEscape(report.donLabel)}`);
  }
  lines.push('');
  lines.push('Date;Type;Montant;Enveloppe;Libellé');
  for (const t of report.rows) {
    lines.push(
      [t.date.slice(0, 10), t.type, t.amount, t.envelope || '', csvEscape(t.note || '')].join(';'),
    );
  }
  lines.push('');
  lines.push(`Généré par Semence;${new Date().toISOString().slice(0, 10)}`);
  return lines.join('\n');
}

/** HTML imprimé en PDF via expo-print. */
export function buildMonthlyPdfHtml(input: {
  settings: Settings;
  transactions: Transaction[];
  year: number;
  month: number;
}): string {
  const report = buildMonthlyReport(input);
  const money = (n: number) => htmlEscape(fcfa(n, report.settings.currency));
  const donRow =
    report.settings.profil !== 'aucun'
      ? `<tr><td>${htmlEscape(report.donLabel)}</td><td class="num">${money(report.split.don)}</td></tr>`
      : '';

  const ops =
    report.rows.length === 0
      ? '<tr><td colspan="4">Aucune opération ce mois.</td></tr>'
      : report.rows
          .map((t) => {
            const sign = t.type === 'revenu' ? '+' : t.type === 'depense' ? '−' : '';
            return `<tr>
              <td>${htmlEscape(t.date.slice(0, 10))}</td>
              <td>${htmlEscape(TX_LABELS[t.type])}</td>
              <td class="num">${sign}${money(t.amount)}</td>
              <td>${htmlEscape(t.note || t.envelope || '')}</td>
            </tr>`;
          })
          .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rapport Semence ${htmlEscape(report.periodLabel)}</title>
  <style>
    @page { margin: 36px; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #15201C;
      background: #FFFEFA;
      margin: 0;
      padding: 8px 4px;
    }
    h1 {
      font-size: 22px;
      font-weight: normal;
      letter-spacing: -0.3px;
      margin: 0 0 4px;
    }
    .kicker {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #B88228;
      margin-bottom: 18px;
    }
    .meta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #45554D;
      margin-bottom: 18px;
    }
    .cards { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    .cards td {
      width: 33%;
      background: #F3F6F1;
      border: 1px solid #E2E8E1;
      padding: 10px 12px;
    }
    .label {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #74847B;
    }
    .value { font-size: 15px; margin-top: 4px; }
    table.data { width: 100%; border-collapse: collapse; font-size: 12px; }
    table.data th {
      font-family: Helvetica, Arial, sans-serif;
      text-align: left;
      font-size: 10px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #74847B;
      border-bottom: 1px solid #C5D2C4;
      padding: 6px 4px;
    }
    table.data td {
      border-bottom: 1px solid #E2E8E1;
      padding: 7px 4px;
      vertical-align: top;
    }
    .num { text-align: right; font-family: "Courier New", monospace; white-space: nowrap; }
    h2 {
      font-size: 14px;
      margin: 20px 0 8px;
      color: #2A6349;
    }
    .foot {
      margin-top: 22px;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      color: #74847B;
    }
  </style>
</head>
<body>
  <div class="kicker">Semence</div>
  <h1>Rapport ${htmlEscape(report.periodLabel)}</h1>
  <div class="meta">
    ${htmlEscape(report.settings.name || 'Profil')}
    · ${htmlEscape(report.settings.currency || 'XAF')}
  </div>
  <table class="cards">
    <tr>
      <td><div class="label">Revenus</div><div class="value">${money(report.revenus)}</div></td>
      <td><div class="label">Dépenses</div><div class="value">${money(report.depenses)}</div></td>
      <td><div class="label">Solde</div><div class="value">${money(report.solde)}</div></td>
    </tr>
  </table>
  <h2>Enveloppes du mois</h2>
  <table class="data">
    <tr><th>Enveloppe</th><th class="num">Montant prévu</th></tr>
    ${donRow}
    <tr><td>Épargne</td><td class="num">${money(report.split.epargne)}</td></tr>
    <tr><td>Semence</td><td class="num">${money(report.split.semence)}</td></tr>
    <tr><td>Courant, reste à vivre</td><td class="num">${money(report.split.courant)}</td></tr>
  </table>
  <h2>Opérations</h2>
  <table class="data">
    <tr>
      <th>Date</th>
      <th>Type</th>
      <th class="num">Montant</th>
      <th>Libellé</th>
    </tr>
    ${ops}
  </table>
  <div class="foot">Généré par Semence · hors ligne · ${htmlEscape(new Date().toISOString().slice(0, 10))}</div>
</body>
</html>`;
}

export function reportFileName(year: number, month: number, ext: 'csv' | 'pdf' = 'csv') {
  return `semence-rapport-${year}-${String(month + 1).padStart(2, '0')}.${ext}`;
}
