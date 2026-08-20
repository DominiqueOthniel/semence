import type { Account, Credit, Debt, EnvelopeKind, SavingsGoal, Settings, Transaction } from '../types';
import { ACCOUNT_TYPE_LABELS, DON_LABELS } from '../types';
import type { Cycle } from './cycle';
import { inCycle } from './cycle';
import { formatClock } from './clock';
import { fcfa, splitIncome } from './money';

const TX_LABELS: Record<Transaction['type'], string> = {
  revenu: 'Revenu',
  depense: 'Dépense',
  transfert: 'Transfert',
  enveloppe: 'Enveloppe',
};

const ENVELOPE_ORDER: EnvelopeKind[] = ['don', 'epargne', 'semence', 'courant'];

export type EnvelopeLine = {
  key: EnvelopeKind;
  label: string;
  budget: number;
  spent: number;
  rest: number;
};

export type Statements = {
  generatedStamp: string;
  profileName: string;
  currency: string;
  cycle: Cycle;
  donLabel: string;
  revenus: number;
  depenses: number;
  solde: number;
  envelopes: EnvelopeLine[];
  accounts: Account[];
  liquid: number;
  savings: number;
  owedToMe: number;
  iOwePeople: number;
  iOweCredits: number;
  net: number;
  debts: Debt[];
  credits: Credit[];
  goals: SavingsGoal[];
  rows: Transaction[];
};

