import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Settings } from '../types';
import { DON_LABELS } from '../types';
import { currencySuffix, fcfa, parseFcfaInput, splitIncome } from '../lib/money';
import { colors, fonts } from '../theme/colors';
import { Body, Button, Eyebrow, Field, IconBadge } from './primitives';

export function BudgetEditor({
  settings,
  busy,
  onSave,
}: {
  settings: Settings;
  busy?: boolean;
  onSave: (next: {
    monthlyIncome: number;
    donRate: number;
    epargneRate: number;
    semenceRate: number;
  }) => Promise<void>;
}) {
  const [income, setIncome] = useState(String(settings.monthlyIncome || ''));
  const [donRate, setDonRate] = useState(String(settings.donRate || 0));
  const [epargneRate, setEpargneRate] = useState(String(settings.epargneRate || 0));
  const [semenceRate, setSemenceRate] = useState(String(settings.semenceRate || 0));

  useEffect(() => {
    setIncome(String(settings.monthlyIncome || ''));
    setDonRate(String(settings.donRate || 0));
    setEpargneRate(String(settings.epargneRate || 0));
    setSemenceRate(String(settings.semenceRate || 0));
  }, [settings.monthlyIncome, settings.donRate, settings.epargneRate, settings.semenceRate]);

  const incomeValue = parseFcfaInput(income);
  const don = Number(donRate) || 0;
  const epargne = Number(epargneRate) || 0;
  const semence = Number(semenceRate) || 0;
  const split = splitIncome(incomeValue, don, epargne, semence);
  const totalRate = (settings.profil === 'aucun' ? 0 : don) + epargne + semence;
  const overflow = totalRate > 100;

  function setAmount(kind: 'don' | 'epargne' | 'semence', raw: string) {
    const amount = parseFcfaInput(raw);
    const rate = incomeValue > 0 ? Math.round((amount * 1000) / incomeValue) / 10 : 0;
    const next = String(Math.max(0, rate));
    if (kind === 'don') setDonRate(next);
    if (kind === 'epargne') setEpargneRate(next);
    if (kind === 'semence') setSemenceRate(next);
  }

  return (
    <View>
      <View style={styles.head}>
        <IconBadge name="options-outline" />
        <Eyebrow>Budget du mois</Eyebrow>
      </View>
      <Body style={{ marginBottom: 12 }}>
        Ajuste le revenu et chaque enveloppe. Le courant prend ce qui reste.
      </Body>
      <Field
        label={`Revenu du mois (${currencySuffix()})`}
        value={income}
        onChangeText={setIncome}
        keyboardType="number-pad"
      />
      {settings.profil !== 'aucun' ? (
        <View style={styles.pair}>
          <View style={styles.half}>
            <Field
              label={`${DON_LABELS[settings.profil]} (%)`}
              value={donRate}
              onChangeText={setDonRate}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <Field
              label={`Montant (${currencySuffix()})`}
              value={String(split.don || '')}
              onChangeText={(v) => setAmount('don', v)}
              keyboardType="number-pad"
            />
          </View>
        </View>
      ) : null}
      <View style={styles.pair}>
        <View style={styles.half}>
          <Field
            label="Épargne (%)"
            value={epargneRate}
            onChangeText={setEpargneRate}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.half}>
          <Field
            label={`Montant (${currencySuffix()})`}
            value={String(split.epargne || '')}
            onChangeText={(v) => setAmount('epargne', v)}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <View style={styles.pair}>
        <View style={styles.half}>
          <Field
            label="Semence (%)"
            value={semenceRate}
            onChangeText={setSemenceRate}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.half}>
          <Field
            label={`Montant (${currencySuffix()})`}
            value={String(split.semence || '')}
            onChangeText={(v) => setAmount('semence', v)}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <Text style={[styles.reste, overflow && styles.resteWarn]}>
        {overflow
          ? `Les enveloppes dépassent 100 % (${totalRate} %).`
          : `Reste pour vivre · ${fcfa(split.courant)}`}
      </Text>
      <Button
        label={busy ? 'Enregistrement…' : 'Enregistrer le budget'}
        icon="checkmark-circle-outline"
        onPress={() =>
          void onSave({
            monthlyIncome: incomeValue,
            donRate: settings.profil === 'aucun' ? 0 : don,
            epargneRate: epargne,
            semenceRate: semence,
          })
        }
        disabled={busy || overflow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pair: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  reste: {
    fontFamily: fonts.chiffreMed,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 8,
  },
  resteWarn: {
    color: colors.rouge,
  },
});
