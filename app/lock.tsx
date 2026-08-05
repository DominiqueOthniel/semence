import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../src/store/AppContext';
import { Button, Eyebrow, Field, Screen, Title } from '../src/ui/primitives';
import { colors, fonts } from '../src/theme/colors';

export default function LockScreen() {
  const { unlock, settings } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    const ok = await unlock(pin);
    if (!ok) {
      setError('Code incorrect');
      setPin('');
    }
  }

  return (
    <Screen padded={false}>
      <LinearGradient colors={[colors.groundDeep, colors.ground]} style={styles.wrap}>
        <Text style={styles.brand}>SEMENCE</Text>
        <Eyebrow>Verrouillé</Eyebrow>
        <Title>Bonsoir{settings?.name ? `, ${settings.name}` : ''}.</Title>
        <Text style={styles.hint}>Entre ton code PIN pour ouvrir l’app.</Text>
        <Field
          label="Code PIN"
          value={pin}
          onChangeText={(t) => {
            setPin(t);
            setError('');
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          onSubmitEditing={submit}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button label="Déverrouiller" onPress={submit} />
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  brand: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.or,
    marginBottom: 28,
  },
  hint: {
    fontFamily: fonts.corps,
    color: colors.ink2,
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    fontFamily: fonts.corpsMed,
    color: colors.rouge,
    marginBottom: 8,
  },
});
