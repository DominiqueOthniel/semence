import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../src/store/AppContext';
import { addExpense, addIncome } from '../src/db/database';
import type { EnvelopeKind } from '../src/types';
import { DON_LABELS } from '../src/types';
import { fcfa, parseFcfaInput } from '../src/lib/money';
import { Body, Button, Chip, Field, Screen, Segment } from '../src/ui/primitives';
import { colors, fonts } from '../src/theme/colors';

export default function SaisieScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isIncome = mode === 'revenu';
  const navigation = useNavigation();
  const router = useRouter();
  const { accounts, settings, favorites, refresh } = useApp();

  const [accountId, setAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [envelope, setEnvelope] = useState<EnvelopeKind>('courant');

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

  async function save() {
    const value = parseFcfaInput(amount);
    if (!value || !accountId) {
      Alert.alert('Montant', 'Entre un montant valide et choisis un compte.');
      return;
    }
    if (isIncome) {
      await addIncome(accountId, value, note || 'Revenu');
    } else {
      await addExpense(accountId, value, envelope, note || 'Dépense');
    }
    await refresh();
    router.back();
  }

  const envelopeOptions: { value: EnvelopeKind; label: string }[] = [
    ...(settings && settings.profil !== 'aucun'
      ? [{ value: 'don' as const, label: DON_LABELS[settings.profil] || 'Don' }]
      : []),
    { value: 'epargne', label: 'Épargne' },
    { value: 'semence', label: 'Semence' },
    { value: 'courant', label: 'Courant' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {!isIncome && (
          <>
            <Text style={styles.label}>Enveloppe</Text>
            <Segment value={envelope} onChange={setEnvelope} options={envelopeOptions} />
          </>
        )}

        <Text style={styles.label}>Compte</Text>
        <Segment
          value={String(accountId ?? '')}
          onChange={(v) => setAccountId(Number(v))}
          options={accounts.map((a) => ({
            value: String(a.id),
            label: a.name,
          }))}
        />

        {!isIncome && (
          <View style={styles.favs}>
            {favorites.map((f) => (
              <Chip
                key={f.id}
                label={`${f.label} · ${fcfa(f.amount)}`}
                onPress={() => {
                  setAmount(String(f.amount));
                  setNote(f.label);
                }}
              />
            ))}
          </View>
        )}

        <Field label="Montant (FCFA)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
        <Field label="Libellé" value={note} onChangeText={setNote} placeholder={isIncome ? 'Salaire' : 'Déjeuner'} />
        <Body style={{ marginBottom: 16 }}>Montants entiers FCFA, sans décimales.</Body>
        <Button label="Enregistrer" onPress={save} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
  },
  favs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
});
