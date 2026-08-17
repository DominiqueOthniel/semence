import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CURRENCIES, PHONE_CODES, type CurrencyCode } from '../lib/locale';
import { colors, fonts, radius } from '../theme/colors';
import { Label } from './primitives';
import { TOUCH } from '../hooks/useLayout';

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
}) {
  return (
    <View style={styles.block}>
      <Label>Devise</Label>
      <View style={styles.wrap} accessibilityRole="radiogroup">
        {CURRENCIES.map((c) => {
          const active = c.code === value;
          return (
            <Pressable
              key={c.code}
              onPress={() => onChange(c.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={c.label}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipOn,
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text style={[styles.chipCode, active && styles.chipCodeOn]}>{c.suffix}</Text>
              <Text style={[styles.chipHint, active && styles.chipHintOn]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PhoneField({
  code,
  number,
  onChangeCode,
  onChangeNumber,
  onBlurNumber,
}: {
  code: string;
  number: string;
  onChangeCode: (code: string) => void;
  onChangeNumber: (value: string) => void;
  onBlurNumber?: () => void;
}) {
  return (
    <View style={styles.block}>
      <Label>Numéro de téléphone</Label>
      <View style={styles.wrap} accessibilityRole="radiogroup">
        {PHONE_CODES.map((item) => {
          const active = item.code === code;
          return (
            <Pressable
              key={item.code}
              onPress={() => onChangeCode(item.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.country} +${item.code}`}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipOn,
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text style={[styles.chipCode, active && styles.chipCodeOn]}>+{item.code}</Text>
              <Text style={[styles.chipHint, active && styles.chipHintOn]}>{item.country}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.phoneRow}>
        <View style={styles.prefixBox}>
          <Text style={styles.prefix}>+{code}</Text>
        </View>
        <TextInput
          value={number}
          onChangeText={(v) => onChangeNumber(v.replace(/[^\d]/g, ''))}
          onBlur={onBlurNumber}
          keyboardType="phone-pad"
          placeholder="6XX XX XX XX"
          placeholderTextColor={colors.ink3}
          accessibilityLabel="Numéro local"
          style={styles.phoneInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 16,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ruleFort,
    backgroundColor: colors.surface,
  },
  chipOn: {
    borderColor: colors.or,
    backgroundColor: colors.orWash,
  },
  chipCode: {
    fontFamily: fonts.corpsBold,
    fontSize: 13,
    color: colors.ink,
  },
  chipCodeOn: {
    color: colors.panel,
  },
  chipHint: {
    marginTop: 2,
    fontFamily: fonts.corps,
    fontSize: 11,
    color: colors.ink3,
  },
  chipHintOn: {
    color: colors.or,
  },
  phoneRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefixBox: {
    minHeight: TOUCH,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefix: {
    fontFamily: fonts.chiffreMed,
    fontSize: 15,
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: TOUCH,
    fontSize: 16,
    fontFamily: fonts.corpsMed,
    color: colors.ink,
  },
});
