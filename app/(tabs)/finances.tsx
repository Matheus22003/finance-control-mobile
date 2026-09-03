import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { getTransactions, isExpense, type Expense, type Income } from '@/core/api/finance-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

const money = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function Finances() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { authorizedRequest } = useAuth();
  const [entries, setEntries] = useState<Array<Income | Expense>>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setEntries(await authorizedRequest(getTransactions)); }
    catch { Alert.alert('Não foi possível carregar os lançamentos', 'Tente novamente em instantes.'); }
    finally { setLoading(false); }
  }, [authorizedRequest]);
  useEffect(() => { void load(); }, [load]);

  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} tintColor={colors.primary} />}>
    <Brand /><View><Text style={[styles.title, { color: colors.text }]}>Finanças</Text><Text style={[styles.muted, { color: colors.textMuted }]}>Acompanhe cada movimentação com clareza.</Text></View>
    {loading && !entries.length ? <ActivityIndicator color={colors.primary} /> : entries.map(entry => {
      const expense = isExpense(entry);
      return <View key={`${expense ? 'expense' : 'income'}-${entry.id}`} style={[styles.entry, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ gap: 3, flex: 1 }}><Text style={[styles.name, { color: colors.text }]}>{entry.description}</Text><Text style={[styles.muted, { color: colors.textMuted }]}>{new Date(`${entry.transactionDate}T12:00:00`).toLocaleDateString('pt-BR')}{expense ? ` · ${entry.category}` : ' · Receita'}</Text></View><Text style={[styles.value, { color: expense ? colors.text : colors.positive }]}>{expense ? '− ' : '+ '}{money(entry.amount)}</Text></View>;
    })}
    {!loading && entries.length === 0 ? <Text style={[styles.muted, { color: colors.textMuted }]}>Ainda não há lançamentos neste período.</Text> : null}
    <Pressable onPress={() => router.push('/create')} style={[styles.cta, { backgroundColor: colors.primary }]}><Text style={styles.ctaText}>+ Adicionar lançamento</Text></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({ title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 }, muted: { fontFamily: 'Inter_400Regular', fontSize: 14 }, entry: { borderWidth: 1, borderRadius: radius.component, padding: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, name: { fontFamily: 'Inter_700Bold', fontSize: 15 }, value: { fontFamily: 'Inter_700Bold', fontSize: 14, alignSelf: 'center' }, cta: { borderRadius: radius.control, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, ctaText: { fontFamily: 'Inter_700Bold', color: '#fff' } });