export type StatementsInput = {
  settings: Settings;
  transactions: Transaction[];
  accounts: Account[];
  debts: Debt[];
  credits: Credit[];
  goals: SavingsGoal[];
  cycle: Cycle;
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

function formatDay(iso: string) {
  const day = iso.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return day;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function envelopeLabel(kind: EnvelopeKind, donLabel: string) {
  if (kind === 'don') return donLabel || 'Don';
  if (kind === 'epargne') return 'Épargne';
  if (kind === 'semence') return 'Semence';
  return 'Courant';
}

export function buildStatements(input: StatementsInput): Statements {
  const { settings, transactions, accounts, debts, credits, goals, cycle } = input;
  const donLabel = DON_LABELS[settings.profil] || 'Don';
  const split = splitIncome(
    settings.monthlyIncome,
    settings.donRate,
    settings.epargneRate,
    settings.semenceRate,
    settings.currency,
  );
  const rows = transactions
    .filter((t) => inCycle(t.date, cycle))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

  let revenus = 0;
  let depenses = 0;
  const spent: Record<EnvelopeKind, number> = { don: 0, epargne: 0, semence: 0, courant: 0 };
  for (const t of rows) {
    if (t.type === 'revenu') revenus += t.amount;
    if (t.type === 'depense') {
      depenses += t.amount;
      const key = t.envelope && spent[t.envelope] != null ? t.envelope : 'courant';
      spent[key] += t.amount;
    }
  }

  const envelopes: EnvelopeLine[] = ENVELOPE_ORDER.filter((key) => key !== 'don' || settings.profil !== 'aucun').map(
    (key) => {
      const budget = split[key];
      return {
        key,
        label: envelopeLabel(key, donLabel),
        budget,
        spent: spent[key],
        rest: budget - spent[key],
      };
    },
  );

  const liveAccounts = accounts.filter((a) => !a.archived);
  const liquid = liveAccounts.reduce((s, a) => s + a.balance, 0);
  const savings = goals.reduce((s, g) => s + g.current, 0);
  const owedToMe = debts.filter((d) => d.direction === 'on_me_doit').reduce((s, d) => s + d.remaining, 0);
  const iOwePeople = debts.filter((d) => d.direction === 'je_dois').reduce((s, d) => s + d.remaining, 0);
  const iOweCredits = credits.reduce((s, c) => s + c.remaining, 0);

  return {
    generatedStamp: formatClock().stamp,
    profileName: settings.name || 'Profil',
    currency: settings.currency || 'XAF',
    cycle,
    donLabel,
    revenus,
    depenses,
    solde: revenus - depenses,
    envelopes,
    accounts: liveAccounts,
    liquid,
    savings,
    owedToMe,
    iOwePeople,
    iOweCredits,
    net: liquid + savings + owedToMe - iOwePeople - iOweCredits,
    debts,
    credits,
    goals,
    rows,
  };
}

function moneyCell(n: number, currency: string) {
  return htmlEscape(fcfa(n, currency));
}

function synthesisLine(s: Statements): string {
  const money = (n: number) => fcfa(n, s.currency);
  const courant = s.envelopes.find((e) => e.key === 'courant');
  const over = s.envelopes.filter((e) => e.rest < 0);

  if (s.revenus === 0 && s.depenses === 0) {
    return `Aucune opération sur ce cycle. Trésorerie disponible : ${money(s.liquid)}.`;
  }

  const bits = [`Tu as reçu ${money(s.revenus)} et dépensé ${money(s.depenses)}.`];
  if (s.solde >= 0) bits.push(`Il reste ${money(s.solde)} sur la période.`);
  else bits.push(`La période est en retrait de ${money(Math.abs(s.solde))}.`);

  if (courant) {
    if (courant.rest >= 0) bits.push(`Reste à vivre (courant) : ${money(courant.rest)}.`);
    else bits.push(`Le courant a dépassé de ${money(Math.abs(courant.rest))}.`);
  }

  if (over.length > 0) {
    bits.push(`À recadrer, sans se juger : ${over.map((e) => e.label).join(', ')}.`);
  }

  return bits.join(' ');
}

function barPct(spent: number, budget: number) {
  if (budget <= 0) return spent > 0 ? 100 : 0;
  return Math.min(100, Math.round((spent / budget) * 100));
}

/** Journal CSV du cycle, pour Excel / Sheets. */
export function buildMonthlyCsvReport(input: StatementsInput): string {
  const s = buildStatements(input);
  const lines: string[] = [];
  lines.push('Journal Semence');
  lines.push(`Profil;${csvEscape(s.profileName)}`);
  lines.push(`Devise;${csvEscape(s.currency)}`);
  lines.push(`Cycle;${csvEscape(s.cycle.label)}`);
  lines.push(`Période;${csvEscape(s.cycle.rangeLabel)}`);
  lines.push(`Statut;${csvEscape(s.cycle.statusLabel)}`);
  lines.push(`Revenus;${s.revenus}`);
  lines.push(`Dépenses;${s.depenses}`);
  lines.push(`Résultat;${s.solde}`);
  lines.push(`Trésorerie;${s.liquid}`);
  lines.push(`Situation nette;${s.net}`);
  lines.push('');
  lines.push('Enveloppe;Prévu;Dépensé;Reste');
  for (const e of s.envelopes) {
    lines.push([csvEscape(e.label), e.budget, e.spent, e.rest].join(';'));
  }
  lines.push('');
  lines.push('Compte;Type;Solde');
  if (s.accounts.length === 0) {
    lines.push('Néant;;');
  } else {
    for (const a of s.accounts) {
      lines.push([csvEscape(a.name), csvEscape(ACCOUNT_TYPE_LABELS[a.type]), a.balance].join(';'));
    }
  }
  lines.push('');
  lines.push('Date;Type;Montant;Enveloppe;Libellé');
  if (s.rows.length === 0) {
    lines.push('Néant;;;;');
  } else {
    for (const t of s.rows) {
      lines.push(
        [formatDay(t.date), TX_LABELS[t.type], t.amount, t.envelope || '', csvEscape(t.note || '')].join(';'),
      );
    }
  }
  lines.push('');
  lines.push(`Généré par Semence;${csvEscape(s.generatedStamp)}`);
  return lines.join('\n');
}

/** Synthèse HTML d’une page, facile à lire. Le journal détaillé reste au CSV. */
export function buildMonthlyPdfHtml(input: StatementsInput): string {
  const s = buildStatements(input);
  const money = (n: number) => moneyCell(n, s.currency);
  const story = htmlEscape(synthesisLine(s));

  const envelopeBlocks = s.envelopes
    .map((e) => {
      const pct = barPct(e.spent, e.budget);
      const over = e.rest < 0;
      return `<div class="env">
        <div class="envTop">
          <span class="envName">${htmlEscape(e.label)}</span>
          <span class="envRest ${over ? 'warn' : ''}">${over ? 'Dépassé de ' : 'Reste '}${money(Math.abs(e.rest))}</span>
        </div>
        <div class="bar"><div class="fill ${over ? 'fillOver' : ''}" style="width:${pct}%"></div></div>
        <div class="envMeta">Prévu ${money(e.budget)} · utilisé ${money(e.spent)}</div>
      </div>`;
    })
    .join('');

  const accountLines =
    s.accounts.length === 0
      ? '<p class="mute">Aucun compte actif.</p>'
      : `<ul class="plain">${s.accounts
          .map(
            (a) =>
              `<li><span>${htmlEscape(a.name)}</span><strong>${money(a.balance)}</strong></li>`,
          )
          .join('')}<li class="total"><span>Disponible</span><strong>${money(s.liquid)}</strong></li></ul>`;

  const topSpends = s.rows
    .filter((t) => t.type === 'depense')
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const spendBlock =
    topSpends.length === 0
      ? ''
      : `<h2>Où est allé l’argent</h2>
         <ul class="plain">${topSpends
           .map((t) => {
             const label = t.note || (t.envelope ? envelopeLabel(t.envelope, s.donLabel) : 'Dépense');
             return `<li><span>${htmlEscape(formatDay(t.date))} · ${htmlEscape(label)}</span><strong>${money(t.amount)}</strong></li>`;
           })
           .join('')}</ul>`;

  const watchItems: string[] = [];
  for (const d of s.debts.filter((x) => x.remaining > 0)) {
    const sens = d.direction === 'je_dois' ? `Tu dois à ${d.person}` : `${d.person} te doit`;
    watchItems.push(
      `<li><span>${htmlEscape(sens)}</span><strong>${money(d.remaining)}</strong></li>`,
    );
  }
  for (const c of s.credits.filter((x) => x.remaining > 0)) {
    watchItems.push(
      `<li><span>Crédit · ${htmlEscape(c.label)}</span><strong>${money(c.remaining)}</strong></li>`,
    );
  }
  const watchBlock =
    watchItems.length === 0
      ? ''
      : `<h2>À surveiller</h2><ul class="plain">${watchItems.join('')}</ul>`;

  const goalItems = s.goals.filter((g) => g.target > 0);
  const goalBlock =
    goalItems.length === 0
      ? ''
      : `<h2>Objectifs</h2><ul class="plain">${goalItems
          .map((g) => {
            const pct = Math.round((g.current / g.target) * 100);
            return `<li><span>${htmlEscape(g.name)} · ${pct} %</span><strong>${money(g.current)} / ${money(g.target)}</strong></li>`;
          })
          .join('')}</ul>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
  <title>Synthèse Semence · ${htmlEscape(s.cycle.label)}</title>
  <style>
    @page { size: A4; margin: 16mm 16mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #15201C;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 14px;
      line-height: 1.45;
    }
    .kicker {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: #B88228;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 26px;
      font-weight: normal;
      margin: 0 0 6px;
    }
    .meta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #45554D;
      margin-bottom: 18px;
    }
    .story {
      font-size: 16px;
      line-height: 1.55;
      margin: 0 0 22px;
      padding: 14px 16px;
      background: #F7F8F5;
      border-left: 3px solid #B88228;
    }
    .kpis { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .kpis td {
      width: 33.33%;
      padding: 12px 14px;
      background: #FFFEFA;
      border: 1px solid #E2E8E1;
      vertical-align: top;
    }
    .label {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #74847B;
    }
    .value { font-size: 20px; margin-top: 4px; }
    h2 {
      font-size: 15px;
      font-weight: normal;
      color: #163529;
      margin: 22px 0 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #C5D2C4;
    }
    .env { margin-bottom: 12px; }
    .envTop { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .envName { font-family: Helvetica, Arial, sans-serif; font-size: 13px; }
    .envRest { font-family: Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; }
    .warn { color: #B5453A; }
    .bar {
      height: 8px;
      background: #E2E8E1;
      border-radius: 99px;
      overflow: hidden;
    }
    .fill { height: 8px; background: #2A6349; }
    .fillOver { background: #B5453A; }
    .envMeta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #74847B;
      margin-top: 4px;
    }
    ul.plain { list-style: none; margin: 0; padding: 0; }
    ul.plain li {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 7px 0;
      border-bottom: 1px solid #E2E8E1;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 13px;
    }
    ul.plain li.total { font-weight: bold; border-bottom: none; padding-top: 10px; }
    .mute { color: #74847B; font-style: italic; }
    .situation {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #45554D;
      margin-top: 8px;
    }
    .foot {
      margin-top: 28px;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      color: #74847B;
      border-top: 1px solid #C5D2C4;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="kicker">Semence · Synthèse</div>
  <h1>${htmlEscape(s.cycle.label)}</h1>
  <div class="meta">${htmlEscape(s.profileName)} · ${htmlEscape(s.cycle.rangeLabel)} · ${htmlEscape(s.cycle.statusLabel)}</div>

  <p class="story">${story}</p>

  <table class="kpis">
    <tr>
      <td><div class="label">Revenus</div><div class="value">${money(s.revenus)}</div></td>
      <td><div class="label">Dépenses</div><div class="value">${money(s.depenses)}</div></td>
      <td><div class="label">Résultat</div><div class="value">${money(s.solde)}</div></td>
    </tr>
  </table>

  <h2>Tes enveloppes</h2>
  ${envelopeBlocks}

  <h2>Où est ton argent</h2>
  ${accountLines}
  <p class="situation">Objectifs mis de côté ${money(s.savings)} · situation nette ${money(s.net)}</p>

  ${spendBlock}
  ${watchBlock}
  ${goalBlock}

  <div class="foot">
    Synthèse générée par Semence le ${htmlEscape(s.generatedStamp)}. Le détail des opérations est dans l’export CSV.
  </div>
</body>
</html>`;
}

export function reportFileName(cycleKey: string, ext: 'csv' | 'pdf' = 'csv') {
  const safe = cycleKey.replace(/[^\d-]/g, '') || 'cycle';
  const kind = ext === 'pdf' ? 'synthese' : 'journal';
  return `semence-${kind}-${safe}.${ext}`;
}
