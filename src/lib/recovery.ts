const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Code de secours local, groupé pour être recopié à la main. */
export function generateRecoveryCode(): string {
  let raw = '';
  for (let i = 0; i < 8; i += 1) {
    raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function normalizeRecovery(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatRecoveryInput(raw: string): string {
  const clean = normalizeRecovery(raw).slice(0, 8);
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}
