import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addExpense } from '../db/database';
import type { Account, FavoriteAmount, Transaction } from '../types';
import { currencySuffix, fcfa, moneyKeyboard, parseFcfaInput, sanitizeMoneyInput } from '../lib/money';
import { colors, fonts, radius } from '../theme/colors';
import { TOUCH } from '../hooks/useLayout';
import { Chip, Eyebrow, SoftCard } from './primitives';

const FAV_ICONS = ['car-outline', 'restaurant-outline', 'phone-portrait-outline', 'cafe-outline'] as const;

export function recentRepeats(txs: Transaction[], limit = 3) {
  const seen = new Set<string>();
  const out: { note: string; amount: number }[] = [];
  for (let i = txs.length - 1; i >= 0; i -= 1) {
    const t = txs[i];
    if (t.type !== 'depense' || !t.note) continue;
    if (t.note.startsWith('Prélèvement')) continue;
    const key = `${t.note}|${t.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ note: t.note, amount: t.amount });
    if (out.length >= limit) break;
  }
  return out;
}

export function QuickMove({
  accounts,
  favorites,
  transactions,
  onSaved,
  onMore,
  onIncome,
}: {
  accounts: Account[];
  favorites: FavoriteAmount[];
  transactions: Transaction[];
  onSaved: () => Promise<void> | void;
  onMore?: () => void;
  onIncome?: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const repeats = useMemo(() => recentRepeats(transactions), [transactions]);
  const accountId = accounts[0]?.id;

  async function noteExpense(value: number, label: string) {
    if (!accountId || !value || busy) return;
    setBusy(true);
    try {
      await addExpense(accountId, value, 'courant', label);
      setAmount('');
      setNote('');
      setFlash(`${label} · ${fcfa(value)}`);
      await onSaved();
      setTimeout(() => setFlash(''), 2200);
    } finally {
      setBusy(false);
    }
  }

  function saveTyped() {
    const value = parseFcfaInput(amount);
    if (!value) return;
    const label = note.trim() || 'Dépense';
    void noteExpense(value, label);
  }

  if (!accountId) return null;

  return (
    <SoftCard>
      <Eyebrow>Un tap, c’est noté</Eyebrow>
      <Text style={styles.lead}>Les habituels en un tap. Le reste, tu écris le nom.</Text>
      <View style={styles.row}>
        {favorites.map((f, i) => (
          <Chip
            key={f.id}
            icon={FAV_ICONS[i % FAV_ICONS.length]}
            label={`${f.label} · ${fcfa(f.amount)}`}
            onPress={() => void noteExpense(f.amount, f.label)}
          />
        ))}
        {repeats
          .filter((r) => !favorites.some((f) => f.label === r.note && f.amount === r.amount))
          .map((r) => (
            <Chip
              key={`${r.note}-${r.amount}`}
              icon="refresh-outline"
              label={`Refaire ${r.note}`}
              onPress={() => void noteExpense(r.amount, r.note)}
            />
          ))}
      </View>
      <View style={styles.quickCol}>
        <TextInput
          value={amount}
          onChangeText={(v) => setAmount(sanitizeMoneyInput(v))}
          keyboardType={moneyKeyboard()}
          placeholder={`Montant (${currencySuffix()})`}
          placeholderTextColor={colors.ink3}
          accessibilityLabel="Montant"
          style={styles.input}
        />
        <View style={styles.quickRow}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Nom : loisir, marché, cadeau…"
            placeholderTextColor={colors.ink3}
            accessibilityLabel="Nom de la dépense"
            style={[styles.input, styles.noteInput]}
            onSubmitEditing={saveTyped}
            returnKeyType="done"
          />
          <Pressable
            onPress={saveTyped}
            disabled={busy || !parseFcfaInput(amount)}
            accessibilityRole="button"
            accessibilityLabel="Noter la dépense"
            style={({ pressed }) => [
              styles.go,
              pressed && { opacity: 0.9 },
              (busy || !parseFcfaInput(amount)) && { opacity: 0.4 },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </View>
      {flash ? <Text style={styles.flash}>Noté · {flash}</Text> : null}
      {onMore || onIncome ? (
        <View style={styles.moreRow}>
          {onIncome ? (
            <Pressable onPress={onIncome} accessibilityRole="button" style={styles.more}>
              <Text style={styles.moreText}>Noter un revenu</Text>
            </Pressable>
          ) : null}
          {onMore ? (
            <Pressable onPress={onMore} accessibilityRole="button" style={styles.more}>
              <Text style={styles.moreText}>Autre enveloppe</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: 4,
    marginBottom: 12,
    fontFamily: fonts.corps,
    fontSize: 14,
    color: colors.ink2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickCol: {
    gap: 8,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: TOUCH,
    fontSize: 16,
    fontFamily: fonts.chiffreMed,
    color: colors.ink,
  },
  noteInput: {
    fontFamily: fonts.corps,
    fontSize: 15,
  },
  go: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.full,
    backgroundColor: colors.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    marginTop: 10,
    fontFamily: fonts.corpsSemi,
    fontSize: 13,
    color: colors.or,
  },
  more: {
    minHeight: 36,
    justifyContent: 'center',
  },
  moreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
  },
  moreText: {
    fontFamily: fonts.corpsSemi,
    fontSize: 13,
    color: colors.or,
  },
});
