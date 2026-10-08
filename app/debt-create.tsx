import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { createDebt, getPeople, type Person } from '@/core/api/debts-api';
import { getGroups, type Group } from '@/core/api/social-api';
import { useAuth } from '@/core/auth/auth-context';
import { formatCents, isValidSplit, parseAmountToCents, remainingCents, type Share } from '@/core/finance/split';
import { palette, radius } from '@/constants/Colors';

const categories = ['FOOD', 'RENT', 'TRANSPORT', 'TRAVEL', 'LOAN', 'OTHER'];

export default function DebtCreate() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { authorizedRequest } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextPeople, nextGroups] = await Promise.all([
        authorizedRequest(getPeople),
        authorizedRequest(getGroups),
      ]);
      setPeople(nextPeople);
      setGroups(nextGroups);
    } catch {
      Alert.alert('Não foi possível carregar participantes', 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest]);
  useEffect(() => { void load(); }, [load]);

  const payer = useMemo(() => people.find(person => person.isCurrentUser), [people]);
  const totalCents = parseAmountToCents(totalInput);
  const shares: Share[] = selected.map(personId => ({
    personId,
    amountCents: parseAmountToCents(amounts[personId] ?? '') ?? 0,
  }));
  const missingCents = totalCents === null ? 0 : remainingCents(totalCents, shares);
  const splitIsValid = totalCents !== null && isValidSplit(totalCents, shares);

  /** Rewrites every selected participant with an equal share of the current total. */
  function distributeEqually(personIds: string[], cents: number | null) {
    if (cents === null || personIds.length === 0) return;
    const equal = Math.floor(cents / personIds.length);
    const remainder = cents - equal * personIds.length;
    setAmounts(current => {
      const next = { ...current };
      personIds.forEach((personId, index) => {
        next[personId] = formatCents(equal + (index < remainder ? 1 : 0));
      });
      return next;
    });
  }

  function toggle(personId: string) {
    const nextSelected = selected.includes(personId)
      ? selected.filter(id => id !== personId)
      : [...selected, personId];
    setSelected(nextSelected);
    distributeEqually(nextSelected, totalCents);
  }

  function changeTotal(value: string) {
    setTotalInput(value);
    distributeEqually(selected, parseAmountToCents(value));
  }

  async function save() {
    if (!description.trim() || totalCents === null || !payer || !splitIsValid) {
      Alert.alert('Revise a dívida', 'Informe descrição, valor total e uma divisão que some exatamente o total.');
      return;
    }
    setSaving(true);
    try {
      await authorizedRequest(token => createDebt(token, {
        description: description.trim(),
        totalAmount: totalCents / 100,
        paidByPersonId: payer.id,
        groupId,
        category,
        dueDate: null,
        shares: shares.map(share => ({ personId: share.personId, amount: share.amountCents / 100 })),
      }));
      router.replace('/debts');
    } catch {
      Alert.alert('Não foi possível criar', 'Confira os participantes e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={[s.back, { color: colors.primary }]}>‹ Voltar</Text>
      </Pressable>
      <Text style={[s.title, { color: colors.text }]}>Nova dívida</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : (
        <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: Jantar de sexta" colors={colors} />
          <Field label="Valor total" value={totalInput} onChangeText={changeTotal} keyboardType="decimal-pad" placeholder="0,00" colors={colors} />

          <Text style={[s.label, { color: colors.textMuted }]}>Categoria</Text>
          <View style={s.wrap}>
            {categories.map(value => (
              <Pressable key={value} onPress={() => setCategory(value)} style={[s.chip, { backgroundColor: category === value ? colors.primary : colors.primarySoft }]}>
                <Text style={{ color: category === value ? '#fff' : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.label, { color: colors.textMuted }]}>Grupo (opcional)</Text>
          <View style={s.wrap}>
            <Pressable onPress={() => setGroupId(null)} style={[s.chip, { backgroundColor: groupId === null ? colors.primary : colors.primarySoft }]}>
              <Text style={{ color: groupId === null ? '#fff' : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>Sem grupo</Text>
            </Pressable>
            {groups.map(group => (
              <Pressable key={group.id} onPress={() => setGroupId(group.id)} style={[s.chip, { backgroundColor: groupId === group.id ? colors.primary : colors.primarySoft }]}>
                <Text style={{ color: groupId === group.id ? '#fff' : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{group.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.label, { color: colors.textMuted }]}>Quem participa?</Text>
          {people.map(person => {
            const active = selected.includes(person.id);
            return (
              <View key={person.id} style={[s.personRow, { borderColor: colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }]}>
                <Pressable onPress={() => toggle(person.id)} style={s.personToggle}>
                  <Text style={[s.personName, { color: colors.text }]}>
                    {person.name}{person.isCurrentUser ? ' (você)' : ''}
                  </Text>
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{active ? '✓' : '+'}</Text>
                </Pressable>
                {active ? (
                  <TextInput
                    value={amounts[person.id] ?? ''}
                    onChangeText={value => setAmounts(current => ({ ...current, [person.id]: value }))}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    style={[s.amountInput, { borderColor: colors.border, color: colors.text }]}
                  />
                ) : null}
              </View>
            );
          })}

          {totalCents === null ? (
            <Text style={[s.hint, { color: colors.textMuted }]}>Informe o valor total para dividir.</Text>
          ) : splitIsValid ? (
            <Text style={[s.hint, { color: colors.positive }]}>Divisão fecha exatamente com {formatCents(totalCents)}.</Text>
          ) : (
            <Text style={[s.hint, { color: colors.danger }]}>
              {missingCents > 0
                ? `Faltam ${formatCents(missingCents)} para fechar o total.`
                : missingCents < 0
                  ? `As cotas excedem o total em ${formatCents(-missingCents)}.`
                  : 'Cada participante precisa de uma cota maior que zero.'}
            </Text>
          )}

          <Pressable onPress={() => distributeEqually(selected, totalCents)} style={[s.secondary, { borderColor: colors.primary }]}>
            <Text style={[s.secondaryText, { color: colors.primary }]}>Dividir igualmente</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={saving || !splitIsValid}
            onPress={() => void save()}
            style={[s.save, { backgroundColor: colors.primary }, (saving || !splitIsValid) && s.disabled]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Criar dívida</Text>}
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: typeof palette.light } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.textMuted} style={[s.input, { borderColor: colors.border, color: colors.text }]} />
    </View>
  );
}

const s = StyleSheet.create({
  back: { fontFamily: 'Inter_700Bold' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 },
  sheet: { borderWidth: 1, borderRadius: radius.card, padding: 18, gap: 14 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 8 },
  personRow: { borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  personToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 },
  personName: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  amountInput: { minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 15 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  secondary: { minHeight: 44, borderWidth: 1, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  save: { minHeight: 52, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  disabled: { opacity: .6 },
});
