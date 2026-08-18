import { useNavigation, useRouter, useLocalSearchParams } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { addGoal, contributeGoal, deleteGoal, updateGoal } from '../src/db/database';
import { useApp } from '../src/store/AppContext';
import { planGoal } from '../src/lib/goals';
import { currencySuffix, fcfa, moneyKeyboard, moneyToInput, parseFcfaInput, sanitizeMoneyInput } from '../src/lib/money';
import { Body, Button, Field, Screen, Segment, SoftCard, Title } from '../src/ui/primitives';
import { MascotTip } from '../src/ui/Mascot';
import { mascotStage } from '../src/lib/mascot';
import { colors } from '../src/theme/colors';

const DURATION_OPTS = [
  { value: '3', label: '3 mois' },
  { value: '6', label: '6 mois' },
  { value: '12', label: '12 mois' },
  { value: '24', label: '24 mois' },
  { value: 'autre', label: 'Autre' },
] as const;

export default function ObjectifScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { refresh, goals } = useApp();
  const existing = useMemo(
    () => (id ? goals.find((g) => String(g.id) === String(id)) : undefined),
    [goals, id],
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing ? moneyToInput(existing.target) : '');
  const [durationKey, setDurationKey] = useState(() => {
    const m = existing?.months;
    if (!m) return '6';
    return ['3', '6', '12', '24'].includes(String(m)) ? String(m) : 'autre';
  });
  const [customMonths, setCustomMonths] = useState(
    existing?.months && !['3', '6', '12', '24'].includes(String(existing.months))
      ? String(existing.months)
      : '',
  );
  const [monthly, setMonthly] = useState(existing?.monthlyBudget ? moneyToInput(existing.monthlyBudget) : '');
  const [verse, setVerse] = useState('');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: existing ? 'Objectif' : 'Nouvel objectif',
      headerStyle: { backgroundColor: colors.ground },
      headerTintColor: colors.ink,
    });
  }, [navigation, existing]);

  const months =
    durationKey === 'autre' ? Math.max(1, Number(customMonths) || 0) : Number(durationKey) || 0;
  const planned = planGoal({
    target: parseFcfaInput(target),
    months: months || null,
    monthlyBudget: parseFcfaInput(monthly) || null,
  });

  async function save() {
    if (!name.trim() || planned.target <= 0) {
      Alert.alert('Objectif', 'Indique un nom et un budget.');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (existing) {
        await updateGoal(existing.id, {
          name: name.trim(),
          target: planned.target,
          months: planned.months,
          monthlyBudget: planned.monthlyBudget,
          dueDate: planned.dueDate,
        });
      } else {
        await addGoal({
          name: name.trim(),
          target: planned.target,
          months: planned.months,
          monthlyBudget: planned.monthlyBudget,
          dueDate: planned.dueDate,
        });
      }
      await refresh();
      router.back();
    } catch (e) {
      Alert.alert('Objectif', String(e));
    } finally {
      setBusy(false);
    }
  }

  async function verseNow() {
    if (!existing) return;
    const amount = parseFcfaInput(verse);
    if (!amount) {
      Alert.alert('Versement', 'Indique un montant.');
      return;
    }
    setBusy(true);
    try {
      await contributeGoal(existing.id, amount);
      await refresh();
      setVerse('');
    } catch (e) {
      Alert.alert('Versement', String(e));
    } finally {
      setBusy(false);
    }
  }

  function askDelete() {
    if (!existing) return;
    Alert.alert('Supprimer', 'Retirer cet objectif du carnet ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteGoal(existing.id);
            await refresh();
            router.back();
          })();
        },
      },
    ]);
  }

  return (
    <Screen maxWidth="form" scroll keyboard>
      <Title>{existing ? existing.name : 'Un objectif, un rythme.'}</Title>
      {existing && existing.target > 0 && existing.current >= existing.target ? (
        <MascotTip
          mood="goal"
          stage={mascotStage(goals)}
          title="Objectif atteint"
          text="La semence pousse un peu. Garde le rythme, ou ouvre le suivant."
        />
      ) : null}
      <Body style={{ marginBottom: 18 }}>
        Fixe un budget et une durée. Semence calcule le versement mensuel, tu peux l’ajuster.
      </Body>
      <Field label="Nom" value={name} onChangeText={setName} placeholder="Scolarité, voyage, fonds…" />
      <Field
        label={`Budget total (${currencySuffix()})`}
        value={target}
        onChangeText={(v) => setTarget(sanitizeMoneyInput(v))}
        keyboardType={moneyKeyboard()}
      />
      <Body style={{ marginBottom: 8 }}>Durée</Body>
      <Segment value={durationKey} onChange={setDurationKey} options={[...DURATION_OPTS]} />
      {durationKey === 'autre' ? (
        <Field
          label="Nombre de mois"
          value={customMonths}
          onChangeText={setCustomMonths}
          keyboardType="number-pad"
          placeholder="8"
        />
      ) : null}
      <Field
        label={`Versement par mois (${currencySuffix()})`}
        value={monthly}
        onChangeText={(v) => setMonthly(sanitizeMoneyInput(v))}
        keyboardType={moneyKeyboard()}
        placeholder={planned.monthlyBudget ? moneyToInput(planned.monthlyBudget) : '0'}
        hint={
          planned.monthlyBudget
            ? `${fcfa(planned.target)} sur ${planned.months ?? 0} mois, soit ${fcfa(planned.monthlyBudget)} / mois`
            : 'Indique un budget, ou un versement mensuel.'
        }
      />

      {existing ? (
        <SoftCard>
          <Body>
            Déjà mis de côté : {fcfa(existing.current)} sur {fcfa(existing.target)}
          </Body>
          <Field
            label={`Verser maintenant (${currencySuffix()})`}
            value={verse}
            onChangeText={(v) => setVerse(sanitizeMoneyInput(v))}
            keyboardType={moneyKeyboard()}
          />
          <Button
            label={busy ? 'Enregistrement…' : 'Ajouter ce versement'}
            variant="soft"
            icon="add-circle-outline"
            onPress={() => void verseNow()}
            disabled={busy}
          />
        </SoftCard>
      ) : null}

      <Button
        label={busy ? 'Enregistrement…' : existing ? 'Enregistrer' : 'Créer l’objectif'}
        icon="flag-outline"
        onPress={() => void save()}
        disabled={busy}
      />
      {existing ? (
        <Button label="Supprimer" variant="ghost" icon="trash-outline" onPress={askDelete} />
      ) : null}
    </Screen>
  );
}
