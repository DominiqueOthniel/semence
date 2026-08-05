import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../src/store/AppContext';
import { Avatar, Button, Eyebrow, Field, Screen, Title } from '../src/ui/primitives';
import { BrandLogo } from '../src/ui/BrandLogo';
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
        <View style={styles.center}>
          <View style={styles.logos}>
            <BrandLogo size={56} />
            <Avatar name={settings?.name || 'Toi'} size={56} />
          </View>
          <Eyebrow>Verrouillé</Eyebrow>
          <Title style={{ textAlign: 'center' }}>
            Bonsoir{settings?.name ? `, ${settings.name.split(' ')[0]}` : ''}.
          </Title>
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
          <Button label="Déverrouiller" icon="lock-open-outline" onPress={submit} />
        </View>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  center: {
    alignItems: 'stretch',
  },
  logos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  hint: {
    fontFamily: fonts.corps,
    color: colors.ink2,
    marginBottom: 24,
    marginTop: 4,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.corpsMed,
    color: colors.rouge,
    marginBottom: 8,
    textAlign: 'center',
  },
});
