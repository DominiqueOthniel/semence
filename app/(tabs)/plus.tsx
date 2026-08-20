import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { exportBackup, updateSettings, applyCurrencyChange } from '../../src/db/database';
import { DON_LABELS, PROFIL_LABELS } from '../../src/types';
import { formatPhone, type CurrencyCode } from '../../src/lib/locale';
import { goalPace } from '../../src/lib/goals';
import { currencySuffix, fcfa, setActiveCurrency, splitIncome } from '../../src/lib/money';
import { BudgetEditor } from '../../src/ui/BudgetEditor';
import { CurrencyPicker, PhoneField } from '../../src/ui/LocaleFields';
import { notify } from '../../src/lib/notify';
import { buildMonthlyCsvReport, reportFileName } from '../../src/lib/report';
import { shareMonthlyPdf } from '../../src/lib/shareReport';
import { MASCOT_COPY, incomeToday, mascotStage, reachedGoal } from '../../src/lib/mascot';
import { useLayout } from '../../src/hooks/useLayout';
import {
  Avatar,
  Body,
  Button,
  Eyebrow,
  IconBadge,
  PageCol,
  PageGrid,
  ProgressBar,
  Row,
  Screen,
  SoftCard,
  Title,
} from '../../src/ui/primitives';
import { AvatarPicker, type AvatarChoice } from '../../src/ui/AvatarPicker';
import { colors, fonts, radius } from '../../src/theme/colors';
import { ClockStamp } from '../../src/ui/ClockStamp';
import { MascotTip } from '../../src/ui/Mascot';

const MONTH_OPTS = [
  { day: 1, title: 'Le 1er', hint: 'Mois civil' },
  { day: 25, title: 'Le 25', hint: 'Jour de paie' },
  { day: 28, title: 'Le 28', hint: 'Fin de mois' },
] as const;

