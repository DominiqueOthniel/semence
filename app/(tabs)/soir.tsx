import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../src/store/AppContext';
import { addExpense, markEveningDone } from '../../src/db/database';
import { currencySuffix, fcfa, moneyKeyboard, parseFcfaInput, sanitizeMoneyInput } from '../../src/lib/money';
import { notify } from '../../src/lib/notify';
import { useLayout } from '../../src/hooks/useLayout';
import {
  Amount,
  Avatar,
  Body,
  Button,
  Chip,
  Eyebrow,
  Field,
  IconBadge,
  PageCol,
  PageGrid,
  Screen,
  SoftCard,
  Title,
} from '../../src/ui/primitives';
import { versetDuJour } from '../../src/lib/versets';
import { colors, fonts, radius } from '../../src/theme/colors';
import { MascotTip } from '../../src/ui/Mascot';
import { MASCOT_COPY, mascotStage } from '../../src/lib/mascot';

const FAV_ICONS = ['car-outline', 'restaurant-outline', 'phone-portrait-outline', 'cafe-outline'] as const;

type DraftLine = { id: string; label: string; amount: number };

export default function SoirScreen() {
  const { isCompact } = useLayout();
  const { settings, accounts, favorites, envelopes, eveningDone, streak, goals, refresh, cycle, goToCurrentCycle } =
    useApp();
  const [drafts, setDrafts] = useState<DraftLine[]>([]);
  const [extra, setExtra] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneLocal, setDoneLocal] = useState(false);
  const [editAgain, setEditAgain] = useState(false);

  const draftTotal = useMemo(
    () => drafts.reduce((s, d) => s + d.amount, 0) + parseFcfaInput(extra),
    [drafts, extra],
  );

  useEffect(() => {
    if (cycle.status !== 'en_cours') goToCurrentCycle();
  }, [cycle.status, goToCurrentCycle]);

  if (!settings || !envelopes) return null;

  const verset = versetDuJour(settings.profil);
  const account = accounts[0];
  const locked = (eveningDone || doneLocal) && !editAgain;

  const previewReste = Math.max(0, envelopes.resteAVivre - draftTotal);

  function addFavorite(label: string, value: number) {
    setDrafts((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, label, amount: value }]);
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  async function finish() {
    if (!account) {
      notify('Compte manquant', 'Ajoute un compte avant de noter le soir.');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      for (const line of drafts) {
        await addExpense(account.id, line.amount, 'courant', line.label);
      }
      const extraAmount = parseFcfaInput(extra);
      if (extraAmount > 0) {
        await addExpense(account.id, extraAmount, 'courant', note.trim() || 'Dépense du soir');
      }
      await markEveningDone(draftTotal, note.trim());
      setDoneLocal(true);
      setEditAgain(false);
      setDrafts([]);
      setExtra('');
      setNote('');
      await refresh();
    } catch (e) {
      notify('Soir', String(e));
    } finally {
      setBusy(false);
    }
  }

  const timeLabel = `${String(settings.eveningHour).padStart(2, '0')} h ${String(
    settings.eveningMinute,
  ).padStart(2, '0')}`;

  if (locked) {
    return (
      <Screen maxWidth={isCompact ? 'form' : 'wide'} scroll>
        {isCompact ? (
          <View style={styles.doneWrap}>
            <View style={styles.doneCard}>
              <View style={styles.doneHead}>
                <Avatar
                  name={settings.name || 'Toi'}
                  size={64}
                  preset={settings.avatarPreset}
                  photoUri={settings.avatarPhoto}
                />
                <IconBadge name="checkmark-circle" size={44} />
              </View>
              <Eyebrow>Rendez-vous du soir</Eyebrow>
              <Title>C’est noté.</Title>
              <Body>
                {streak > 0
                  ? `${streak} soir${streak > 1 ? 's' : ''} d’affilée.`
                  : 'À demain, même heure.'}
              </Body>
              <SoftCard style={{ marginTop: 20 }}>
                <Text style={styles.verset}>« {verset.text} »</Text>
                <Text style={styles.ref}>{verset.ref}</Text>
              </SoftCard>
              <Button
                label="Corriger ou ajouter encore"
                variant="ghost"
                icon="create-outline"
                onPress={() => setEditAgain(true)}
              />
            </View>
          </View>
        ) : (
          <PageGrid cols={2}>
            <PageCol flex={1.1}>
              <View style={styles.donePanel}>
                <View style={styles.doneHead}>
                  <Avatar
                    name={settings.name || 'Toi'}
                    size={72}
                    preset={settings.avatarPreset}
                    photoUri={settings.avatarPhoto}
                  />
                  <IconBadge name="checkmark-circle" size={48} />
                </View>
                <Eyebrow>Rendez-vous du soir</Eyebrow>
                <Title>C’est noté.</Title>
                <Body>
                  {streak > 0
                    ? `${streak} soir${streak > 1 ? 's' : ''} d’affilée.`
                    : 'À demain, même heure.'}
                </Body>
                <Button
                  label="Corriger ou ajouter encore"
                  variant="ghost"
                  icon="create-outline"
                  onPress={() => setEditAgain(true)}
                />
              </View>
            </PageCol>
            <PageCol flex={0.9}>
              <View style={styles.previewPanel}>
                <Text style={styles.previewLabel}>Continuité</Text>
                <Text style={styles.previewAmount}>
                  {streak > 0 ? `${streak}` : '1'}
                </Text>
                <Text style={styles.previewMeta}>
                  {streak > 1 ? 'soirs d’affilée' : 'soir noté'}
                </Text>
                <View style={styles.previewVerse}>
                  <Text style={styles.versetLight}>« {verset.text} »</Text>
                  <Text style={styles.refLight}>{verset.ref}</Text>
                </View>
              </View>
            </PageCol>
          </PageGrid>
        )}
      </Screen>
    );
  }

  const formBlock = (
    <>
      <MascotTip
        mood="evening"
        stage={mascotStage(goals)}
        title={MASCOT_COPY.evening.title}
        text={MASCOT_COPY.evening.text}
      />
      {isCompact ? (
        <View style={styles.head}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>{timeLabel}</Eyebrow>
            <Title>Qu’as-tu dépensé aujourd’hui ?</Title>
          </View>
          <Avatar
            name={settings.name || 'Toi'}
            size={48}
            preset={settings.avatarPreset}
            photoUri={settings.avatarPhoto}
          />
        </View>
      ) : null}
      <Body style={{ marginBottom: 18 }}>
        Choisis tes dépenses, vérifie le total, puis valide. Rien n’est enregistré avant « Terminer ».
      </Body>

      <Eyebrow>Montants habituels</Eyebrow>
      <View style={styles.favs}>
        {favorites.map((f, i) => (
          <Chip
            key={f.id}
            icon={FAV_ICONS[i % FAV_ICONS.length]}
            label={`${f.label} · ${fcfa(f.amount)}`}
            onPress={() => addFavorite(f.label, f.amount)}
          />
        ))}
      </View>

      {drafts.length > 0 ? (
        <SoftCard>
          <Eyebrow>À enregistrer</Eyebrow>
          {drafts.map((d) => (
            <View key={d.id} style={styles.draftRow}>
              <Text style={styles.draftLabel}>{d.label}</Text>
              <Text style={styles.draftAmount}>{fcfa(d.amount)}</Text>
              <Pressable onPress={() => removeDraft(d.id)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.draftRemove}>Retirer</Text>
              </Pressable>
            </View>
          ))}
        </SoftCard>
      ) : null}

      <Field
        label={`Autre montant (${currencySuffix()})`}
        value={extra}
        onChangeText={(v) => setExtra(sanitizeMoneyInput(v))}
        keyboardType={moneyKeyboard()}
        placeholder="0"
        hint="Optionnel. S’ajoute au total ci-dessus."
      />
      <Field label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Taxi, marché…" />

      {isCompact ? (
        <SoftCard>
          <View style={styles.cardHead}>
            <IconBadge name="calculator-outline" bg={colors.ambreWash} color={colors.ambre} />
            <Eyebrow>Total du soir</Eyebrow>
          </View>
          <Amount>{fcfa(draftTotal)}</Amount>
          <Body style={{ marginTop: 10 }}>Reste à vivre ce mois après validation</Body>
          <Amount large style={{ marginTop: 4 }}>
            {fcfa(previewReste)}
          </Amount>
        </SoftCard>
      ) : null}

      {isCompact ? (
        <SoftCard>
          <Text style={styles.verset}>« {verset.text} »</Text>
          <Text style={styles.ref}>{verset.ref}</Text>
        </SoftCard>
      ) : null}

      <Button
        label={busy ? 'Enregistrement…' : 'Terminer le soir'}
        icon="checkmark-circle-outline"
        onPress={finish}
        disabled={busy}
      />
      {editAgain ? (
        <Button label="Annuler" variant="ghost" onPress={() => setEditAgain(false)} />
      ) : null}
    </>
  );

  const previewPanel = (
    <View style={styles.previewPanel}>
      <Text style={styles.previewLabel}>Total du soir</Text>
      <Text style={styles.previewAmount}>{fcfa(draftTotal)}</Text>
      <Text style={styles.previewMeta}>Reste à vivre ce mois</Text>
      <Text style={styles.previewPerDay}>{fcfa(previewReste)}</Text>
      <View style={styles.previewVerse}>
        <Text style={styles.versetLight}>« {verset.text} »</Text>
        <Text style={styles.refLight}>{verset.ref}</Text>
      </View>
    </View>
  );

  if (isCompact) {
    return (
      <Screen maxWidth="form" scroll keyboard>
        {formBlock}
      </Screen>
    );
  }

  return (
    <Screen maxWidth="wide" scroll keyboard>
      <View style={styles.deskHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>Rituel · {timeLabel}</Eyebrow>
          <Title>Qu’as-tu dépensé aujourd’hui ?</Title>
        </View>
        <Avatar
          name={settings.name || 'Toi'}
          size={52}
          preset={settings.avatarPreset}
          photoUri={settings.avatarPhoto}
        />
      </View>
      <PageGrid cols={2}>
        <PageCol flex={1.25}>{formBlock}</PageCol>
        <PageCol flex={0.85}>
          <View style={styles.previewSticky}>{previewPanel}</View>
        </PageCol>
      </PageGrid>
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
  deskHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  doneWrap: {
    width: '100%',
  },
  doneWrapDesk: {
    alignItems: 'center',
    paddingTop: 24,
  },
  doneCard: {
    width: '100%',
    maxWidth: 520,
  },
  donePanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 24,
    minHeight: 320,
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
    marginBottom: 16,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
  },
  draftLabel: {
    flex: 1,
    fontFamily: fonts.corps,
    fontSize: 15,
    color: colors.ink,
  },
  draftAmount: {
    fontFamily: fonts.chiffre,
    fontSize: 14,
    color: colors.ink2,
  },
  draftRemove: {
    fontFamily: fonts.corpsSemi,
    fontSize: 13,
    color: colors.rouge,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  previewSticky: {
    top: 12,
  },
  previewPanel: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(196,137,42,0.22)',
  },
  previewLabel: {
    fontFamily: fonts.corpsSemi,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ambre,
    marginBottom: 10,
  },
  previewAmount: {
    fontFamily: fonts.chiffreMed,
    fontSize: 34,
    color: colors.white,
    marginBottom: 16,
  },
  previewMeta: {
    fontFamily: fonts.corps,
    fontSize: 13,
    color: colors.inkOnDark,
    marginBottom: 4,
  },
  previewPerDay: {
    fontFamily: fonts.chiffreMed,
    fontSize: 26,
    color: colors.white,
    marginTop: 4,
    marginBottom: 4,
  },
  previewVerse: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.ruleOnDark,
  },
  verset: {
    fontFamily: fonts.displayItalic,
    fontSize: 18,
    lineHeight: 28,
    color: colors.ink,
  },
  versetLight: {
    fontFamily: fonts.displayItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  ref: {
    marginTop: 10,
    fontFamily: fonts.corpsSemi,
    color: colors.ink3,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  refLight: {
    marginTop: 10,
    fontFamily: fonts.corpsSemi,
    color: colors.ambre,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
