import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { addCredit } from '../src/db/database';
import { useApp } from '../src/store/AppContext';
import { currencySuffix, fcfa, parseFcfaInput } from '../src/lib/money';
import { Body, Button, Field, Screen } from '../src/ui/primitives';
import { colors, fonts } from '../src/theme/colors';

export default function CreditScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { refresh } = useApp();
  const [label, setLabel] = useState('Avance MoMo');
  const [received, setReceived] = useState('');
  const [totalDue, setTotalDue] = useState('');
  const [note, setNote] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.ground },
      headerTintColor: colors.ink,
    });
  }, [navigation]);

  const r = parseFcfaInput(received);
  const t = parseFcfaInput(totalDue);
  const cost = t > 0 && r > 0 ? t - r : 0;

  async function save() {
    if (!label.trim() || !r || !t || t < r) {
      Alert.alert('Crédit', 'Le total à rembourser doit être ≥ au montant reçu.');
      return;
    }
    await addCredit({ label: label.trim(), received: r, totalDue: t, note });
    await refresh();
    router.back();
  }

  return (
    <Screen maxWidth="form" scroll keyboard>
      <Body style={{ marginBottom: 14 }}>
        Ce qui compte, ce n’est pas le taux : c’est ce que l’emprunt t’a coûté en {currencySuffix()}.
      </Body>
      <Field label="Libellé" value={label} onChangeText={setLabel} />
      <Field label={`Montant reçu (${currencySuffix()})`} value={received} onChangeText={setReceived} keyboardType="number-pad" />
      <Field
        label={`Total à rembourser (${currencySuffix()})`}
        value={totalDue}
        onChangeText={setTotalDue}
        keyboardType="number-pad"
      />
      <Field label="Note" value={note} onChangeText={setNote} />
      {cost > 0 && (
        <Text style={{ fontFamily: fonts.chiffreMed, color: colors.rouge, marginBottom: 12, fontSize: 15 }}>
          Surcoût de cet emprunt : {fcfa(cost)}
        </Text>
      )}
      <Button label="Enregistrer" icon="checkmark-circle-outline" onPress={save} />
    </Screen>
  );
}