export default function PlusScreen() {
  const router = useRouter();
  const { isCompact } = useLayout();
  const {
    settings,
    debts,
    credits,
    goals,
    creditYear,
    refresh,
    lock,
    resetProfile,
    issueRecoveryCode,
    yearTransactions,
    accounts,
    cycle,
    transactions,
  } = useApp();
  const [editAvatar, setEditAvatar] = useState(false);
  const [draftAvatar, setDraftAvatar] = useState<AvatarChoice | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingMonth, setSavingMonth] = useState(false);
  const [freshRecovery, setFreshRecovery] = useState<string | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(settings?.phone ?? '');

  useEffect(() => {
    if (settings) setPhoneDraft(settings.phone);
  }, [settings?.phone]);

  if (!settings) return null;

  const split = splitIncome(
    settings.monthlyIncome,
    settings.donRate,
    settings.epargneRate,
    settings.semenceRate,
    settings.currency,
  );

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

  async function exportMonthlyPdf() {
    if (!settings) return;
    try {
      await shareMonthlyPdf({
        settings,
        transactions: yearTransactions,
        accounts,
        debts,
        credits,
        goals,
        cycle,
      });
    } catch (e) {
      notify('Synthèse PDF', String(e));
    }
  }

  async function exportMonthlyReport() {
    if (!settings) return;
    try {
      const csv = buildMonthlyCsvReport({
        settings,
        transactions: yearTransactions,
        accounts,
        debts,
        credits,
        goals,
        cycle,
      });
      await Share.share({
        message: csv,
        title: reportFileName(cycle.key, 'csv'),
      });
    } catch (e) {
      notify('Journal CSV', String(e));
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

  async function saveBudget(next: {
    monthlyIncome: number;
    donRate: number;
    epargneRate: number;
    semenceRate: number;
  }) {
    setSavingBudget(true);
    try {
      await updateSettings(next);
      await refresh();
      notify('Budget', 'Répartition mise à jour pour ce mois.');
    } catch (e) {
      notify('Budget', String(e));
    } finally {
      setSavingBudget(false);
    }
  }

  const budgetCard = (
    <SoftCard>
      <BudgetEditor settings={settings} busy={savingBudget} onSave={saveBudget} />
      {isCompact ? monthPicker : null}
    </SoftCard>
  );

  const reached = reachedGoal(goals);
  const lastIncome = incomeToday(transactions);
  const companion = reached ? (
    <MascotTip
      mood="goal"
      stage={mascotStage(goals)}
      title={MASCOT_COPY.goal.title}
      text={MASCOT_COPY.goal.text}
    />
  ) : lastIncome ? (
    <MascotTip
      mood="income"
      stage={mascotStage(goals)}
      title={MASCOT_COPY.income.title}
      text={MASCOT_COPY.income.text}
    />
  ) : null;

  const goalsCard = (
    <SoftCard style={!isCompact ? styles.deskPanel : undefined}>
      <View style={styles.cardHead}>
        <IconBadge name="flag-outline" bg={colors.ambreWash} color={colors.ambre} />
        <Eyebrow>Objectifs</Eyebrow>
      </View>
      {goals.length === 0 ? (
        <Body>Aucun objectif. Fixe un budget et une durée pour y aller mois après mois.</Body>
      ) : (
        goals.map((g) => {
          const pace = goalPace(g);
          return (
            <View key={g.id} style={styles.goalBlock}>
              <Row
                label={g.name}
                value={`${fcfa(g.current)} / ${fcfa(g.target)}`}
                tone="vert"
                icon="flag-outline"
                last
              />
              <ProgressBar value={g.current} max={g.target} color={colors.ambre} />
              <Body style={{ marginTop: 8 }}>
                {pace.monthly > 0
                  ? `${fcfa(pace.monthly)} / mois${pace.monthsLeft ? ` · ${pace.monthsLeft} mois restants` : ''}`
                  : g.dueDate
                    ? `Échéance ${g.dueDate}`
                    : 'Durée libre'}
              </Body>
              <Button
                label="Verser ou modifier"
                variant="soft"
                icon="create-outline"
                compact
                onPress={() => router.push({ pathname: '/objectif', params: { id: String(g.id) } })}
              />
            </View>
          );
        })
      )}
      <Button
        label="Nouvel objectif"
        variant="soft"
        icon="add"
        onPress={() => router.push('/objectif')}
      />
    </SoftCard>
  );

  async function createRecovery() {
    if (sessionBusy) return;
    setSessionBusy(true);
    try {
      const code = await issueRecoveryCode();
      setFreshRecovery(code);
    } catch (e) {
      notify('Code de secours', String(e));
    } finally {
      setSessionBusy(false);
    }
  }

  function askNewProfile() {
    Alert.alert(
      'Nouveau profil',
      'Ce carnet local sera vidé (comptes, opérations, PIN). Exporte une sauvegarde avant si tu veux le retrouver plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer et recommencer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSessionBusy(true);
              try {
                await resetProfile();
              } catch (e) {
                notify('Profil', String(e));
                setSessionBusy(false);
              }
            })();
          },
        },
      ],
    );
  }

  const sessionCard = (
    <>
      {freshRecovery ? (
        <View style={styles.recoveryBox}>
          <Eyebrow>Note ce code maintenant</Eyebrow>
          <Text selectable style={styles.recoveryCode}>
            {freshRecovery}
          </Text>
          <Body>Il ne sera plus affiché. Il sert si tu oublies ton PIN.</Body>
          <Button label="J’ai noté" variant="soft" icon="checkmark" onPress={() => setFreshRecovery(null)} />
        </View>
      ) : null}
      <Button
        label="Se déconnecter"
        variant="soft"
        icon="log-out-outline"
        onPress={lock}
      />
      {!settings.recoveryHash ? (
        <Button
          label={sessionBusy ? 'Création…' : 'Créer un code de secours'}
          variant="ghost"
          icon="key-outline"
          onPress={() => void createRecovery()}
          disabled={sessionBusy}
        />
      ) : (
        <Button
          label={sessionBusy ? 'Création…' : 'Remplacer le code de secours'}
          variant="ghost"
          icon="refresh-outline"
          onPress={() => void createRecovery()}
          disabled={sessionBusy}
        />
      )}
      <Button
        label="Nouveau profil"
        variant="ghost"
        icon="person-add-outline"
        onPress={askNewProfile}
        disabled={sessionBusy}
      />
    </>
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
          <View style={{ marginBottom: 8 }}>
            <ClockStamp variant="muted" compact />
          </View>
          <Body>
            {PROFIL_LABELS[settings.profil]}
            {settings.profil !== 'aucun'
              ? ` · ${DON_LABELS[settings.profil]} ${fcfa(split.don)}`
              : ''}
            {settings.phone
              ? ` · ${formatPhone(settings.phoneCode, settings.phone)}`
              : ''}
          </Body>
          <Text style={styles.ratesInline}>
            Épargne {fcfa(split.epargne)} · Semence {fcfa(split.semence)} · Revenu{' '}
            {fcfa(settings.monthlyIncome)}
          </Text>
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

      <SoftCard>
        <View style={styles.cardHead}>
          <IconBadge name="globe-outline" />
          <Eyebrow>Pays et devise</Eyebrow>
        </View>
        <CurrencyPicker
          value={(settings.currency as CurrencyCode) || 'XAF'}
          onChange={(next) => {
            void (async () => {
              setActiveCurrency(next);
              await applyCurrencyChange(next);
              await refresh();
            })();
          }}
        />
        <Body style={{ marginTop: 8 }}>
          Les montants déjà notés sont convertis. Le FCFA suit la parité 655,957 pour 1 €. Les autres devises
          utilisent un taux de référence hors ligne.
        </Body>
        <PhoneField
          code={settings.phoneCode || '237'}
          number={phoneDraft}
          onChangeCode={(next) => {
            void (async () => {
              await updateSettings({ phoneCode: next, phone: phoneDraft });
              await refresh();
            })();
          }}
          onChangeNumber={setPhoneDraft}
          onBlurNumber={() => {
            if (phoneDraft === settings.phone) return;
            void (async () => {
              await updateSettings({ phone: phoneDraft });
              await refresh();
            })();
          }}
        />
      </SoftCard>

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
          {companion}
          {budgetCard}

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

          {goalsCard}

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
              label="Exporter la synthèse (PDF)"
              icon="document-outline"
              onPress={() => void exportMonthlyPdf()}
            />
            <Button
              label="Exporter le journal (CSV)"
              variant="soft"
              icon="document-text-outline"
              onPress={exportMonthlyReport}
            />
            {sessionCard}
            <Text style={styles.foot}>Semence · V1 · Hors ligne · {currencySuffix()}</Text>
          </SoftCard>
        </>
      ) : (
        <>
          <PageGrid cols={2} style={{ marginBottom: 8 }}>
            <PageCol>
              {companion}
              {budgetCard}
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

            <PageCol>{goalsCard}</PageCol>
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
                  label="Exporter la synthèse (PDF)"
                  icon="document-outline"
                  onPress={() => void exportMonthlyPdf()}
                />
                <Button
                  label="Exporter le journal (CSV)"
                  variant="soft"
                  icon="document-text-outline"
                  onPress={exportMonthlyReport}
                />
                {sessionCard}
                <Text style={styles.foot}>Semence · V1 · Hors ligne · {currencySuffix()}</Text>
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
  goalBlock: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
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
  recoveryBox: {
    marginBottom: 14,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.ambreWash,
    borderWidth: 1,
    borderColor: '#E8D6AE',
    gap: 8,
  },
  recoveryCode: {
    fontFamily: fonts.chiffreMed,
    fontSize: 26,
    letterSpacing: 3,
    color: colors.ink,
    textAlign: 'center',
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
