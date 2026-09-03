import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { getDashboard, type Dashboard } from '@/core/api/finance-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

const money = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function Home() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { authorizedRequest, user, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setDashboard(await authorizedRequest(getDashboard)); }
    catch { Alert.alert('Não foi possível atualizar', 'Verifique sua conexão e tente novamente.'); }
    finally { setLoading(false); }
  }, [authorizedRequest]);
  useEffect(() => { void load(); }, [load]);

  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} tintColor={colors.primary} />}>
    <View style={styles.header}><Brand /><Pressable accessibilityLabel="Sair" onPress={() => void signOut()} style={[styles.avatar, { borderColor: colors.border }]}><Text style={{ color: colors.primary }}>↪</Text></Pressable></View>
    <View><Text style={[styles.greeting, { color: colors.text }]}>Olá, {user?.displayName.split(' ')[0] ?? 'você'}</Text><Text style={[styles.muted, { color: colors.textMuted }]}>Aqui está o resumo da sua vida financeira.</Text></View>
    {dashboard ? <View style={[styles.balance, { backgroundColor: colors.primary }]}><Text style={styles.balanceLabel}>Saldo disponível</Text><Text style={styles.balanceValue}>{money(dashboard.balance)}</Text><View style={styles.summary}><Text style={styles.balanceLabel}>↑ {money(dashboard.totalIncome)} receitas</Text><Text style={styles.balanceLabel}>↓ {money(dashboard.totalExpenses)} despesas</Text></View></View> : <View style={[styles.loading, { backgroundColor: colors.surface, borderColor: colors.border }]}><ActivityIndicator color={colors.primary} /></View>}
    <Text style={[styles.section, { color: colors.text }]}>Ações rápidas</Text>
    <View style={styles.actions}><Action label="Adicionar" onPress={() => router.push('/create')} colors={colors} /><Action label="Finanças" onPress={() => router.push('/finances')} colors={colors} /><Action label="Sair" onPress={() => void signOut()} colors={colors} /></View>
  </Screen>;
}
function Action({ label, colors, onPress }: { label: string; colors: typeof palette.light; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={{ fontFamily: 'Inter_700Bold', color: colors.primary, fontSize: 17 }}>+</Text><Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, avatar: { height: 38, width: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, greeting: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 }, muted: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 }, balance: { borderRadius: radius.card, padding: 20, gap: 8 }, balanceLabel: { fontFamily: 'Inter_500Medium', color: '#fff', fontSize: 13 }, balanceValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, color: '#fff', letterSpacing: -1 }, summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, section: { fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 8 }, actions: { flexDirection: 'row', gap: 10 }, action: { flex: 1, minHeight: 74, borderWidth: 1, borderRadius: radius.component, padding: 12, gap: 7 }, actionLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 }, loading: { minHeight: 148, borderWidth: 1, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center' } });
