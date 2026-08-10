import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { exportBackup, updateSettings } from '../../src/db/database';
import { DON_LABELS, PROFIL_LABELS } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { notify } from '../../src/lib/notify';
import { buildMonthlyCsvReport, reportFileName } from '../../src/lib/report';
import { useLayout } from '../../src/hooks/useLayout';
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
  SoftCard,
  Title,
} from '../../src/ui/primitives';
import { AvatarPicker, type AvatarChoice } from '../../src/ui/AvatarPicker';
import { colors, fonts, radius } from '../../src/theme/colors';

const MONTH_OPTS = [
  { day: 1, title: 'Le 1er', hint: 'Mois civil' },
  { day: 25, title: 'Le 25', hint: 'Jour de paie' },
  { day: 28, title: 'Le 28', hint: 'Fin de mois' },
] as const;

export default function PlusScreen() {
  const router = useRouter();
  const { isCompact } = useLayout();
  const { settings, debts, credits, goals, creditYear, refresh, setUnlocked, yearTransactions } =
    useApp();
  const [editAvatar, setEditAvatar] = useState(false);
  const [draftAvatar, setDraftAvatar] = useState<AvatarChoice | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingMonth, setSavingMonth] = useState(false);

  if (!settings) return null;

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

  async function exportMonthlyReport() {
    if (!settings) return;
    try {
      const now = new Date();
      const csv = buildMonthlyCsvReport({
        settings,
        transactions: yearTransactions,
        year: now.getFullYear(),
        month: now.getMonth(),
      });
      await Share.share({
        message: csv,
        title: reportFileName(now.getFullYear(), now.getMonth()),
      });
    } catch (e) {
      notify('Rapport', String(e));
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

  const monthPicker = isCompact ? (
    <View style={styles.monthBlock}>
      <Eyebrow>Début du mois budgétaire</Eyebrow>
      <Body style={{ marginBottom: 12 }}>
        Choisis le jour où ton mois recommence (souvent le jour de salaire). Les enveloppes se
        recalculent à partir de ce jour.
      </Body>
      <Body style={styles.monthCurrent}>Actuellement : le {settings.monthStartDay}</Body>
      {MONTH_OPTS.map((opt) => {
        const active = Number(settings.monthStartDay) === opt.day;
        return (
          <Button
            key={opt.day}
            label={active ? `${opt.title} · sélectionné` : `${opt.title} · ${opt.hint}`}
            variant={active ? 'soft' : 'ghost'}
            icon={active ? 'checkmark-circle' : 'calendar-outline'}
            disabled={savingMonth}
            onPress={() => {
              if (!savingMonth) void setMonthStartDay(String(opt.day));
            }}
          />
        );
      })}
      {savingMonth ? <Body style={{ marginTop: 8 }}>Enregistrement…</Body> : null}
    </View>
  ) : (
    <View style={styles.monthBlock}>
      <Eyebrow>Début du mois budgétaire</Eyebrow>
      <Body style={{ marginBottom: 12 }}>
        Jour où le mois recommence (salaire). Actuellement : le {settings.monthStartDay}.
      </Body>
      <View style={styles.monthChips}>
        {MONTH_OPTS.map((opt) => {
          const active = Number(settings.monthStartDay) === opt.day;
          return (
            <Pressable
              key={opt.day}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              disabled={savingMonth}
              onPress={() => {
                if (!savingMonth) void setMonthStartDay(String(opt.day));
              }}
              style={({ pressed }) => [
                styles.monthChip,
                active && styles.monthChipOn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.monthChipTitle, active && styles.monthChipTitleOn]}>
                {opt.title}
              </Text>
              <Text style={[styles.monthChipHint, active && styles.monthChipHintOn]}>
                {opt.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {savingMonth ? <Body style={{ marginTop: 8 }}>Enregistrement…</Body> : null}
    </View>
  );

  return (
    <Screen maxWidth={isCompact ? 'app' : 'wide'} scroll>
      <View style={[styles.profile, !isCompact && styles.profileDesk]}>
        <Avatar
          name={settings.name || 'Toi'}
          size={isCompact ? 72 : 64}
          preset={settings.avatarPreset}
          photoUri={settings.avatarPhoto}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>Profil</Eyebrow>
          <Title style={{ marginBottom: 4 }}>{settings.name || 'Profil'}</Title>
          <Body>
            {PROFIL_LABELS[settings.profil]}
            {settings.profil !== 'aucun'
              ? ` · ${DON_LABELS[settings.profil]} ${settings.donRate} %`
              : ''}
          </Body>
          {!isCompact ? (
            <Text style={styles.ratesInline}>
              Épargne {settings.epargneRate} % · Semence {settings.semenceRate} % · Revenu{' '}
              {fcfa(settings.monthlyIncome)}
            </Text>
          ) : null}
          <Button
            label={editAvatar ? 'Fermer' : isCompact ? 'Changer avatar ou photo' : 'Modifier le profil'}
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

      {isCompact ? (
        <>
          <SoftCard>
            <Row
              label={`Épargne ${settings.epargneRate} %`}
              value={`Semence ${settings.semenceRate} %`}
              icon="leaf-outline"
            />
            <Row
              label="Revenu mensuel"
              value={fcfa(settings.monthlyIncome)}
              icon="cash-outline"
              last
            />
            {monthPicker}
          </SoftCard>

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
            {creditYear.cost > 0 ? (
              <Body style={{ marginTop: 8 }}>Coût cumulé 12 mois : {fcfa(creditYear.cost)}</Body>
            ) : null}
            <Button
              label="Ajouter un crédit"
              variant="soft"
              icon="add"
              onPress={() => router.push('/credit')}
            />
          </SoftCard>

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
            <Button
              label="Nouvel objectif"
              variant="soft"
              icon="add"
              onPress={() => router.push('/objectif')}
            />
          </SoftCard>

          <SoftCard>
            <View style={styles.cardHead}>
              <IconBadge name="list-outline" bg={colors.ambreWash} color={colors.ambre} />
              <Eyebrow>Les 10 réflexes</Eyebrow>
            </View>
            <Body style={{ marginBottom: 12 }}>
              Habitudes quotidiennes, même esprit que le poster du pack.
            </Body>
            <Button
              label="Voir les 10 réflexes"
              variant="soft"
              icon="bookmark-outline"
              onPress={() => router.push('/reflexes' as Href)}
            />
          </SoftCard>

          <SoftCard style={{ marginBottom: 8 }}>
            <View style={styles.cardHead}>
              <IconBadge name="shield-checkmark-outline" />
              <Eyebrow>Sécurité & données</Eyebrow>
            </View>
            <Button label="Exporter une sauvegarde" icon="cloud-download-outline" onPress={backup} />
            <Button
              label="Exporter le rapport du mois (CSV)"
              variant="soft"
              icon="document-text-outline"
              onPress={exportMonthlyReport}
            />
            <Button
              label="Verrouiller l’app"
              variant="ghost"
              icon="lock-closed-outline"
              onPress={() => setUnlocked(false)}
            />
            <Text style={styles.foot}>Semence · V1 · Hors ligne · FCFA</Text>
          </SoftCard>
        </>
      ) : (
        <>
          <PageGrid cols={2} style={{ marginBottom: 8 }}>
            <PageCol>
              <SoftCard>
                <View style={styles.cardHead}>
                  <IconBadge name="leaf-outline" />
                  <Eyebrow>Répartition</Eyebrow>
                </View>
                <Row
                  label={`Épargne ${settings.epargneRate} %`}
                  value={`Semence ${settings.semenceRate} %`}
                  icon="leaf-outline"
                />
                <Row
                  label="Revenu mensuel"
                  value={fcfa(settings.monthlyIncome)}
                  icon="cash-outline"
                  last
                />
              </SoftCard>
            </PageCol>
            <PageCol>
              <SoftCard>{monthPicker}</SoftCard>
            </PageCol>
          </PageGrid>

          <PageGrid cols={3}>
            <PageCol>
              <SoftCard style={styles.deskPanel}>
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
                <Button
                  label="Ajouter"
                  variant="soft"
                  icon="add"
                  onPress={() => router.push('/dette')}
                />
              </SoftCard>
            </PageCol>

            <PageCol>
              <SoftCard style={styles.deskPanel}>
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
                {creditYear.cost > 0 ? (
                  <Body style={{ marginTop: 8 }}>
                    Coût cumulé 12 mois : {fcfa(creditYear.cost)}
                  </Body>
                ) : null}
                <Button
                  label="Ajouter un crédit"
                  variant="soft"
                  icon="add"
                  onPress={() => router.push('/credit')}
                />
              </SoftCard>
            </PageCol>

            <PageCol>
              <SoftCard style={styles.deskPanel}>
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
                <Button
                  label="Nouvel objectif"
                  variant="soft"
                  icon="add"
                  onPress={() => router.push('/objectif')}
                />
              </SoftCard>
            </PageCol>
          </PageGrid>

          <PageGrid cols={2}>
            <PageCol>
              <SoftCard>
                <View style={styles.cardHead}>
                  <IconBadge name="list-outline" bg={colors.ambreWash} color={colors.ambre} />
                  <Eyebrow>Les 10 réflexes</Eyebrow>
                </View>
                <Body style={{ marginBottom: 12 }}>
                  Habitudes quotidiennes, même esprit que le poster du pack.
                </Body>
                <Button
                  label="Voir les 10 réflexes"
                  variant="soft"
                  icon="bookmark-outline"
                  onPress={() => router.push('/reflexes' as Href)}
                />
              </SoftCard>
            </PageCol>
            <PageCol>
              <SoftCard style={{ marginBottom: 8 }}>
                <View style={styles.cardHead}>
                  <IconBadge name="shield-checkmark-outline" />
                  <Eyebrow>Sécurité & données</Eyebrow>
                </View>
                <Button
                  label="Exporter une sauvegarde"
                  icon="cloud-download-outline"
                  onPress={backup}
                />
                <Button
                  label="Exporter le rapport du mois (CSV)"
                  variant="soft"
                  icon="document-text-outline"
                  onPress={exportMonthlyReport}
                />
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
        </>
      )}
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
  profileDesk: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 18,
    marginBottom: 16,
  },
  deskPanel: {
    minHeight: 220,
  },
  ratesInline: {
    fontFamily: fonts.corpsSemi,
    fontSize: 14,
    color: colors.or,
    marginTop: 6,
    marginBottom: 8,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  monthBlock: {
    marginTop: 4,
  },
  monthCurrent: {
    fontFamily: fonts.corpsSemi,
    color: colors.or,
    marginBottom: 10,
  },
  monthChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthChip: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 110,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ruleFort,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  monthChipOn: {
    borderColor: colors.or,
    backgroundColor: colors.orWash,
  },
  monthChipTitle: {
    fontFamily: fonts.corpsBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 4,
  },
  monthChipTitleOn: {
    color: colors.panel,
  },
  monthChipHint: {
    fontFamily: fonts.corps,
    fontSize: 12,
    color: colors.ink3,
  },
  monthChipHintOn: {
    color: colors.or,
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
