import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/store/AppContext';
import { verifyRecovery } from '../src/db/database';
import { currencySuffix } from '../src/lib/money';
import { formatRecoveryInput } from '../src/lib/recovery';
import { Avatar, Button, Field } from '../src/ui/primitives';
import { BrandLockup } from '../src/ui/BrandLogo';
import { colors, elev, fonts, radius, space } from '../src/theme/colors';
import { TOUCH, useLayout } from '../src/hooks/useLayout';
import { BotanicalField } from '../src/ui/BotanicalMotif';
import { ClockStamp } from '../src/ui/ClockStamp';
import { formatClock } from '../src/lib/clock';
import { useNow } from '../src/hooks/useNow';

function capitalizeName(raw?: string) {
  if (!raw) return '';
  const first = raw.trim().split(/\s+/)[0] || '';
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function pinSlotsFromHash(pinHash: string | null | undefined) {
  if (!pinHash) return 4;
  const part = pinHash.split(':')[1];
  const n = Number(part);
  if (!Number.isFinite(n) || n < 4) return 4;
  return Math.min(8, n);
}

function PinSlots({
  slots,
  pin,
  error,
  inputRef,
  onChangePin,
  onSubmit,
}: {
  slots: number;
  pin: string;
  error: string;
  inputRef: React.RefObject<TextInput | null>;
  onChangePin: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="button"
      accessibilityLabel="Saisir le code PIN"
      style={styles.pinWrap}
    >
      <View style={styles.slots}>
        {Array.from({ length: slots }).map((_, i) => {
          const filled = i < pin.length;
          const active = i === pin.length;
          return (
            <View
              key={i}
              style={[
                styles.slot,
                filled && styles.slotFilled,
                active && !error && styles.slotActive,
                !!error && styles.slotError,
              ]}
            >
              {filled ? <View style={styles.dot} /> : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={onChangePin}
        keyboardType="number-pad"
        inputMode="numeric"
        secureTextEntry
        maxLength={slots}
        caretHidden
        autoFocus
        autoComplete="one-time-code"
        importantForAutofill="yes"
        textContentType="oneTimeCode"
        accessibilityLabel="Code PIN"
        style={styles.hiddenInput}
        onSubmitEditing={onSubmit}
      />
    </Pressable>
  );
}

export default function LockScreen() {
  const { unlock, recoverAccess, resetProfile, settings } = useApp();
  const { gutter, isCompact } = useLayout();
  const [mode, setMode] = useState<'pin' | 'recover' | 'newPin' | 'wipe'>('pin');
  const [pin, setPin] = useState('');
  const [recovery, setRecovery] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const firstName = capitalizeName(settings?.name);
  const slots = pinSlotsFromHash(settings?.pinHash);
  const salut = formatClock(useNow()).greeting;
  const canRecover = !!settings?.recoveryHash;

  async function submit(value = pin) {
    if (busy || value.length < 4) return;
    setBusy(true);
    const ok = await unlock(value);
    setBusy(false);
    if (!ok) {
      setError('Code incorrect');
      setPin('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  useEffect(() => {
    if (mode !== 'pin') return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [mode]);

  function onChangePin(next: string) {
    const cleaned = next.replace(/[^\d]/g, '').slice(0, slots);
    setPin(cleaned);
    setError('');
    if (cleaned.length === slots) void submit(cleaned);
  }

  function backToPin() {
    setMode('pin');
    setError('');
    setRecovery('');
    setNewPin('');
    setNewPin2('');
  }

  async function checkRecovery() {
    if (busy) return;
    setBusy(true);
    const ok = await verifyRecovery(recovery);
    setBusy(false);
    if (!ok) {
      setError('Code de secours incorrect');
      return;
    }
    setError('');
    setMode('newPin');
  }

  async function saveNewPin() {
    if (newPin.length < 4) {
      setError('Choisis un PIN d’au moins 4 chiffres.');
      return;
    }
    if (newPin !== newPin2) {
      setError('Les deux codes ne correspondent pas.');
      return;
    }
    setBusy(true);
    const ok = await recoverAccess(recovery, newPin);
    setBusy(false);
    if (!ok) {
      setError('Impossible de changer le PIN. Vérifie le code de secours.');
      setMode('recover');
    }
  }

  function askWipe() {
    Alert.alert(
      'Effacer ce profil',
      'Comptes, opérations et PIN de cet appareil seront effacés. Tu pourras créer un nouveau profil ensuite.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            setMode('wipe');
            setError('');
          },
        },
      ],
    );
  }

  async function confirmWipe() {
    if (busy) return;
    setBusy(true);
    try {
      await resetProfile();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  }

  const pinBlock = (
    <>
      <PinSlots
        slots={slots}
        pin={pin}
        error={error}
        inputRef={inputRef}
        onChangePin={onChangePin}
        onSubmit={() => submit()}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && pin.length > 0 && pin.length < slots ? (
        <Text style={styles.progress}>
          {pin.length} / {slots}
        </Text>
      ) : (
        <Text style={styles.progressSpacer}> </Text>
      )}
      <View style={styles.actions}>
        <Button
          label={busy ? 'Vérification…' : 'Déverrouiller'}
          icon="lock-open-outline"
          onPress={() => submit()}
          disabled={busy || pin.length < 4}
        />
        <Button
          label="Code oublié"
          variant="ghost"
          icon="key-outline"
          onPress={() => {
            setError('');
            if (canRecover) setMode('recover');
            else askWipe();
          }}
        />
        <View style={styles.lockHint}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.ink3} />
          <Text style={styles.lockHintText}>Code local · hors ligne</Text>
        </View>
      </View>
    </>
  );

  const recoverBlock = (
    <View style={styles.actions}>
      <Text style={styles.altHint}>
        Saisis le code de secours noté à l’ouverture du profil.
      </Text>
      <Field
        label="Code de secours"
        value={recovery}
        onChangeText={(v) => {
          setRecovery(formatRecoveryInput(v));
          setError('');
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="XXXX-XXXX"
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button
        label={busy ? 'Vérification…' : 'Continuer'}
        icon="arrow-forward"
        onPress={() => void checkRecovery()}
        disabled={busy || recovery.replace(/[^A-Za-z0-9]/g, '').length < 8}
      />
      <Button label="Retour au PIN" variant="ghost" icon="arrow-back" onPress={backToPin} />
      <Button
        label="Effacer et créer un nouveau profil"
        variant="ghost"
        icon="person-add-outline"
        onPress={askWipe}
      />
    </View>
  );

  const newPinBlock = (
    <View style={styles.actions}>
      <Text style={styles.altHint}>Choisis un nouveau code PIN pour ce profil.</Text>
      <Field
        label="Nouveau PIN"
        value={newPin}
        onChangeText={(v) => {
          setNewPin(v.replace(/[^\d]/g, '').slice(0, 8));
          setError('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
      />
      <Field
        label="Confirmer le PIN"
        value={newPin2}
        onChangeText={(v) => {
          setNewPin2(v.replace(/[^\d]/g, '').slice(0, 8));
          setError('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button
        label={busy ? 'Enregistrement…' : 'Enregistrer le nouveau PIN'}
        icon="lock-open-outline"
        onPress={() => void saveNewPin()}
        disabled={busy || newPin.length < 4}
      />
      <Button label="Retour" variant="ghost" icon="arrow-back" onPress={() => setMode('recover')} />
    </View>
  );

  const wipeBlock = (
    <View style={styles.actions}>
      <Text style={styles.altHint}>
        {canRecover
          ? 'Dernier recours : ce carnet local sera vidé, puis tu créeras un nouveau profil.'
          : 'Aucun code de secours n’est enregistré. Pour continuer, il faut effacer ce profil et en créer un autre.'}
      </Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button
        label={busy ? 'Effacement…' : 'Effacer et créer un nouveau profil'}
        variant="danger"
        icon="trash-outline"
        onPress={() => void confirmWipe()}
        disabled={busy}
      />
      <Button
        label={canRecover ? 'J’ai mon code de secours' : 'Retour au PIN'}
        variant="ghost"
        icon="arrow-back"
        onPress={() => (canRecover ? setMode('recover') : backToPin())}
      />
    </View>
  );

  const authBlock =
    mode === 'recover' ? recoverBlock : mode === 'newPin' ? newPinBlock : mode === 'wipe' ? wipeBlock : pinBlock;
  const hint =
    mode === 'recover'
      ? 'Code de secours pour retrouver ce profil.'
      : mode === 'newPin'
        ? 'Nouveau PIN, puis Semence s’ouvre.'
        : mode === 'wipe'
          ? 'Cette action est définitive sur cet appareil.'
          : 'Entre ton code PIN pour ouvrir Semence.';

  if (isCompact) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <LinearGradient
          colors={[colors.groundDeep, colors.ground, '#F7F4EE']}
          locations={[0, 0.45, 1]}
          style={styles.fill}
        >
          <BotanicalField variant="light" density="screen" />
          <KeyboardAvoidingView
            style={[styles.fill, styles.foreground]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.mobilePage, { paddingHorizontal: gutter }]}>
              <View style={styles.mobileTop}>
                <BrandLockup height={96} />
              </View>
              <View style={styles.mobileMiddle}>
                <Avatar
                  name={settings?.name || 'Toi'}
                  size={64}
                  preset={settings?.avatarPreset}
                  photoUri={settings?.avatarPhoto}
                />
                <Text style={styles.eyebrow}>Verrouillé</Text>
                <Text style={styles.titleMobile}>
                  {salut}
                  {firstName ? `, ${firstName}` : ''}.
                </Text>
                <View style={styles.clockLock}>
                  <ClockStamp />
                </View>
                <Text style={styles.hintMobile}>{hint}</Text>
                {authBlock}
              </View>
              <View />
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.desktopRoot}>
        <LinearGradient
          colors={['#0F241C', '#163529', '#1F4336']}
          locations={[0, 0.55, 1]}
          style={styles.desktopBrand}
        >
          <BotanicalField variant="dark" density="panel" />
          <View style={styles.foreground}>
            <BrandLockup height={210} align="left" />
            <View style={styles.goldHair} />
            <Text style={styles.desktopBrandLine}>
              Quatre enveloppes. Un ordre fixe. Ton reste à vivre, chaque jour.
            </Text>
            <View style={styles.desktopBrandMeta}>
              <Ionicons name="leaf-outline" size={16} color={colors.ambre} />
              <Text style={styles.desktopBrandMetaText}>
                Finance personnelle · {currencySuffix()} · hors ligne
              </Text>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#F7F4EE', colors.ground, '#EAF0EA']}
          style={[styles.desktopPanel, { paddingHorizontal: Math.max(gutter, 40) }]}
        >
          <BotanicalField variant="light" density="screen" />
          <View style={[styles.desktopCard, styles.foreground]}>
            <View style={styles.desktopCardHead}>
              <Avatar
                name={settings?.name || 'Toi'}
                size={52}
                preset={settings?.avatarPreset}
                photoUri={settings?.avatarPhoto}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.eyebrow}>Verrouillé</Text>
                <Text style={styles.titleDesktop}>
                  {salut}
                  {firstName ? `, ${firstName}` : ''}.
                </Text>
                <View style={styles.clockLockDesk}>
                  <ClockStamp />
                </View>
              </View>
            </View>
            <Text style={styles.hintDesktop}>{hint}</Text>
            {authBlock}
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  fill: {
    flex: 1,
    position: 'relative',
  },
  foreground: {
    zIndex: 1,
  },
  mobilePage: {
    flex: 1,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  mobileTop: {
    alignItems: 'center',
    minHeight: TOUCH,
    justifyContent: 'center',
  },
  mobileMiddle: {
    alignItems: 'center',
  },
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopBrand: {
    flex: 1.05,
    paddingHorizontal: 48,
    paddingVertical: 52,
    justifyContent: 'center',
    minWidth: 320,
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
  desktopBrandLine: {
    marginTop: 18,
    fontFamily: fonts.corps,
    fontSize: 17,
    lineHeight: 27,
    color: 'rgba(255,255,255,0.86)',
    maxWidth: 340,
  },
  desktopBrandMeta: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopBrandMetaText: {
    fontFamily: fonts.corpsMed,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
  },
  desktopPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 380,
    position: 'relative',
  },
  desktopCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 32,
    ...elev.card,
  },
  desktopCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  eyebrow: {
    marginTop: space.md,
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.or,
  },
  titleMobile: {
    marginTop: 8,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 38,
    color: colors.ink,
    textAlign: 'center',
  },
  clockLock: {
    marginTop: 10,
    alignItems: 'center',
  },
  titleDesktop: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  clockLockDesk: {
    marginTop: 6,
  },
  hintMobile: {
    marginTop: 10,
    marginBottom: space.xl,
    fontFamily: fonts.corps,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink2,
    textAlign: 'center',
    maxWidth: 280,
  },
  altHint: {
    marginBottom: 16,
    fontFamily: fonts.corps,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
    textAlign: 'center',
  },
  hintDesktop: {
    marginTop: 12,
    marginBottom: 22,
    fontFamily: fonts.corps,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
  },
  pinWrap: {
    alignItems: 'center',
    minHeight: TOUCH + 16,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  slots: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  slot: {
    width: 44,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ruleFort,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    borderColor: colors.or,
    backgroundColor: colors.orWash,
  },
  slotActive: {
    borderColor: colors.or,
  },
  slotError: {
    borderColor: colors.rouge,
    backgroundColor: colors.rougeWash,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.or,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
    // ≥ 16px : sinon Safari / Chrome mobile zooment au focus.
    fontSize: 16,
    lineHeight: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  error: {
    marginTop: 14,
    fontFamily: fonts.corpsMed,
    color: colors.rouge,
    fontSize: 14,
    textAlign: 'center',
  },
  progress: {
    marginTop: 14,
    fontFamily: fonts.corpsSemi,
    color: colors.ink3,
    fontSize: 13,
    textAlign: 'center',
  },
  progressSpacer: {
    marginTop: 14,
    fontSize: 13,
  },
  actions: {
    width: '100%',
    marginTop: 8,
  },
  lockHint: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockHintText: {
    fontFamily: fonts.corps,
    fontSize: 13,
    color: colors.ink3,
  },
});
