import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { createAccount, archiveAccount } from '../../src/db/database';
import { ACCOUNT_TYPE_LABELS, type AccountType } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { notify } from '../../src/lib/notify';
import { TOUCH, useLayout } from '../../src/hooks/useLayout';
import {
  Avatar,
  Body,
  Button,
  Eyebrow,
  Field,
  IconBadge,
  PageCol,
  PageGrid,
  Screen,
  Segment,
  SoftCard,
  Title,
} from '../../src/ui/primitives';
import { colors, fonts, radius } from '../../src/theme/colors';
import { ClockStamp } from '../../src/ui/ClockStamp';
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
  const { isCompact } = useLayout();
  const { accounts, refresh, position } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('especes');

  async function add() {
    if (!name.trim()) {
      notify('Nom requis', 'Donne un nom à ce compte.');
      return;
    }
    await createAccount(name.trim(), type);
    setName('');
    setShowForm(false);
    await refresh();
  }

  async function remove(id: number, label: string) {
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`Archiver « ${label} » ? L’historique est conservé.`)
        : true;
    if (!ok) return;
    await archiveAccount(id);
    await refresh();
  }

  const accountList = (
    <>
      {accounts.length === 0 ? (
        <SoftCard>
          <Eyebrow>Premier pas</Eyebrow>
          <Body>Ajoute au moins un compte (ex. Espèces ou MoMo) pour saisir revenus et dépenses.</Body>
        </SoftCard>
      ) : null}

      {isCompact
        ? accounts.map((a) => (
            <SoftCard key={a.id}>
              <AccountRow account={a} onArchive={() => void remove(a.id, a.name)} />
            </SoftCard>
          ))
        : (
          <View style={styles.accountGrid}>
            {accounts.map((a) => (
              <SoftCard key={a.id} style={styles.accountTile}>
                <AccountRow account={a} onArchive={() => void remove(a.id, a.name)} />
              </SoftCard>
            ))}
          </View>
        )}

      {showForm ? (
        <SoftCard>
          <Eyebrow>Nouveau compte</Eyebrow>
          <Body style={{ marginBottom: 12 }}>
            Exemple : « Espèces maison », « MoMo perso », « Compte épargne ».
          </Body>
          <Field label="Nom" value={name} onChangeText={setName} placeholder="Espèces" />
          <Segment
            value={type}
            onChange={setType}
            options={(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((k) => ({
              value: k,
              label: ACCOUNT_TYPE_LABELS[k],
              icon: TYPE_ICON[k],
            }))}
          />
          <Button label="Créer le compte" icon="checkmark" onPress={add} />
        </SoftCard>
      ) : null}
    </>
  );

  const actions = (
    <>
      <Button
        label="Transférer entre comptes"
        icon="swap-horizontal"
        onPress={() => router.push('/transfert')}
        disabled={accounts.length < 2}
      />
      {accounts.length < 2 ? (
        <Body style={{ marginBottom: 8 }}>Il faut au moins deux comptes pour un transfert.</Body>
      ) : null}
      <Button
        label={showForm ? 'Masquer le formulaire' : 'Ajouter un compte'}
        variant="ghost"
        icon={showForm ? 'chevron-up' : 'add'}
        onPress={() => setShowForm((v) => !v)}
      />
    </>
  );

  if (isCompact) {
    return (
      <Screen maxWidth="app" scroll keyboard>
        <View style={styles.head}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>Où est ton argent</Eyebrow>
            <Title>Comptes</Title>
            <View style={{ marginTop: 8 }}>
              <ClockStamp variant="muted" compact />
            </View>
          </View>
          <IconBadge name="wallet" size={48} />
        </View>

        <SoftCard style={styles.purpose}>
          <Body>
            Ici tu sépares ton argent réel : espèces, MTN MoMo, Orange Money, banque… Les enveloppes
            disent comment dépenser ; les comptes disent où l’argent se trouve.
          </Body>
        </SoftCard>

        <SoftCard>
          <Text style={styles.totalLabel}>Solde consolidé</Text>
          <Text style={styles.total}>{fcfa(position?.liquid ?? 0)}</Text>
          <Body>Total disponible sur tous tes comptes actifs.</Body>
        </SoftCard>

        {accountList}
        {actions}
      </Screen>
    );
  }

  return (
    <Screen maxWidth="wide" scroll keyboard>
      <View style={styles.headDesk}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>Où est ton argent</Eyebrow>
          <Title>Comptes</Title>
          <View style={{ marginTop: 8 }}>
            <ClockStamp variant="muted" compact />
          </View>
          <Body style={styles.deskHint}>
            Solde réel par support. Les enveloppes (Accueil) gèrent le budget ; ici tu vois où
            l’argent se trouve.
          </Body>
        </View>
        <View style={styles.heroPanelInline}>
          <Text style={styles.heroLabel}>Solde consolidé</Text>
          <Text style={styles.heroAmount}>{fcfa(position?.liquid ?? 0)}</Text>
          <Text style={styles.heroMeta}>
            {accounts.length} compte{accounts.length > 1 ? 's' : ''} actif
            {accounts.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <PageGrid cols={2}>
        <PageCol flex={1.4}>
          <View style={styles.cardHeadRow}>
            <Eyebrow>Tes comptes</Eyebrow>
          </View>
          {accountList}
        </PageCol>
        <PageCol flex={0.85}>
          <SoftCard style={styles.actionsPanel}>
            <Eyebrow>Actions</Eyebrow>
            <Body style={{ marginBottom: 12 }}>
              Transferts entre supports, ou ajout d’un nouveau compte.
            </Body>
            {actions}
          </SoftCard>
        </PageCol>
      </PageGrid>
    </Screen>
  );
}

function AccountRow({
  account,
  onArchive,
}: {
  account: { id: number; name: string; type: AccountType; balance: number };
  onArchive: () => void;
}) {
  return (
    <View style={styles.account}>
      <Avatar name={account.name} size={44} icon={TYPE_ICON[account.type]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountType}>{ACCOUNT_TYPE_LABELS[account.type]}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.accountBal}>{fcfa(account.balance)}</Text>
        <Pressable
          onPress={onArchive}
          accessibilityRole="button"
          accessibilityLabel={`Archiver ${account.name}`}
          hitSlop={8}
          style={styles.archiveBtn}
        >
          <Text style={styles.archive}>Archiver</Text>
        </Pressable>
      </View>
    </View>
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
  headDesk: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 20,
  },
  deskHint: {
    marginTop: 4,
    maxWidth: 520,
  },
  purpose: {
    backgroundColor: colors.orWash,
    borderColor: colors.ruleFort,
  },
  heroPanel: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(196,137,42,0.22)',
  },
  heroPanelInline: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    paddingVertical: 18,
    paddingHorizontal: 22,
    minWidth: 260,
    borderWidth: 1,
    borderColor: 'rgba(196,137,42,0.22)',
  },
  heroLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 10,
  },
  heroAmount: {
    fontFamily: fonts.chiffreMed,
    fontSize: 34,
    color: colors.white,
    marginBottom: 8,
  },
  heroMeta: {
    fontFamily: fonts.corps,
    fontSize: 14,
    color: colors.inkOnDark,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardHeadRow: {
    marginBottom: 8,
  },
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accountTile: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 220,
    marginBottom: 0,
  },
  actionsPanel: {
    minHeight: 240,
  },
  listCard: {
    paddingVertical: 12,
  },
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
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
