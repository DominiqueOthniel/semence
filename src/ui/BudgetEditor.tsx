import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Settings } from '../types';
import { DON_LABELS } from '../types';
import {
  currencySuffix,
  fcfa,
  moneyKeyboard,
  moneyToInput,
  parseFcfaInput,
  ratesFromAmounts,
  sanitizeMoneyInput,
  splitFromAmounts,
  splitIncome,
} from '../lib/money';
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
  const code = settings.currency;
  const seed = splitIncome(
    settings.monthlyIncome,
    settings.donRate,
    settings.epargneRate,
    settings.semenceRate,
    code,
  );
  const [income, setIncome] = useState(moneyToInput(settings.monthlyIncome, code));
  const [donAmt, setDonAmt] = useState(moneyToInput(seed.don, code));
  const [epargneAmt, setEpargneAmt] = useState(moneyToInput(seed.epargne, code));
  const [semenceAmt, setSemenceAmt] = useState(moneyToInput(seed.semence, code));

  useEffect(() => {
    const next = splitIncome(
      settings.monthlyIncome,
      settings.donRate,
      settings.epargneRate,
      settings.semenceRate,
      settings.currency,
    );
    setIncome(moneyToInput(settings.monthlyIncome, settings.currency));
    setDonAmt(moneyToInput(next.don, settings.currency));
    setEpargneAmt(moneyToInput(next.epargne, settings.currency));
    setSemenceAmt(moneyToInput(next.semence, settings.currency));
  }, [settings.monthlyIncome, settings.donRate, settings.epargneRate, settings.semenceRate, settings.currency]);

  const incomeValue = parseFcfaInput(income, code);
  const don = settings.profil === 'aucun' ? 0 : parseFcfaInput(donAmt, code);
  const epargne = parseFcfaInput(epargneAmt, code);
  const semence = parseFcfaInput(semenceAmt, code);
  const split = splitFromAmounts(incomeValue, don, epargne, semence, code);
  const overflow = split.courant < 0;
  const keys = moneyKeyboard(code);

  return (
    <View>
      <View style={styles.head}>
        <IconBadge name="options-outline" />
        <Eyebrow>Budget du mois</Eyebrow>
      </View>
      <Body style={{ marginBottom: 12 }}>
        Indique les montants dans ta devise. Le courant prend ce qui reste.
      </Body>
      <Field
        label={`Revenu du mois (${currencySuffix(code)})`}
        value={income}
        onChangeText={(v) => setIncome(sanitizeMoneyInput(v, code))}
        keyboardType={keys}
      />
      {settings.profil !== 'aucun' ? (
        <Field
          label={`${DON_LABELS[settings.profil]} (${currencySuffix(code)})`}
          value={donAmt}
          onChangeText={(v) => setDonAmt(sanitizeMoneyInput(v, code))}
          keyboardType={keys}
        />
      ) : null}
      <Field
        label={`Épargne (${currencySuffix(code)})`}
        value={epargneAmt}
        onChangeText={(v) => setEpargneAmt(sanitizeMoneyInput(v, code))}
        keyboardType={keys}
      />
      <Field
        label={`Semence (${currencySuffix(code)})`}
        value={semenceAmt}
        onChangeText={(v) => setSemenceAmt(sanitizeMoneyInput(v, code))}
        keyboardType={keys}
      />
      <Text style={[styles.reste, overflow && styles.resteWarn]}>
        {overflow
          ? `Les enveloppes dépassent le revenu de ${fcfa(Math.abs(split.courant), code)}.`
          : `Reste pour vivre · ${fcfa(split.courant, code)}`}
      </Text>
      <Button
        label={busy ? 'Enregistrement…' : 'Enregistrer le budget'}
        icon="checkmark-circle-outline"
        onPress={() => {
          const rates = ratesFromAmounts(incomeValue, don, epargne, semence);
          void onSave({
            monthlyIncome: incomeValue,
            donRate: settings.profil === 'aucun' ? 0 : rates.donRate,
            epargneRate: rates.epargneRate,
            semenceRate: rates.semenceRate,
          });
        }}
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
