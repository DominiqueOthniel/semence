import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../src/store/AppContext';
import { addExpense, markEveningDone } from '../../src/db/database';
import { fcfa } from '../../src/lib/money';
import {
  Amount,
  Avatar,
  Body,
  Button,
  Chip,
  Eyebrow,
  Field,
  IconBadge,
  Screen,
  SoftCard,
  Title,
} from '../../src/ui/primitives';
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

const FAV_ICONS = ['car-outline', 'restaurant-outline', 'phone-portrait-outline', 'cafe-outline'] as const;

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
      <Screen maxWidth="form">
        <View style={styles.doneHead}>
          <Avatar name={settings.name || 'Toi'} size={64} />
          <IconBadge name="checkmark-circle" size={44} />
        </View>
        <Eyebrow>Rendez-vous du soir</Eyebrow>
        <Title>C’est noté.</Title>
        <Body>
          {streak > 0 ? `${streak} soir${streak > 1 ? 's' : ''} d’affilée.` : 'À demain, même heure.'}
        </Body>
        {verset && (
          <SoftCard style={{ marginTop: 20 }}>
            <Text style={styles.verset}>« {verset.text} »</Text>
            <Text style={styles.ref}>{verset.ref}</Text>
          </SoftCard>
        )}
      </Screen>
    );
  }

  return (
    <Screen maxWidth="form" scroll keyboard>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>
            {String(settings.eveningHour).padStart(2, '0')} h {String(settings.eveningMinute).padStart(2, '0')}
          </Eyebrow>
          <Title>Qu’as-tu dépensé aujourd’hui ?</Title>
        </View>
        <Avatar name={settings.name || 'Toi'} size={48} />
      </View>
      <Body style={{ marginBottom: 22 }}>Moins de deux minutes. Les montants habituels d’abord.</Body>

      <View style={styles.favs}>
        {favorites.map((f, i) => (
          <Chip
            key={f.id}
            icon={FAV_ICONS[i % FAV_ICONS.length]}
            label={`${f.label} · ${fcfa(f.amount)}`}
            onPress={() => pickFavorite(f.label, f.amount)}
          />
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

      <SoftCard>
        <View style={styles.cardHead}>
          <IconBadge name="sunny-outline" bg={colors.ambreWash} color={colors.ambre} />
          <Eyebrow>Après saisie</Eyebrow>
        </View>
        <Amount large>{fcfa(Math.max(0, envelopes.perDay))}</Amount>
        <Body style={{ marginTop: 6 }}>par jour · {envelopes.daysLeft} jours restants</Body>
      </SoftCard>

      {verset && (
        <SoftCard>
          <Text style={styles.verset}>« {verset.text} »</Text>
          <Text style={styles.ref}>{verset.ref}</Text>
        </SoftCard>
      )}

      <Button label="Terminer le soir" icon="checkmark-circle-outline" onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  doneHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  favs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
