import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { confirmPayment, getDebts, getDebtSummary, getPendingPayments, rejectPayment, type Debt, type DebtSummary, type Payment } from '@/core/api/debts-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

const money = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function Debts() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { authorizedRequest } = useAuth();
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const [nextSummary, nextDebts, nextPending] = await Promise.all([authorizedRequest(getDebtSummary), authorizedRequest(getDebts), authorizedRequest(getPendingPayments)]);
      setSummary(nextSummary); setDebts(nextDebts); setPendingPayments(nextPending);
    } catch { Alert.alert('Não foi possível carregar dívidas', 'Tente novamente em instantes.'); }
    finally { setLoading(false); }
  }, [authorizedRequest]);
  useEffect(() => { void load(); }, [load]);
  async function decidePayment(payment: Payment, accepted: boolean) {
    try {
      await authorizedRequest(token => accepted ? confirmPayment(token, payment.debtId, payment.id) : rejectPayment(token, payment.debtId, payment.id));
      void load();
    } catch { Alert.alert('Não foi possível atualizar o pagamento', 'Tente novamente.'); }
  }

  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} tintColor={colors.primary} />}>
    <Brand /><View><Text style={[s.title, { color: colors.text }]}>Dívidas</Text><Text style={[s.muted, { color: colors.textMuted }]}>Acompanhe o que falta pagar e receber.</Text></View>
    <View style={s.cards}><Metric label="Você deve" value={summary ? money(summary.totalOwed) : '—'} color={colors.danger} background={colors.surface} border={colors.border} /><Metric label="Vão te pagar" value={summary ? money(summary.totalToReceive) : '—'} color={colors.positive} background={colors.surface} border={colors.border} /></View>
    <Pressable onPress={() => router.push('/settlement')} style={[s.settlement, { backgroundColor: colors.primarySoft }]}><View><Text style={[s.settlementTitle, { color: colors.primary }]}>Liquidação simplificada</Text><Text style={[s.muted, { color: colors.textMuted }]}>Reduza transferências desnecessárias.</Text></View><Text style={[s.chevron, { color: colors.primary }]}>›</Text></Pressable>
    {pendingPayments.length ? <><Text style={[s.section, { color: colors.text }]}>Aguardando sua confirmação</Text>{pendingPayments.map(payment => <View key={payment.id} style={[s.confirmation, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[s.debtName, { color: colors.text }]}>{payment.fromPerson.name} pagou {money(payment.amount)}</Text><Text style={[s.muted, { color: colors.textMuted }]}>Para {payment.toPerson.name}</Text></View><Pressable onPress={() => void decidePayment(payment, true)}><Text style={[s.confirm, { color: colors.positive }]}>Confirmar</Text></Pressable><Pressable onPress={() => void decidePayment(payment, false)}><Text style={[s.confirm, { color: colors.danger }]}>Recusar</Text></Pressable></View>)}</> : null}
    <View style={s.row}><Text style={[s.section, { color: colors.text }]}>Em aberto {summary ? `(${summary.openDebtsCount})` : ''}</Text><Pressable onPress={() => router.push('/debt-create')}><Text style={[s.create, { color: colors.primary }]}>+ Nova dívida</Text></Pressable></View>
    {loading && !debts.length ? <ActivityIndicator color={colors.primary} /> : debts.map(debt => <Pressable key={debt.id} onPress={() => router.push({ pathname: '/debt/[id]', params: { id: debt.id } })} style={[s.debt, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1, gap: 4 }}><Text style={[s.debtName, { color: colors.text }]}>{debt.description}</Text><Text style={[s.muted, { color: colors.textMuted }]}>{debt.shares.length} participante{debt.shares.length === 1 ? '' : 's'} · {debt.category}</Text></View><View style={{ alignItems: 'flex-end', gap: 5 }}><Text style={[s.amount, { color: colors.text }]}>{money(debt.totalAmount)}</Text><Text style={[s.status, { color: debt.status === 'PAID' ? colors.positive : colors.warning }]}>{debt.status === 'PAID' ? 'Quitada' : 'Em aberto'}</Text></View></Pressable>)}
    {!loading && !debts.length ? <Text style={[s.muted, { color: colors.textMuted }]}>Nenhuma dívida registrada. Crie a primeira para dividir uma conta com alguém.</Text> : null}
  </Screen>;
}
function Metric({ label, value, color, background, border }: { label: string; value: string; color: string; background: string; border: string }) { return <View style={[s.metric, { backgroundColor: background, borderColor: border }]}><Text style={s.metricLabel}>{label}</Text><Text style={[s.metricValue, { color }]}>{value}</Text></View>; }
const s = StyleSheet.create({ title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 }, muted: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }, cards: { flexDirection: 'row', gap: 10 }, metric: { flex: 1, borderRadius: radius.component, borderWidth: 1, padding: 14, gap: 7 }, metricLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#64747D' }, metricValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 18 }, settlement: { borderRadius: radius.component, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, settlementTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 }, chevron: { fontSize: 28 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, section: { fontFamily: 'Inter_700Bold', fontSize: 19 }, create: { fontFamily: 'Inter_700Bold', fontSize: 13 }, debt: { borderWidth: 1, borderRadius: radius.component, padding: 16, flexDirection: 'row', gap: 10 }, debtName: { fontFamily: 'Inter_700Bold', fontSize: 15 }, confirmation: { borderWidth: 1, borderRadius: radius.component, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, confirm: { fontFamily: 'Inter_700Bold', fontSize: 12 }, amount: { fontFamily: 'Inter_700Bold', fontSize: 14 }, status: { fontFamily: 'Inter_700Bold', fontSize: 12 } });
