import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { fcfa } from '../lib/money';
import { Body, Eyebrow, IconBadge, SoftCard } from './primitives';

export type EnvelopeInsight = {
  label: string;
  spent: number;
  budget: number;
};

export function DashboardInsights({
  daysLeft,
  resteAVivre,
  envelopes,
  closed,
  cycleLabel,
}: {
  daysLeft: number;
  resteAVivre: number;
  envelopes: EnvelopeInsight[];
  closed?: boolean;
  cycleLabel?: string;
}) {
  const over = envelopes.filter((e) => e.budget > 0 && e.spent > e.budget);
  const near = envelopes.filter((e) => {
    if (e.budget <= 0) return false;
    const pct = e.spent / e.budget;
    return pct >= 0.85 && pct <= 1;
  });
  const courant = envelopes.find((e) => e.label === 'Courant');

  return (
    <SoftCard>
      <View style={styles.head}>
        <IconBadge name="bulb-outline" bg={colors.ambreWash} color={colors.ambre} />
        <Eyebrow>{closed ? 'Lecture du cycle' : 'Lecture du mois'}</Eyebrow>
      </View>

      {closed ? (
        <>
          <Text style={styles.line}>
            {cycleLabel ? `${cycleLabel} est clos. ` : 'Ce cycle est clos. '}
            Courant consommé : <Text style={styles.strong}>{fcfa(Math.max(0, envelopes.find((e) => e.label === 'Courant')?.spent ?? 0))}</Text>
            {' sur '}
            <Text style={styles.strong}>{fcfa(envelopes.find((e) => e.label === 'Courant')?.budget ?? 0)}</Text>.
          </Text>
          <Text style={[styles.line, { marginTop: 8 }]}>
            Il restait <Text style={styles.strong}>{fcfa(resteAVivre)}</Text> d’enveloppe courant à la clôture.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.line}>
            Reste à vivre ce mois : <Text style={styles.strong}>{fcfa(resteAVivre)}</Text>
            {' sur '}
            <Text style={styles.strong}>{fcfa(courant?.budget ?? 0)}</Text> de courant.
          </Text>
          <Text style={[styles.line, { marginTop: 8 }]}>
            {daysLeft} jour{daysLeft > 1 ? 's' : ''} restants dans le cycle.
          </Text>
        </>
      )}

      {over.length > 0 ? (
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>Dépassement</Text>
          {over.map((e) => (
            <Text key={e.label} style={styles.alertText}>
              {e.label} : {fcfa(e.spent)} sur {fcfa(e.budget)} (+{fcfa(e.spent - e.budget)})
            </Text>
          ))}
        </View>
      ) : null}

      {near.length > 0 && over.length === 0 ? (
        <View style={styles.warn}>
          <Text style={styles.warnTitle}>Attention</Text>
          {near.map((e) => (
            <Text key={e.label} style={styles.warnText}>
              {e.label} à {Math.round((e.spent / e.budget) * 100)} % du budget
            </Text>
          ))}
        </View>
      ) : null}

      {over.length === 0 && near.length === 0 ? (
        <Body style={{ marginTop: 10 }}>Aucune enveloppe en alerte pour l’instant.</Body>
      ) : null}
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  line: {
    fontFamily: fonts.corps,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
  },
  strong: {
    fontFamily: fonts.chiffreMed,
    color: colors.ink,
  },
  alert: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.rougeWash,
  },
  alertTitle: {
    fontFamily: fonts.corpsBold,
    color: colors.rouge,
    marginBottom: 6,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  alertText: {
    fontFamily: fonts.corps,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 4,
  },
  warn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.ambreWash,
  },
  warnTitle: {
    fontFamily: fonts.corpsBold,
    color: colors.ambre,
    marginBottom: 6,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  warnText: {
    fontFamily: fonts.corps,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 4,
  },
});
