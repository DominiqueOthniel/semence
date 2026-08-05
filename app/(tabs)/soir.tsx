import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../src/store/AppContext';
import { addExpense, markEveningDone } from '../../src/db/database';
import { fcfa } from '../../src/lib/money';
import { Amount, Body, Button, Chip, Eyebrow, Field, Screen, Title } from '../../src/ui/primitives';
import { colors, fonts } from '../../src/theme/colors';

const VERSETS: Record<string, { text: string; ref: string } | null> = {
  chretien: {
    text: 'Que chacun donne comme il l’a résolu en son cœur.',
    ref: '2 Corinthiens 9.7',
  },
  musulman: null,
  solidarite: null,
  aucun: null,
};

export default function SoirScreen() {
  const { settings, accounts, favorites, envelopes, eveningDone, streak, refresh } = useApp();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [doneLocal, setDoneLocal] = useState(false);

  if (!settings || !envelopes) return null;

  const verset = VERSETS[settings.profil];
  const account = accounts[0];

  async function pickFavorite(label: string, value: number) {
    if (!account) return;
    await addExpense(account.id, value, 'courant', label);
    setAmount(String((Number(amount) || 0) + value));
    await refresh();
  }

  async function finish() {
    const total = Number(amount) || 0;
    await markEveningDone(total, note);
    setDoneLocal(true);
    await refresh();
    Alert.alert('Noté', `Reste à vivre : ${fcfa(Math.max(0, envelopes!.perDay))}`);
  }

  if (eveningDone || doneLocal) {
    return (
      <Screen>
        <Eyebrow>Rendez-vous du soir</Eyebrow>
        <Title>C’est noté.</Title>
        <Body>
          {streak > 0 ? `${streak} soir${streak > 1 ? 's' : ''} d’affilée.` : 'À demain, même heure.'}
        </Body>
        {verset && (
          <View style={styles.quote}>
            <Text style={styles.verset}>« {verset.text} »</Text>
            <Text style={styles.ref}>{verset.ref}</Text>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Eyebrow>
          {String(settings.eveningHour).padStart(2, '0')} h {String(settings.eveningMinute).padStart(2, '0')}
        </Eyebrow>
        <Title>Qu’as-tu dépensé aujourd’hui ?</Title>
        <Body style={{ marginBottom: 22 }}>
          Moins de deux minutes. Les montants habituels d’abord.
        </Body>

        <View style={styles.favs}>
          {favorites.map((f) => (
            <Chip key={f.id} label={`${f.label} · ${fcfa(f.amount)}`} onPress={() => pickFavorite(f.label, f.amount)} />
          ))}
        </View>

        <Field
          label="Autre montant (FCFA)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="0"
        />
        <Field label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Taxi, marché…" />

        <View style={styles.verdict}>
          <Eyebrow>Après saisie</Eyebrow>
          <Amount large>{fcfa(Math.max(0, envelopes.perDay))}</Amount>
          <Body style={{ marginTop: 6 }}>par jour · {envelopes.daysLeft} jours restants</Body>
        </View>

        {verset && (
          <View style={styles.quote}>
            <Text style={styles.verset}>« {verset.text} »</Text>
            <Text style={styles.ref}>{verset.ref}</Text>
          </View>
        )}

        <Button label="Terminer le soir" onPress={finish} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
  },
  favs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  verdict: {
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ruleFort,
    marginBottom: 20,
  },
  quote: {
    paddingVertical: 18,
    marginBottom: 8,
  },
  verset: {
    fontFamily: fonts.displayItalic,
    fontSize: 18,
    lineHeight: 28,
    color: colors.ink,
  },
  ref: {
    marginTop: 10,
    fontFamily: fonts.corpsSemi,
    color: colors.ink3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
