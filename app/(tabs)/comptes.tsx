import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { createAccount, archiveAccount } from '../../src/db/database';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { TOUCH } from '../../src/hooks/useLayout';
import {
  Avatar,
  Body,
  Button,
  Eyebrow,
  Field,
  IconBadge,
  Screen,
  Segment,
  SoftCard,
  Title,
} from '../../src/ui/primitives';
import { colors, fonts } from '../../src/theme/colors';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TYPE_ICON: Record<AccountType, IconName> = {
  especes: 'cash-outline',
  mtn_momo: 'phone-portrait-outline',
  orange_money: 'phone-portrait-outline',
  banque: 'business-outline',
  tontine: 'people-outline',
  autre: 'ellipse-outline',
};

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
    <Screen maxWidth="app" scroll keyboard>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>Portefeuille</Eyebrow>
          <Title>Comptes</Title>
        </View>
        <IconBadge name="wallet" size={48} />
      </View>

      <SoftCard>
        <Text style={styles.totalLabel}>Solde consolidé</Text>
        <Text style={styles.total}>{fcfa(position?.liquid ?? 0)}</Text>
        <Body>Espèces, MoMo, banque : chaque compte a son solde.</Body>
      </SoftCard>

      {accounts.map((a) => (
        <SoftCard key={a.id}>
          <View style={styles.account}>
            <Avatar name={a.name} size={44} icon={TYPE_ICON[a.type]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.accountName}>{a.name}</Text>
              <Text style={styles.accountType}>{ACCOUNT_TYPE_LABELS[a.type]}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.accountBal}>{fcfa(a.balance)}</Text>
              <Pressable
                onPress={() => remove(a.id, a.name)}
                accessibilityRole="button"
                accessibilityLabel={`Archiver ${a.name}`}
                hitSlop={8}
                style={styles.archiveBtn}
              >
                <Text style={styles.archive}>Archiver</Text>
              </Pressable>
            </View>
          </View>
        </SoftCard>
      ))}

      <Button label="Transfert" icon="swap-horizontal" onPress={() => router.push('/transfert')} />
      <Button
        label={showForm ? 'Masquer' : 'Nouveau compte'}
        variant="ghost"
        icon={showForm ? 'chevron-up' : 'add'}
        onPress={() => setShowForm((v) => !v)}
      />

      {showForm && (
        <SoftCard>
          <Eyebrow>Nouveau</Eyebrow>
          <Field label="Nom" value={name} onChangeText={setName} placeholder="Compte épargne" />
          <Segment
            value={type}
            onChange={setType}
            options={(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((k) => ({
              value: k,
              label: ACCOUNT_TYPE_LABELS[k],
              icon: TYPE_ICON[k],
            }))}
          />
          <Button label="Créer" icon="checkmark" onPress={add} />
        </SoftCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  totalLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  total: {
    fontFamily: fonts.chiffreMed,
    fontSize: 32,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 8,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH,
  },
  accountName: {
    fontFamily: fonts.corpsBold,
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
  archiveBtn: {
    minHeight: 36,
    justifyContent: 'center',
    paddingTop: 4,
  },
  archive: {
    fontFamily: fonts.corpsMed,
    fontSize: 13,
    color: colors.ink3,
  },
});
