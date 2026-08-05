import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { exportBackup, updateSettings } from '../../src/db/database';
import { DON_LABELS, PROFIL_LABELS } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { notify } from '../../src/lib/notify';
import {
  Avatar,
  Body,
  Button,
  Eyebrow,
  IconBadge,
  PageCol,
  PageGrid,
  Row,
  Screen,
  Segment,
  SoftCard,
  Title,
} from '../../src/ui/primitives';
import { AvatarPicker, type AvatarChoice } from '../../src/ui/AvatarPicker';
import { colors, fonts } from '../../src/theme/colors';

const MONTH_START_OPTIONS = [
  { value: '1', label: 'Jour 1', icon: 'calendar-outline' as const },
  { value: '25', label: 'Jour 25', icon: 'calendar' as const },
  { value: '28', label: 'Jour 28', icon: 'calendar-outline' as const },
];

export default function PlusScreen() {
  const router = useRouter();
  const { settings, debts, credits, goals, creditYear, refresh, setUnlocked } = useApp();
  const [editAvatar, setEditAvatar] = useState(false);
  const [draftAvatar, setDraftAvatar] = useState<AvatarChoice | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingMonth, setSavingMonth] = useState(false);

  if (!settings) return null;

  const monthKey = String(settings.monthStartDay);
  const knownMonthStart = MONTH_START_OPTIONS.some((o) => o.value === monthKey);
  const monthOptions = knownMonthStart
    ? MONTH_START_OPTIONS
    : [
        ...MONTH_START_OPTIONS,
        {
          value: monthKey,
          label: `Jour ${settings.monthStartDay}`,
          icon: 'calendar-outline' as const,
        },
      ];

  const avatarValue: AvatarChoice = draftAvatar ?? {
    preset: settings.avatarPreset || 'initials',
    photo: settings.avatarPhoto,
  };

  async function backup() {
    try {
      const json = await exportBackup();
      await Share.share({
        message: json,
        title: 'Sauvegarde Semence',
      });
    } catch (e) {
      notify('Sauvegarde', String(e));
    }
  }

  async function setMonthStartDay(raw: string) {
    const next = Number(raw);
    if (!Number.isFinite(next) || next < 1 || next > 28) return;
    if (next === Number(settings!.monthStartDay)) return;
    setSavingMonth(true);
    try {
      await updateSettings({ monthStartDay: next });
      await refresh();
      notify('Mois budgétaire', `Premier jour réglé sur le ${next}.`);
    } catch (e) {
      notify('Mois budgétaire', String(e));
    } finally {
      setSavingMonth(false);
    }
  }

  function openAvatarEditor() {
    setDraftAvatar({
      preset: settings!.avatarPreset || 'initials',
      photo: settings!.avatarPhoto,
    });
    setEditAvatar(true);
  }

  async function saveAvatar() {
    if (!draftAvatar) return;
    setSavingAvatar(true);
    try {
      await updateSettings({
        avatarPreset: draftAvatar.preset,
        avatarPhoto: draftAvatar.photo,
      });
      await refresh();
      setEditAvatar(false);
      setDraftAvatar(null);
    } catch (e) {
      notify('Avatar', String(e));
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <Screen maxWidth="wide" scroll>
      <View style={styles.profile}>
        <Avatar
          name={settings.name || 'Toi'}
          size={72}
          preset={settings.avatarPreset}
          photoUri={settings.avatarPhoto}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>Profil</Eyebrow>
          <Title style={{ marginBottom: 4 }}>{settings.name || 'Profil'}</Title>
          <Body>
            {PROFIL_LABELS[settings.profil]}
            {settings.profil !== 'aucun' ? ` · ${DON_LABELS[settings.profil]} ${settings.donRate} %` : ''}
          </Body>
          <Button
            label={editAvatar ? 'Fermer' : 'Changer avatar ou photo'}
            variant="soft"
            icon={editAvatar ? 'chevron-up' : 'camera-outline'}
            compact
            onPress={() => {
              if (editAvatar) {
                setEditAvatar(false);
                setDraftAvatar(null);
              } else {
                openAvatarEditor();
              }
            }}
          />
        </View>
      </View>

      {editAvatar ? (
        <SoftCard>
          <AvatarPicker
            name={settings.name || 'Toi'}
            value={avatarValue}
            onChange={setDraftAvatar}
          />
          <Button
            label={savingAvatar ? 'Enregistrement…' : 'Enregistrer le profil'}
            icon="checkmark-circle-outline"
            onPress={saveAvatar}
            disabled={savingAvatar || !draftAvatar}
          />
        </SoftCard>
      ) : null}

      <SoftCard>
        <Row
          label={`Épargne ${settings.epargneRate} %`}
          value={`Semence ${settings.semenceRate} %`}
          icon="leaf-outline"
        />
        <Row label="Revenu mensuel" value={fcfa(settings.monthlyIncome)} icon="cash-outline" />
        <Row
          label="Début de mois actuel"
          value={`Jour ${settings.monthStartDay}`}
          icon="calendar-outline"
          last
        />
        <View style={{ marginTop: 12 }}>
          <Eyebrow>Changer le début du mois</Eyebrow>
          <Body style={{ marginBottom: 10 }}>
            Jour où ton mois budgétaire recommence (salaire, enveloppes).
          </Body>
          <Segment
            value={monthKey}
            onChange={(v) => {
              if (!savingMonth) void setMonthStartDay(v);
            }}
            options={monthOptions}
          />
          {savingMonth ? <Body>Enregistrement…</Body> : null}
        </View>
      </SoftCard>

      <PageGrid>
        <PageCol>
          <SoftCard>
            <View style={styles.cardHead}>
              <IconBadge name="people-outline" />
              <Eyebrow>Dettes & créances</Eyebrow>
            </View>
            {debts.length === 0 ? (
              <Body>Aucune dette en cours.</Body>
            ) : (
              debts.map((d, i) => (
                <Row
                  key={d.id}
                  label={`${d.direction === 'je_dois' ? 'Je dois à' : 'Me doit'} ${d.person}`}
                  value={fcfa(d.remaining)}
                  tone={d.direction === 'je_dois' ? 'rouge' : 'vert'}
                  icon="person-outline"
                  last={i === debts.length - 1}
                />
              ))
            )}
            <Button label="Ajouter" variant="soft" icon="add" onPress={() => router.push('/dette')} />
          </SoftCard>

          <SoftCard>
            <View style={styles.cardHead}>
              <IconBadge name="card-outline" bg={colors.rougeWash} color={colors.rouge} />
              <Eyebrow>Crédits</Eyebrow>
            </View>
            {credits.length === 0 ? (
              <Body>Aucun crédit enregistré.</Body>
            ) : (
              credits.map((c, i) => (
                <Row
                  key={c.id}
                  label={`${c.label} · surcoût ${fcfa(c.totalDue - c.received)}`}
                  value={fcfa(c.remaining)}
                  tone="rouge"
                  icon="card-outline"
                  last={i === credits.length - 1}
                />
              ))
            )}
            {creditYear.cost > 0 && (
              <Body style={{ marginTop: 8 }}>Coût cumulé 12 mois : {fcfa(creditYear.cost)}</Body>
            )}
            <Button label="Ajouter un crédit" variant="soft" icon="add" onPress={() => router.push('/credit')} />
          </SoftCard>
        </PageCol>

        <PageCol>
          <SoftCard>
            <View style={styles.cardHead}>
              <IconBadge name="flag-outline" bg={colors.ambreWash} color={colors.ambre} />
              <Eyebrow>Objectifs d’épargne</Eyebrow>
            </View>
            {goals.length === 0 ? (
              <Body>Aucun objectif.</Body>
            ) : (
              goals.map((g, i) => (
                <Row
                  key={g.id}
                  label={g.name}
                  value={`${fcfa(g.current)} / ${fcfa(g.target)}`}
                  tone="vert"
                  icon="flag-outline"
                  last={i === goals.length - 1}
                />
              ))
            )}
            <Button label="Nouvel objectif" variant="soft" icon="add" onPress={() => router.push('/objectif')} />
          </SoftCard>

          <SoftCard style={{ marginBottom: 8 }}>
            <View style={styles.cardHead}>
              <IconBadge name="shield-checkmark-outline" />
              <Eyebrow>Sécurité & données</Eyebrow>
            </View>
            <Button label="Exporter une sauvegarde" icon="cloud-download-outline" onPress={backup} />
            <Button
              label="Verrouiller l’app"
              variant="ghost"
              icon="lock-closed-outline"
              onPress={() => setUnlocked(false)}
            />
            <Text style={styles.foot}>Semence · V1 · Hors ligne · FCFA</Text>
          </SoftCard>
        </PageCol>
      </PageGrid>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  foot: {
    textAlign: 'center',
    fontFamily: fonts.corps,
    color: colors.ink3,
    fontSize: 12,
    letterSpacing: 0.6,
    marginTop: 20,
  },
});
