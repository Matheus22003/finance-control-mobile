import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { createDebt, getPeople, type Person } from '@/core/api/debts-api';
import { getGroups, type Group } from '@/core/api/social-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

const categories = ['FOOD', 'RENT', 'TRANSPORT', 'TRAVEL', 'LOAN', 'OTHER'];

export default function DebtCreate() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { authorizedRequest } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextPeople, nextGroups] = await Promise.all([authorizedRequest(getPeople), authorizedRequest(getGroups)]);
      setPeople(nextPeople);
      setGroups(nextGroups);
      setSelected(nextPeople.filter(person => person.isCurrentUser).map(person => person.id));
    } catch { Alert.alert('Não foi possível carregar participantes', 'Tente novamente.'); }
    finally { setLoading(false); }
  }, [authorizedRequest]);
  useEffect(() => { void load(); }, [load]);

  const payer = useMemo(() => people.find(person => person.isCurrentUser), [people]);
  function toggle(personId: string) { setSelected(current => current.includes(personId) ? current.filter(id => id !== personId) : [...current, personId]); }

  async function save() {
    const total = Number(amount.replace(',', '.'));
    if (!description.trim() || !Number.isFinite(total) || total <= 0 || !payer || !selected.length) {
      Alert.alert('Revise a dívida', 'Informe descrição, valor e pelo menos um participante.'); return;
    }
    setSaving(true);
    try {
      const share = Math.round((total / selected.length) * 100) / 100;
      const remainder = Math.round((total - share * selected.length) * 100) / 100;
      await authorizedRequest(token => createDebt(token, {
        description: description.trim(), totalAmount: total, paidByPersonId: payer.id, groupId, category, dueDate: null,
        shares: selected.map((personId, index) => ({ personId, amount: index === 0 ? share + remainder : share })),
      }));
      router.replace('/debts');
    } catch { Alert.alert('Não foi possível criar', 'Confira os participantes e tente novamente.'); }
    finally { setSaving(false); }
  }

  return <Screen><Pressable onPress={() => router.back()}><Text style={[s.back, { color: colors.primary }]}>‹ Voltar</Text></Pressable><Text style={[s.title, { color: colors.text }]}>Nova dívida</Text>{loading ? <ActivityIndicator color={colors.primary} /> : <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: Jantar de sexta" colors={colors} />
    <Field label="Valor total" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" colors={colors} />
    <Text style={[s.label, { color: colors.textMuted }]}>Grupo (opcional)</Text><View style={s.wrap}><Pressable onPress={() => setGroupId(null)} style={[s.chip, { backgroundColor: groupId === null ? colors.primary : colors.primarySoft }]}><Text style={{ color: groupId === null ? '#fff' : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>Sem grupo</Text></Pressable>{groups.map(group => <Pressable key={group.id} onPress={() => setGroupId(group.id)} style={[s.chip, { backgroundColor: groupId === group.id ? colors.primary : colors.primarySoft }]}><Text style={{ color: groupId === group.id ? '#fff' : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{group.name}</Text></Pressable>)}</View>
    <Text style={[s.label, { color: colors.textMuted }]}>Categoria</Text><View style={s.wrap}>{categories.map(value => <Pressable key={value} onPress={() => setCategory(value)} style={[s.chip, { backgroundColor: category === value ? colors.primary : colors.primarySoft }]}><Text style={{ color: category === value ? '#fff' : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{value}</Text></Pressable>)}</View>
    <Text style={[s.label, { color: colors.textMuted }]}>Quem participa?</Text>{people.map(person => <Pressable key={person.id} onPress={() => toggle(person.id)} style={[s.person, { borderColor: colors.border, backgroundColor: selected.includes(person.id) ? colors.primarySoft : colors.surface }]}><Text style={[s.personName, { color: colors.text }]}>{person.name}{person.isCurrentUser ? ' (você)' : ''}</Text><Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{selected.includes(person.id) ? '✓' : '+'}</Text></Pressable>)}
    <Text style={[s.hint, { color: colors.textMuted }]}>A divisão é igual entre os participantes selecionados. Ajuste de cotas individuais virá em uma melhoria posterior.</Text><Pressable disabled={saving} onPress={() => void save()} style={[s.save, { backgroundColor: colors.primary }, saving && s.disabled]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Criar dívida</Text>}</Pressable>
  </View>}</Screen>;
}
function Field({ label, colors, ...props }: { label: string; colors: typeof palette.light } & React.ComponentProps<typeof TextInput>) { return <View style={{ gap: 6 }}><Text style={[s.label, { color: colors.textMuted }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.textMuted} style={[s.input, { borderColor: colors.border, color: colors.text }]} /></View>; }
const s = StyleSheet.create({ back: { fontFamily: 'Inter_700Bold' }, title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 }, sheet: { borderWidth: 1, borderRadius: radius.card, padding: 18, gap: 14 }, label: { fontFamily: 'Inter_700Bold', fontSize: 13 }, input: { minHeight: 50, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 16 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 8 }, person: { borderWidth: 1, borderRadius: radius.control, minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, personName: { fontFamily: 'Inter_700Bold', fontSize: 14 }, hint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }, save: { minHeight: 52, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, saveText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }, disabled: { opacity: .6 } });
