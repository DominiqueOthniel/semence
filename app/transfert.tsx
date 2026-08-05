import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useApp } from '../src/store/AppContext';
import { transfer } from '../src/db/database';
import { fcfa, parseFcfaInput } from '../src/lib/money';
import { Button, Field, Screen, Segment } from '../src/ui/primitives';
import { colors, fonts } from '../src/theme/colors';

export default function TransfertScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { accounts, refresh } = useApp();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Transfert');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.ground },
      headerTintColor: colors.ink,
    });
  }, [navigation]);

  useEffect(() => {
    if (accounts.length >= 2) {
      setFromId(String(accounts[0].id));
      setToId(String(accounts[1].id));
    } else if (accounts.length === 1) {
      setFromId(String(accounts[0].id));
    }
  }, [accounts]);

  async function save() {
    const value = parseFcfaInput(amount);
    const from = Number(fromId);
    const to = Number(toId);
    if (!value || !from || !to || from === to) {
      Alert.alert('Transfert', 'Choisis deux comptes différents et un montant.');
      return;
    }
    await transfer(from, to, value, note || 'Transfert');
    await refresh();
    router.back();
  }

  const opts = accounts.map((a) => ({
    value: String(a.id),
    label: `${a.name} (${fcfa(a.balance)})`,
  }));

  return (
    <Screen maxWidth="form" scroll keyboard>
      <Text style={styles.label}>Depuis</Text>
      <Segment value={fromId} onChange={setFromId} options={opts} />
      <Text style={styles.label}>Vers</Text>
      <Segment value={toId} onChange={setToId} options={opts} />
      <Field label="Montant (FCFA)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <Field label="Note" value={note} onChangeText={setNote} />
      <Button label="Transférer" icon="swap-horizontal" onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
  },
});
