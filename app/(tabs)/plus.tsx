import { Alert, ScrollView, Share, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { exportBackup, updateSettings } from '../../src/db/database';
import { DON_LABELS, PROFIL_LABELS } from '../../src/types';
import { fcfa } from '../../src/lib/money';
import { Body, Button, Eyebrow, Row, Screen, Section, Title } from '../../src/ui/primitives';
import { colors, fonts } from '../../src/theme/colors';

export default function PlusScreen() {
  const router = useRouter();
  const { settings, debts, credits, goals, creditYear, refresh, setUnlocked } = useApp();

  if (!settings) return null;

  const monthStartDay = settings.monthStartDay;

  async function backup() {
    try {
      const json = await exportBackup();
      await Share.share({
        message: json,
        title: 'Sauvegarde Semence',
      });
    } catch (e) {
      Alert.alert('Sauvegarde', String(e));
    }
  }

  async function changeMonthStart() {
    const next = monthStartDay === 1 ? 25 : monthStartDay === 25 ? 1 : 25;
    await updateSettings({ monthStartDay: next });
    await refresh();
    Alert.alert('Mois budgétaire', `Premier jour réglé sur le ${next}.`);
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Eyebrow>Réglages</Eyebrow>
        <Title>{settings.name || 'Profil'}</Title>
        <Body>
          {PROFIL_LABELS[settings.profil]}
          {settings.profil !== 'aucun' ? ` · ${DON_LABELS[settings.profil]} ${settings.donRate} %` : ''}
        </Body>
        <Body style={{ marginTop: 4 }}>
          Épargne {settings.epargneRate} % · Semence {settings.semenceRate} % · Revenu {fcfa(settings.monthlyIncome)}
        </Body>
        <Body style={{ marginTop: 4, marginBottom: 8 }}>Mois budgétaire à partir du {settings.monthStartDay}</Body>

        <Section>
          <Eyebrow>Dettes & créances</Eyebrow>
          {debts.length === 0 ? (
            <Body>Aucune dette en cours.</Body>
          ) : (
            debts.map((d, i) => (
              <Row
                key={d.id}
                label={`${d.direction === 'je_dois' ? 'Je dois à' : 'Me doit'} ${d.person}`}
                value={fcfa(d.remaining)}
                tone={d.direction === 'je_dois' ? 'rouge' : 'vert'}
                last={i === debts.length - 1}
              />
            ))
          )}
          <Button label="Ajouter une dette" variant="soft" onPress={() => router.push('/dette')} />
        </Section>

        <Section>
          <Eyebrow>Crédits</Eyebrow>
          {credits.length === 0 ? (
            <Body>Aucun crédit enregistré.</Body>
          ) : (
            credits.map((c, i) => (
              <Row
                key={c.id}
                label={`${c.label} · surcoût ${fcfa(c.totalDue - c.received)}`}
                value={fcfa(c.remaining)}
                tone="rouge"
                last={i === credits.length - 1}
              />
            ))
          )}
          {creditYear.cost > 0 && (
            <Body style={{ marginTop: 8 }}>Coût cumulé 12 mois : {fcfa(creditYear.cost)}</Body>
          )}
          <Button label="Ajouter un crédit" variant="soft" onPress={() => router.push('/credit')} />
        </Section>

        <Section>
          <Eyebrow>Objectifs d’épargne</Eyebrow>
          {goals.length === 0 ? (
            <Body>Aucun objectif.</Body>
          ) : (
            goals.map((g, i) => (
              <Row
                key={g.id}
                label={g.name}
                value={`${fcfa(g.current)} / ${fcfa(g.target)}`}
                tone="vert"
                last={i === goals.length - 1}
              />
            ))
          )}
          <Button label="Nouvel objectif" variant="soft" onPress={() => router.push('/objectif')} />
        </Section>

        <Section last>
          <Eyebrow>Sécurité & données</Eyebrow>
          <Button label="Exporter une sauvegarde" onPress={backup} />
          <Button label="Changer le jour de début de mois" variant="ghost" onPress={changeMonthStart} />
          <Button label="Verrouiller l’app" variant="ghost" onPress={() => setUnlocked(false)} />
          <Text style={styles.foot}>Semence · V1 · Hors ligne · FCFA</Text>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 48,
  },
  foot: {
    textAlign: 'center',
    fontFamily: fonts.corps,
    color: colors.ink3,
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 28,
  },
});
