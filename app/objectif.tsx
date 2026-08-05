import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { addGoal } from '../src/db/database';
import { useApp } from '../src/store/AppContext';
import { parseFcfaInput } from '../src/lib/money';
import { Button, Field, Screen } from '../src/ui/primitives';
import { colors } from '../src/theme/colors';

export default function ObjectifScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { refresh } = useApp();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.ground },
      headerTintColor: colors.ink,
    });
  }, [navigation]);

  async function save() {
    const value = parseFcfaInput(target);
    if (!name.trim() || !value) {
      Alert.alert('Objectif', 'Indique un nom et une cible.');
      return;
    }
    await addGoal(name.trim(), value);
    await refresh();
    router.back();
  }

  return (
    <Screen>
      <ScrollView>
        <Field label="Nom de l’objectif" value={name} onChangeText={setName} placeholder="Scolarité" />
        <Field label="Cible (FCFA)" value={target} onChangeText={setTarget} keyboardType="number-pad" />
        <Button label="Créer" onPress={save} />
      </ScrollView>
    </Screen>
  );
}
