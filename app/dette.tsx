import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Alert } from 'react-native';
import { addDebt } from '../src/db/database';
import { useApp } from '../src/store/AppContext';
import { parseFcfaInput } from '../src/lib/money';
import { Button, Field, Screen, Segment } from '../src/ui/primitives';
import { colors } from '../src/theme/colors';

export default function DetteScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { refresh } = useApp();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'je_dois' | 'on_me_doit'>('je_dois');
  const [note, setNote] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.ground },
      headerTintColor: colors.ink,
    });
  }, [navigation]);

  async function save() {
    const value = parseFcfaInput(amount);
    if (!person.trim() || !value) {
      Alert.alert('Dette', 'Indique une personne et un montant.');
      return;
    }
    await addDebt({ person: person.trim(), amount: value, direction, note });
    await refresh();
    router.back();
  }

  return (
    <Screen maxWidth="form" scroll keyboard>
      <Segment
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'je_dois', label: 'Je dois', icon: 'arrow-up-outline' },
          { value: 'on_me_doit', label: 'On me doit', icon: 'arrow-down-outline' },
        ]}
      />
      <Field label="Personne" value={person} onChangeText={setPerson} placeholder="Nom" />
      <Field label="Montant (FCFA)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <Field label="Note" value={note} onChangeText={setNote} />
      <Button label="Enregistrer" icon="checkmark-circle-outline" onPress={save} />
    </Screen>
  );
}
