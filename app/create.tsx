import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { createExpense, createIncome } from '@/core/api/finance-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

const categories = ['FOOD', 'TRANSPORT', 'RENT', 'LEISURE', 'HEALTH', 'OTHER'];

export default function Create() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { accessToken, authorizedRequest, isRestoring } = useAuth();
  const [kind, setKind] = useState<'Despesa' | 'Receita'>('Despesa');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [saving, setSaving] = useState(false);

  async function save() {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Revise o lançamento', 'Informe uma descrição e um valor maior que zero.');
      return;
    }
    setSaving(true);
    try {
      const transactionDate = new Date().toISOString().slice(0, 10);
      if (kind === 'Receita') await authorizedRequest(token => createIncome(token, { description: description.trim(), amount: parsedAmount, transactionDate }));
      else await authorizedRequest(token => createExpense(token, { description: description.trim(), amount: parsedAmount, transactionDate, category }));
      router.replace('/finances');
    } catch {
      Alert.alert('Não foi possível salvar', 'O lançamento não foi criado. Tente novamente.');
    } finally { setSaving(false); }
  }

  if (isRestoring) return null;
  if (!accessToken) return <Redirect href="/login" />;

  return <Screen><Pressable onPress={() => router.back()}><Text style={{ fontFamily: 'Inter_700Bold', color: colors.primary }}>‹ Voltar</Text></Pressable><Text style={[styles.title, { color: colors.text }]}>Novo lançamento</Text><View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.types}>{(['Despesa', 'Receita'] as const).map(value => <Pressable key={value} onPress={() => setKind(value)} style={[styles.type, { backgroundColor: kind === value ? colors.primary : colors.surfaceMuted }]}><Text style={{ fontFamily: 'Inter_700Bold', color: kind === value ? '#fff' : colors.text }}>{value}</Text></Pressable>)}</View><Field label="Valor" value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="decimal-pad" colors={colors} /><Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: Mercado da semana" colors={colors} />{kind === 'Despesa' ? <><Text style={[styles.label, { color: colors.textMuted }]}>Categoria</Text><View style={styles.categories}>{categories.map(value => <Pressable key={value} onPress={() => setCategory(value)} style={[styles.category, { backgroundColor: category === value ? colors.primary : colors.primarySoft }]}><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: category === value ? '#fff' : colors.primary }}>{value}</Text></Pressable>)}</View></> : null}<Pressable disabled={saving} onPress={() => void save()} style={[styles.save, { backgroundColor: colors.primary }, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar lançamento</Text>}</Pressable></View></Screen>;
}
function Field({ label, colors, ...props }: { label: string; colors: typeof palette.light } & React.ComponentProps<typeof TextInput>) { return <View style={{ gap: 6 }}><Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: colors.border, color: colors.text }]} /></View>; }
const styles = StyleSheet.create({ title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 }, sheet: { borderWidth: 1, borderRadius: radius.card, gap: 16, padding: 18 }, types: { flexDirection: 'row', gap: 8 }, type: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control }, label: { fontFamily: 'Inter_700Bold', fontSize: 13 }, input: { minHeight: 50, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 16 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, category: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 8 }, save: { minHeight: 52, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, saveText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }, disabled: { opacity: .6 } });
