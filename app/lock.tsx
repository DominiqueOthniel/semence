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
import { BrandLogo, BrandMark } from '../src/ui/BrandLogo';
import { colors, fonts, radius, space } from '../src/theme/colors';
import { TOUCH, useLayout } from '../src/hooks/useLayout';

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
        secureTextEntry
        maxLength={slots}
        caretHidden
        autoFocus
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
          <KeyboardAvoidingView
            style={styles.fill}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.mobilePage, { paddingHorizontal: gutter }]}>
              <View style={styles.mobileTop}>
                <BrandMark size={40} />
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
          colors={['#1F4A38', '#2F6B4F', '#3F8A64']}
          locations={[0, 0.55, 1]}
          style={styles.desktopBrand}
        >
          <BrandLogo size={72} style={{ tintColor: undefined }} />
          <Text style={styles.desktopBrandWord}>Semence</Text>
          <Text style={styles.desktopBrandLine}>
            Quatre enveloppes. Un ordre fixe. Ton reste à vivre, chaque jour.
          </Text>
          <View style={styles.desktopBrandMeta}>
            <Ionicons name="leaf-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.desktopBrandMetaText}>Finance personnelle · FCFA · hors ligne</Text>
          </View>
        </LinearGradient>

        <View style={[styles.desktopPanel, { paddingHorizontal: Math.max(gutter, 40) }]}>
          <View style={styles.desktopCard}>
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
        </View>
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
    paddingVertical: 48,
    justifyContent: 'center',
    minWidth: 320,
  },
  desktopBrandWord: {
    marginTop: 18,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 52,
    color: colors.white,
  },
  desktopBrandLine: {
    marginTop: 16,
    fontFamily: fonts.corps,
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 360,
  },
  desktopBrandMeta: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopBrandMetaText: {
    fontFamily: fonts.corpsMed,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  desktopPanel: {
    flex: 1,
    backgroundColor: colors.ground,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 380,
  },
  desktopCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 28,
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
    opacity: 0.02,
    color: 'transparent',
    fontSize: 1,
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
