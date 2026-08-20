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
        <table class="line"><tr>
          <td class="name">${htmlEscape(e.label)}</td>
          <td class="amt ${over ? 'warn' : ''}">${over ? 'Dépassé ' : 'Reste '}${money(Math.abs(e.rest))}</td>
        </tr></table>
        <div class="bar"><div class="fill ${over ? 'over' : ''}" style="width:${pct}%"></div></div>
        <div class="hint">Prévu ${money(e.budget)} · utilisé ${money(e.spent)}</div>
      </div>`;
    })
    .join('');

  const accountRows =
    s.accounts.length === 0
      ? '<tr><td class="mute" colspan="2">Aucun compte actif.</td></tr>'
      : s.accounts
          .map(
            (a) =>
              `<tr><td>${htmlEscape(a.name)}</td><td class="amt">${money(a.balance)}</td></tr>`,
          )
          .join('');

  const topSpends = s.rows
    .filter((t) => t.type === 'depense')
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const spendRows = topSpends
    .map((t, i) => {
      const label = t.note || (t.envelope ? envelopeLabel(t.envelope, s.donLabel) : 'Dépense');
      return `<tr>
        <td class="idx">${String(i + 1).padStart(2, '0')}</td>
        <td>${htmlEscape(label)}<div class="hint">${htmlEscape(formatDay(t.date))}</div></td>
        <td class="amt">${money(t.amount)}</td>
      </tr>`;
    })
    .join('');

  const watchRows = [
    ...s.debts
      .filter((x) => x.remaining > 0)
      .map((d) => {
        const label = d.direction === 'je_dois' ? `Tu dois à ${d.person}` : `${d.person} te doit`;
        return `<tr><td>${htmlEscape(label)}</td><td class="amt">${money(d.remaining)}</td></tr>`;
      }),
    ...s.credits
      .filter((x) => x.remaining > 0)
      .map(
        (c) =>
          `<tr><td>Crédit · ${htmlEscape(c.label)}</td><td class="amt">${money(c.remaining)}</td></tr>`,
      ),
  ].join('');

  const goalRows = s.goals
    .filter((g) => g.target > 0)
    .map((g) => {
      const pct = Math.round((g.current / g.target) * 100);
      return `<tr>
        <td>${htmlEscape(g.name)}<div class="hint">${pct} %</div></td>
        <td class="amt">${money(g.current)} / ${money(g.target)}</td>
      </tr>`;
    })
    .join('');

  const soldeTone = s.solde >= 0 ? 'ok' : 'warn';
  const lowerLeft = watchRows
    ? `<div class="sec"><div class="secHead"><span>04</span> À surveiller</div><table class="list">${watchRows}</table></div>`
    : '';
  const lowerRight = goalRows
    ? `<div class="sec"><div class="secHead"><span>05</span> Objectifs</div><table class="list">${goalRows}</table></div>`
    : '';
  const lower =
    lowerLeft || lowerRight
      ? `<table class="split"><tr>
          <td class="pane">${lowerLeft || '&nbsp;'}</td>
          <td class="gap"></td>
          <td class="pane">${lowerRight || '&nbsp;'}</td>
        </tr></table>`
      : '';
  const spendBlock = spendRows
    ? `<div class="sec">
        <div class="secHead"><span>03</span> Où est allé l’argent</div>
        <table class="list spend">${spendRows}</table>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Synthèse Semence · ${htmlEscape(s.cycle.label)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #F1EEE6;
      color: #15201C;
    }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12.5px;
      line-height: 1.4;
    }
    .sheet {
      background: #FFFEFA;
      border: 1px solid #C5D2C4;
    }
    header {
      background: #163529;
      color: #FFFEFA;
      padding: 22px 24px 20px;
    }
    .brand {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 9px;
      letter-spacing: 2.2px;
      text-transform: uppercase;
      color: #C9922C;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 28px;
      font-weight: normal;
      margin: 0 0 8px;
      letter-spacing: -0.4px;
    }
    .meta {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.74);
    }
    .gold {
      height: 2px;
      background: #B88228;
    }
    .pad { padding: 20px 24px 18px; }
    .story {
      margin: 0 0 18px;
      padding: 14px 16px;
      background: #F7EEDC;
      border-left: 3px solid #B88228;
      font-size: 14.5px;
      line-height: 1.55;
      font-style: italic;
      color: #163529;
    }
    .kpis { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin: 0 -10px 18px; }
    .kpis td {
      width: 33.33%;
      background: #F3F6F1;
      border: 1px solid #E2E8E1;
      padding: 12px 14px;
      vertical-align: top;
    }
    .label {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 9px;
      letter-spacing: 1.1px;
      text-transform: uppercase;
      color: #74847B;
    }
    .value {
      font-size: 18px;
      margin-top: 5px;
      color: #15201C;
    }
    .value.ok { color: #2A6349; }
    .value.warn { color: #B5453A; }
    .split { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    .split .pane { width: 48.5%; vertical-align: top; }
    .split .gap { width: 3%; }
    .sec { margin-bottom: 4px; }
    .secHead {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 11px;
      letter-spacing: 0.4px;
      color: #163529;
      border-bottom: 1px solid #C5D2C4;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .secHead span {
      color: #B88228;
      letter-spacing: 1.4px;
      font-size: 9px;
      margin-right: 8px;
    }
    .env { margin-bottom: 14px; }
    .line { width: 100%; border-collapse: collapse; }
    .name { font-family: Helvetica, Arial, sans-serif; font-size: 12.5px; color: #15201C; }
    .amt {
      font-family: Helvetica, Arial, sans-serif;
      text-align: right;
      white-space: nowrap;
      font-size: 12.5px;
      font-weight: bold;
    }
    .warn { color: #B5453A; }
    .bar {
      height: 6px;
      background: #E2E8E1;
      margin: 5px 0 4px;
    }
    .fill { height: 6px; background: #2A6349; }
    .fill.over { background: #B5453A; }
    .hint {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      color: #74847B;
      margin-top: 2px;
    }
    table.list { width: 100%; border-collapse: collapse; }
    table.list td {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 12.5px;
      padding: 7px 0;
      border-bottom: 1px solid #E2E8E1;
      vertical-align: top;
    }
    table.list .idx {
      width: 28px;
      color: #B88228;
      font-size: 10px;
      letter-spacing: 1px;
    }
    table.list tr:last-child td { border-bottom: none; }
    .net {
      margin-top: 12px;
      padding: 10px 12px;
      background: #163529;
      color: #FFFEFA;
      font-family: Helvetica, Arial, sans-serif;
    }
    .net .label { color: #C9922C; }
    .net .value { color: #FFFEFA; font-size: 16px; }
    .net .hint { color: rgba(255,255,255,0.65); margin-top: 6px; }
    footer {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid #C5D2C4;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 9.5px;
      color: #74847B;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header>
      <div class="brand">Semence · Synthèse</div>
      <h1>${htmlEscape(s.cycle.label)}</h1>
      <div class="meta">${htmlEscape(s.profileName)} · ${htmlEscape(s.cycle.rangeLabel)} · ${htmlEscape(s.cycle.statusLabel)}</div>
    </header>
    <div class="gold"></div>
    <div class="pad">
      <p class="story">${story}</p>

      <table class="kpis">
        <tr>
          <td><div class="label">Revenus</div><div class="value">${money(s.revenus)}</div></td>
          <td><div class="label">Dépenses</div><div class="value">${money(s.depenses)}</div></td>
          <td><div class="label">Résultat</div><div class="value ${soldeTone}">${money(s.solde)}</div></td>
        </tr>
      </table>

      <table class="split">
        <tr>
          <td class="pane">
            <div class="sec">
              <div class="secHead"><span>01</span> Tes enveloppes</div>
              ${envelopeBlocks}
            </div>
          </td>
          <td class="gap"></td>
          <td class="pane">
            <div class="sec">
              <div class="secHead"><span>02</span> Où est ton argent</div>
              <table class="list">
                ${accountRows}
                <tr><td>Disponible</td><td class="amt">${money(s.liquid)}</td></tr>
              </table>
              <div class="net">
                <div class="label">Situation nette</div>
                <div class="value">${money(s.net)}</div>
                <div class="hint">Objectifs mis de côté ${money(s.savings)}</div>
              </div>
            </div>
          </td>
        </tr>
      </table>

      ${spendBlock}
      ${lower}

      <footer>
        Générée par Semence le ${htmlEscape(s.generatedStamp)}. Le détail des opérations est dans l’export CSV.
      </footer>
    </div>
  </div>
</body>
</html>`;
}

export function reportFileName(cycleKey: string, ext: 'csv' | 'pdf' = 'csv') {
  const safe = cycleKey.replace(/[^\d-]/g, '') || 'cycle';
  const kind = ext === 'pdf' ? 'synthese' : 'journal';
  return `semence-${kind}-${safe}.${ext}`;
}
