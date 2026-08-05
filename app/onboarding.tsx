import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { completeOnboarding } from '../src/db/database';
import { useApp } from '../src/store/AppContext';
import { DEFAULT_RATES, DON_LABELS, type Profil } from '../src/types';
import { fcfa, parseFcfaInput, splitIncome } from '../src/lib/money';
import {
  Avatar,
  Body,
  Button,
  Eyebrow,
  Field,
  IconBadge,
  Screen,
  Segment,
  SoftCard,
  StepDots,
  Title,
} from '../src/ui/primitives';
import { BrandMark } from '../src/ui/BrandLogo';
import { colors, fonts } from '../src/theme/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  const { refresh } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profil, setProfil] = useState<Profil>('chretien');
  const [income, setIncome] = useState('185000');
  const [donRate, setDonRate] = useState('10');
  const [epargneRate, setEpargneRate] = useState('10');
  const [semenceRate, setSemenceRate] = useState('5');
  const [monthStart, setMonthStart] = useState('25');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);

  function applyProfil(p: Profil) {
    setProfil(p);
    const r = DEFAULT_RATES[p];
    setDonRate(String(r.don));
    setEpargneRate(String(r.epargne));
    setSemenceRate(String(r.semence));
  }

  const split = splitIncome(
    parseFcfaInput(income),
    Number(donRate) || 0,
    Number(epargneRate) || 0,
    Number(semenceRate) || 0,
  );

  async function finish() {
    if (pin.length < 4) {
      Alert.alert('Code PIN', 'Choisis un code d’au moins 4 chiffres.');
      return;
    }
    if (pin !== pin2) {
      Alert.alert('Code PIN', 'Les deux codes ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding({
        name: name.trim() || 'Utilisateur',
        phone: phone.trim(),
        profil,
        monthlyIncome: parseFcfaInput(income),
        donRate: Number(donRate) || 0,
        epargneRate: Number(epargneRate) || 0,
        semenceRate: Number(semenceRate) || 0,
        monthStartDay: Math.min(28, Math.max(1, Number(monthStart) || 1)),
        pin,
      });
      await refresh();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false}>
      <LinearGradient colors={[colors.groundDeep, colors.ground]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BrandMark size={42} style={{ marginBottom: 18 }} />
          <StepDots total={3} current={step} />

          {step === 0 && (
            <View>
              <Title>
                Semer <Text style={styles.em}>avant</Text> de dépenser.
              </Title>
              <Body style={{ marginBottom: 24 }}>
                Quatre enveloppes, un ordre fixe. Configure ton profil en quelques minutes.
              </Body>
              <View style={styles.previewAvatar}>
                <Avatar name={name || 'Toi'} size={64} />
                <Body style={{ marginTop: 8 }}>{name || 'Ton avatar apparaîtra ici'}</Body>
              </View>
              <Field label="Ton prénom" value={name} onChangeText={setName} placeholder="Jean-Claude" />
              <Field
                label="Numéro de téléphone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="6XX XX XX XX"
              />
              <Eyebrow>Profil</Eyebrow>
              <Segment
                value={profil}
                onChange={applyProfil}
                options={[
                  { value: 'chretien', label: 'Chrétien', icon: 'book-outline' },
                  { value: 'musulman', label: 'Musulman', icon: 'moon-outline' },
                  { value: 'solidarite', label: 'Solidarité', icon: 'people-outline' },
                  { value: 'aucun', label: 'Aucun', icon: 'remove-circle-outline' },
                ]}
              />
              <Body style={{ marginBottom: 20 }}>
                {profil === 'aucun'
                  ? 'La première enveloppe sera désactivée. Le reste ne change pas.'
                  : `Enveloppe « ${DON_LABELS[profil]} » activée.`}
              </Body>
              <Button label="Continuer" icon="arrow-forward" onPress={() => setStep(1)} />
            </View>
          )}

          {step === 1 && (
            <View>
              <Title>Ta répartition.</Title>
              <Body style={{ marginBottom: 24 }}>Ajuste les pourcentages. Tu verras tout de suite ce qui reste à vivre.</Body>
              <Field
                label="Revenu du mois (FCFA)"
                value={income}
                onChangeText={setIncome}
                keyboardType="number-pad"
              />
              {profil !== 'aucun' && (
                <Field
                  label={`${DON_LABELS[profil]} (%)`}
                  value={donRate}
                  onChangeText={setDonRate}
                  keyboardType="decimal-pad"
                />
              )}
              <Field label="Épargne (%)" value={epargneRate} onChangeText={setEpargneRate} keyboardType="number-pad" />
              <Field label="Semence (%)" value={semenceRate} onChangeText={setSemenceRate} keyboardType="number-pad" />
              <Field
                label="Premier jour du mois budgétaire"
                value={monthStart}
                onChangeText={setMonthStart}
                keyboardType="number-pad"
                placeholder="25"
              />

              <SoftCard>
                <View style={styles.cardHead}>
                  <IconBadge name="calculator-outline" bg={colors.ambreWash} color={colors.ambre} />
                  <Eyebrow>Aperçu</Eyebrow>
                </View>
                {profil !== 'aucun' && (
                  <Text style={styles.previewLine}>
                    {DON_LABELS[profil]} · {fcfa(split.don)}
                  </Text>
                )}
                <Text style={styles.previewLine}>Épargne · {fcfa(split.epargne)}</Text>
                <Text style={styles.previewLine}>Semence · {fcfa(split.semence)}</Text>
                <Text style={styles.previewStrong}>Reste pour vivre · {fcfa(split.courant)}</Text>
                <Text style={styles.previewDay}>soit {fcfa(split.perDay)} / jour</Text>
              </SoftCard>

              <Button label="Continuer" icon="arrow-forward" onPress={() => setStep(2)} />
              <Button label="Retour" variant="ghost" icon="arrow-back" onPress={() => setStep(0)} />
            </View>
          )}

          {step === 2 && (
            <View>
              <Title>Protège ton carnet.</Title>
              <Body style={{ marginBottom: 24 }}>
                Un code PIN local. Semence fonctionne entièrement hors ligne.
              </Body>
              <View style={styles.lockVisual}>
                <Avatar name={name || 'Toi'} size={56} />
                <IconBadge name="lock-closed" size={44} />
              </View>
              <Field
                label="Code PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
              />
              <Field
                label="Confirmer le PIN"
                value={pin2}
                onChangeText={setPin2}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
              />
              <Button
                label={busy ? 'Création…' : 'Ouvrir Semence'}
                icon="leaf-outline"
                onPress={finish}
                disabled={busy}
              />
              <Button label="Retour" variant="ghost" icon="arrow-back" onPress={() => setStep(1)} />
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  em: {
    fontFamily: fonts.displayItalic,
    color: colors.or,
  },
  previewAvatar: {
    alignItems: 'center',
    marginBottom: 22,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  previewLine: {
    fontFamily: fonts.chiffre,
    fontSize: 14,
    color: colors.ink2,
    marginBottom: 8,
  },
  previewStrong: {
    fontFamily: fonts.chiffreMed,
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 8,
  },
  previewDay: {
    fontFamily: fonts.corpsSemi,
    color: colors.or,
    fontSize: 14,
  },
  lockVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 22,
  },
});
