import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { createAccount, archiveAccount } from '../../src/db/database';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { Body, Button, Eyebrow, Field, Screen, Section, Segment, Title } from '../../src/ui/primitives';
import { colors, fonts } from '../../src/theme/colors';

export default function ComptesScreen() {
  const router = useRouter();
  const { accounts, refresh, position } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('especes');

  async function add() {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Donne un nom à ce compte.');
      return;
    }
    await createAccount(name.trim(), type);
    setName('');
    setShowForm(false);
    await refresh();
  }

  async function remove(id: number, label: string) {
    Alert.alert('Archiver', `Archiver « ${label} » ? L’historique est conservé.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        style: 'destructive',
        onPress: async () => {
          await archiveAccount(id);
          await refresh();
        },
      },
    ]);
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Eyebrow>Portefeuille</Eyebrow>
        <Title>Comptes</Title>
        <Text style={styles.totalLabel}>Solde consolidé</Text>
        <Text style={styles.total}>{fcfa(position?.liquid ?? 0)}</Text>
        <Body style={{ marginBottom: 8 }}>Espèces, MoMo, banque : chaque compte a son solde.</Body>

        <Section>
          {accounts.map((a, i) => (
            <View key={a.id} style={[styles.account, i === accounts.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>{a.name}</Text>
                <Text style={styles.accountType}>{ACCOUNT_TYPE_LABELS[a.type]}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.accountBal}>{fcfa(a.balance)}</Text>
                <Text style={styles.archive} onPress={() => remove(a.id, a.name)}>
                  Archiver
                </Text>
              </View>
            </View>
          ))}
        </Section>

        <Button label="Transfert entre comptes" onPress={() => router.push('/transfert')} />
        <Button
          label={showForm ? 'Masquer' : 'Nouveau compte'}
          variant="ghost"
          onPress={() => setShowForm((v) => !v)}
        />

        {showForm && (
          <Section last>
            <Eyebrow>Nouveau</Eyebrow>
            <Field label="Nom" value={name} onChangeText={setName} placeholder="Compte épargne" />
            <Segment
              value={type}
              onChange={setType}
              options={(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((k) => ({
                value: k,
                label: ACCOUNT_TYPE_LABELS[k],
              }))}
            />
            <Button label="Créer" onPress={add} />
          </Section>
        )}
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
  totalLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginTop: 8,
  },
  total: {
    fontFamily: fonts.chiffreMed,
    fontSize: 34,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  account: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
    gap: 12,
  },
  accountName: {
    fontFamily: fonts.corpsSemi,
    fontSize: 16,
    color: colors.ink,
  },
  accountType: {
    fontFamily: fonts.corps,
    fontSize: 13,
    color: colors.ink3,
    marginTop: 2,
  },
  accountBal: {
    fontFamily: fonts.chiffreMed,
    fontSize: 15,
    color: colors.ink,
  },
  archive: {
    fontFamily: fonts.corpsMed,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 6,
  },
});
