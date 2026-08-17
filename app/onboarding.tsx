import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { completeOnboarding } from '../src/db/database';
import { generateRecoveryCode } from '../src/lib/recovery';
import { useApp } from '../src/store/AppContext';
import { DEFAULT_RATES, DON_LABELS, type Profil } from '../src/types';
import { CURRENCIES, DEFAULT_CURRENCY, DEFAULT_PHONE_CODE, phoneMeta, type CurrencyCode } from '../src/lib/locale';
import { currencySuffix, fcfa, parseFcfaInput, setActiveCurrency, splitIncome } from '../src/lib/money';
import { CurrencyPicker, PhoneField } from '../src/ui/LocaleFields';
import {
  Avatar,
  Body,
  Button,
  Eyebrow,
  Field,
  IconBadge,
  Segment,
  SoftCard,
  StepDots,
  Title,
} from '../src/ui/primitives';
import { AvatarPicker, type AvatarChoice } from '../src/ui/AvatarPicker';
import { BrandLockup } from '../src/ui/BrandLogo';
import { colors, elev, fonts, radius } from '../src/theme/colors';
import { useLayout } from '../src/hooks/useLayout';
import { BotanicalField } from '../src/ui/BotanicalMotif';

export default function OnboardingScreen() {
  const router = useRouter();
  const { refresh } = useApp();
  const { isCompact, gutter } = useLayout();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [profil, setProfil] = useState<Profil>('chretien');
  const [avatar, setAvatar] = useState<AvatarChoice>({ preset: 'initials', photo: null });
  const [income, setIncome] = useState('185000');
  const [donRate, setDonRate] = useState('10');
  const [epargneRate, setEpargneRate] = useState('10');
  const [semenceRate, setSemenceRate] = useState('5');
  const [monthStart, setMonthStart] = useState('25');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
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

  function goToRecovery() {
    if (pin.length < 4) {
      Alert.alert('Code PIN', 'Choisis un code d’au moins 4 chiffres.');
      return;
    }
    if (pin !== pin2) {
      Alert.alert('Code PIN', 'Les deux codes ne correspondent pas.');
      return;
    }
    setRecoveryCode((prev) => prev || generateRecoveryCode());
    setStep(3);
  }

  async function finish() {
    if (!recoveryCode) {
      Alert.alert('Code de secours', 'Reviens à l’étape PIN pour générer un code de secours.');
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding({
        name: name.trim() || 'Utilisateur',
        phone: phone.trim(),
        phoneCode,
        currency,
        profil,
        monthlyIncome: parseFcfaInput(income),
        donRate: Number(donRate) || 0,
        epargneRate: Number(epargneRate) || 0,
        semenceRate: Number(semenceRate) || 0,
        monthStartDay: Math.min(28, Math.max(1, Number(monthStart) || 1)),
        pin,
        recoveryCode,
        avatarPreset: avatar.preset,
        avatarPhoto: avatar.photo,
      });
      await refresh();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <>
      <StepDots total={4} current={step} />

      {step === 0 && (
        <View>
          <Title>
            Semer <Text style={styles.em}>avant</Text> de dépenser.
          </Title>
          <Body style={{ marginBottom: 24 }}>
            Quatre enveloppes, un ordre fixe. Configure ton profil en quelques minutes.
          </Body>
          <Field label="Ton prénom" value={name} onChangeText={setName} placeholder="Jean-Claude" />
          <CurrencyPicker
            value={currency}
            onChange={(next) => {
              setCurrencyTouched(true);
              setCurrency(next);
              setActiveCurrency(next);
              const sample = CURRENCIES.find((c) => c.code === next)?.sampleIncome;
              const known = CURRENCIES.some((c) => c.sampleIncome === income);
              if (sample && known) setIncome(sample);
            }}
          />
          <PhoneField
            code={phoneCode}
            number={phone}
            onChangeCode={(next) => {
              setPhoneCode(next);
              if (!currencyTouched) {
                const suggested = phoneMeta(next).currency;
                setCurrency(suggested);
                setActiveCurrency(suggested);
                const sample = CURRENCIES.find((c) => c.code === suggested)?.sampleIncome;
                const known = CURRENCIES.some((c) => c.sampleIncome === income);
                if (sample && known) setIncome(sample);
              }
            }}
            onChangeNumber={setPhone}
          />
          <Eyebrow>Ton visage</Eyebrow>
          <AvatarPicker name={name} value={avatar} onChange={setAvatar} />
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
          <Body style={{ marginBottom: 24 }}>
            Ajuste les pourcentages. Tu pourras les changer plus tard, mois après mois.
          </Body>
          <Field
            label={`Revenu du mois (${currencySuffix(currency)})`}
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
          <Field
            label="Épargne (%)"
            value={epargneRate}
            onChangeText={setEpargneRate}
            keyboardType="number-pad"
          />
          <Field
            label="Semence (%)"
            value={semenceRate}
            onChangeText={setSemenceRate}
            keyboardType="number-pad"
          />
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
            <Avatar
              name={name || 'Toi'}
              size={56}
              preset={avatar.preset}
              photoUri={avatar.photo}
            />
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
          <Button label="Continuer" icon="arrow-forward" onPress={goToRecovery} />
          <Button label="Retour" variant="ghost" icon="arrow-back" onPress={() => setStep(1)} />
        </View>
      )}

      {step === 3 && (
        <View>
          <Title>Code de secours.</Title>
          <Body style={{ marginBottom: 24 }}>
            Note-le hors de l’app. Il sert uniquement si tu oublies ton PIN. Sans lui, il faudra
            effacer ce profil.
          </Body>
          <SoftCard>
            <Eyebrow>À conserver</Eyebrow>
            <Text selectable style={styles.recoveryCode}>
              {recoveryCode}
            </Text>
            <Text style={styles.recoveryHint}>Quatre lettres ou chiffres, un tiret, puis quatre encore.</Text>
          </SoftCard>
          <Button
            label={busy ? 'Création…' : 'J’ai noté ce code, ouvrir Semence'}
            icon="leaf-outline"
            onPress={finish}
            disabled={busy}
          />
          <Button label="Retour" variant="ghost" icon="arrow-back" onPress={() => setStep(2)} />
        </View>
      )}
    </>
  );

  if (isCompact) {
    return (
      <SafeAreaView style={styles.compactSafe} edges={['top', 'left', 'right', 'bottom']}>
        <BotanicalField variant="light" density="screen" />
        <ScrollView
          style={[styles.scrollFlex, styles.foreground]}
          contentContainerStyle={[styles.compactPad, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          bounces
        >
          <BrandLockup height={104} style={{ marginBottom: 18 }} />
          {form}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.desktopSafe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.desktopRoot}>
        <LinearGradient
          colors={['#0F241C', '#163529', '#1F4336']}
          locations={[0, 0.45, 1]}
          style={styles.desktopBrand}
        >
          <BotanicalField variant="dark" density="panel" />
          <View style={styles.foreground}>
            <BrandLockup height={210} align="left" />
            <View style={styles.goldHair} />
            <Text style={styles.desktopPitch}>
              Semer avant de dépenser. Don, épargne, semence, puis courant.
            </Text>
            <Text style={styles.desktopStep}>Étape {step + 1} sur 4</Text>
          </View>
        </LinearGradient>
        <LinearGradient
          colors={['#F7F4EE', colors.ground, '#EAF0EA']}
          locations={[0, 0.5, 1]}
          style={styles.scrollFlex}
        >
          <BotanicalField variant="light" density="screen" />
          <ScrollView
            style={[styles.scrollFlex, styles.foreground]}
            contentContainerStyle={[
              styles.desktopForm,
              { paddingHorizontal: Math.max(gutter, 40) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            bounces
          >
            <View style={styles.desktopFormCard}>{form}</View>
          </ScrollView>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  em: {
    fontFamily: fonts.displayItalic,
    color: colors.or,
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
  recoveryCode: {
    marginTop: 10,
    fontFamily: fonts.chiffreMed,
    fontSize: 28,
    letterSpacing: 3,
    color: colors.ink,
    textAlign: 'center',
  },
  recoveryHint: {
    marginTop: 10,
    fontFamily: fonts.corps,
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink3,
    textAlign: 'center',
  },
  lockVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 22,
  },
  compactSafe: {
    flex: 1,
    backgroundColor: colors.ground,
    minHeight: 0,
    position: 'relative',
  },
  foreground: {
    zIndex: 1,
  },
  scrollFlex: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    ...(Platform.OS === 'web' ? ({ overflowY: 'auto' } as object) : null),
  },
  compactPad: {
    paddingTop: 12,
    paddingBottom: 48,
    flexGrow: 0,
  },
  desktopSafe: {
    flex: 1,
    backgroundColor: colors.ground,
    minHeight: 0,
  },
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  desktopBrand: {
    width: '38%',
    maxWidth: 440,
    minWidth: 280,
    paddingHorizontal: 44,
    paddingVertical: 52,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  goldHair: {
    marginTop: 18,
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.ambre,
  },
  desktopPitch: {
    marginTop: 18,
    fontFamily: fonts.corps,
    fontSize: 17,
    lineHeight: 27,
    color: 'rgba(255,255,255,0.86)',
    maxWidth: 320,
  },
  desktopStep: {
    marginTop: 44,
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.ambre,
  },
  desktopForm: {
    paddingTop: 40,
    paddingBottom: 64,
    flexGrow: 0,
  },
  desktopFormCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 36,
    ...elev.card,
  },
});
