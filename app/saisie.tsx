import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../src/store/AppContext';
import { addExpense, addIncome } from '../src/db/database';
import type { EnvelopeKind } from '../src/types';
import { DON_LABELS } from '../src/types';
import { currencySuffix, fcfa, moneyKeyboard, parseFcfaInput, sanitizeMoneyInput } from '../src/lib/money';
import { Body, Button, Chip, Field, Screen, Segment } from '../src/ui/primitives';
import { MascotTip } from '../src/ui/Mascot';
import { MASCOT_COPY, mascotStage } from '../src/lib/mascot';
import { colors, fonts } from '../src/theme/colors';

const FAV_ICONS = ['car-outline', 'restaurant-outline', 'phone-portrait-outline', 'cafe-outline'] as const;

export default function SaisieScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isIncome = mode === 'revenu';
  const navigation = useNavigation();
  const router = useRouter();
  const { accounts, settings, favorites, goals, refresh, goToCurrentCycle } = useApp();

  const [accountId, setAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [envelope, setEnvelope] = useState<EnvelopeKind>('courant');
  const [options, setOptions] = useState(false);
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isIncome ? 'Revenu' : 'Dépense',
      headerStyle: { backgroundColor: colors.ground },
      headerTintColor: colors.ink,
      headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
      headerShadowVisible: false,
    });
  }, [navigation, isIncome]);

  useEffect(() => {
    if (accounts.length && accountId == null) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  async function record(value: number, label: string) {
    if (!accountId || busy) return;
    setBusy(true);
    try {
      if (isIncome) {
        await addIncome(accountId, value, label);
      } else {
        await addExpense(accountId, value, envelope, label);
      }
      await refresh();
      goToCurrentCycle();
      router.back();
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const value = parseFcfaInput(amount);
    if (!value || !accountId) {
      Alert.alert('Montant', 'Entre un montant valide.');
      return;
    }
    await record(value, note || (isIncome ? 'Revenu' : 'Dépense'));
  }

  const envelopeOptions: { value: EnvelopeKind; label: string; icon: 'heart-outline' | 'save-outline' | 'leaf-outline' | 'cart-outline' }[] = [
    ...(settings && settings.profil !== 'aucun'
      ? [{ value: 'don' as const, label: DON_LABELS[settings.profil] || 'Don', icon: 'heart-outline' as const }]
      : []),
    { value: 'epargne', label: 'Épargne', icon: 'save-outline' },
    { value: 'semence', label: 'Semence', icon: 'leaf-outline' },
    { value: 'courant', label: 'Courant', icon: 'cart-outline' },
  ];

  return (
    <Screen maxWidth="form" scroll keyboard>
      {isIncome ? (
        <MascotTip
          mood="income"
          stage={mascotStage(goals)}
          title={MASCOT_COPY.income.title}
          text={MASCOT_COPY.income.text}
        />
      ) : null}
      {!isIncome && favorites.length > 0 ? (
        <>
          <Text style={styles.lead}>Un tap enregistre tout de suite, sur le courant.</Text>
          <View style={styles.favs}>
            {favorites.map((f, i) => (
              <Chip
                key={f.id}
                icon={FAV_ICONS[i % FAV_ICONS.length]}
                label={`${f.label} · ${fcfa(f.amount)}`}
                onPress={() => void record(f.amount, f.label)}
              />
            ))}
          </View>
        </>
      ) : (
        <Body style={{ marginBottom: 12 }}>
          {isIncome ? 'Note un revenu, puis enregistre.' : 'Montant, puis enregistre.'}
        </Body>
      )}

      <Field
        label={`Montant (${currencySuffix()})`}
        value={amount}
        onChangeText={(v) => setAmount(sanitizeMoneyInput(v))}
        keyboardType={moneyKeyboard()}
      />
      <Field
        label="Libellé (optionnel)"
        value={note}
        onChangeText={setNote}
        placeholder={isIncome ? 'Salaire' : 'Déjeuner'}
      />
      <Button
        label={busy ? 'Enregistrement…' : 'Enregistrer'}
        icon="checkmark-circle-outline"
        onPress={() => void save()}
      />

      <Pressable
        onPress={() => setOptions((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={options ? 'Masquer le compte et l’enveloppe' : 'Choisir le compte ou l’enveloppe'}
        style={styles.moreBtn}
      >
        <Text style={styles.moreText}>
          {options ? 'Masquer le compte et l’enveloppe' : 'Autre compte ou enveloppe'}
        </Text>
      </Pressable>

      {options ? (
        <>
          {!isIncome ? (
            <>
              <Text style={styles.label}>Enveloppe</Text>
              <Segment value={envelope} onChange={setEnvelope} options={envelopeOptions} />
            </>
          ) : null}
          <Text style={styles.label}>Compte</Text>
          <Segment
            value={String(accountId ?? '')}
            onChange={(v) => setAccountId(Number(v))}
            options={accounts.map((a) => ({
              value: String(a.id),
              label: a.name,
              icon: 'wallet-outline' as const,
            }))}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: fonts.corps,
    fontSize: 15,
    color: colors.ink2,
    marginBottom: 12,
  },
  label: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
    marginTop: 8,
  },
  favs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moreBtn: {
    marginTop: 18,
    minHeight: 40,
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: fonts.corpsSemi,
    fontSize: 13,
    color: colors.or,
  },
});
