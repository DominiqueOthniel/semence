import { useEffect, useRef, useState } from 'react';
import {
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
import { Avatar, Button } from '../src/ui/primitives';
import { BrandLockup } from '../src/ui/BrandLogo';
import { colors, elev, fonts, radius, space } from '../src/theme/colors';
import { TOUCH, useLayout } from '../src/hooks/useLayout';
import { BotanicalField } from '../src/ui/BotanicalMotif';

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

function useGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
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
  const { unlock, settings } = useApp();
  const { gutter, isCompact } = useLayout();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const firstName = capitalizeName(settings?.name);
  const slots = pinSlotsFromHash(settings?.pinHash);
  const salut = useGreeting();

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
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  function onChangePin(next: string) {
    const cleaned = next.replace(/[^\d]/g, '').slice(0, slots);
    setPin(cleaned);
    setError('');
    if (cleaned.length === slots) void submit(cleaned);
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
        <View style={styles.lockHint}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.ink3} />
          <Text style={styles.lockHintText}>Code local · hors ligne</Text>
        </View>
      </View>
    </>
  );

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
                <Text style={styles.hintMobile}>Entre ton code PIN pour ouvrir Semence.</Text>
                {pinBlock}
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
              <Text style={styles.desktopBrandMetaText}>Finance personnelle · FCFA · hors ligne</Text>
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
              </View>
            </View>
            <Text style={styles.hintDesktop}>Saisis ton code PIN pour continuer.</Text>
            {pinBlock}
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
  titleDesktop: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
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
