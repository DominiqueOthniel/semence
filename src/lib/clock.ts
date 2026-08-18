import { MONTH_LABELS } from './cashflow';

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function cap(raw: string) {
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatClock(now = new Date()) {
  const weekday = WEEKDAYS[now.getDay()];
  const month = MONTH_LABELS[now.getMonth()].toLowerCase();
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  const hour = now.getHours();
  return {
    dayKey: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
    weekday: cap(weekday),
    dateLine: `${cap(weekday)} ${now.getDate()} ${month} ${now.getFullYear()}`,
    timeLine: `${hours}:${minutes}`,
    stamp: `${cap(weekday)} ${now.getDate()} ${month} ${now.getFullYear()} · ${hours}:${minutes}`,
    greeting: hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir',
  };
}
