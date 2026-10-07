import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { createPayment, getDebt, getDebtPayments, type Debt, type Payment } from '@/core/api/debts-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

const money = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function DebtDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const colors = palette[useColorScheme() ?? 'light']; const { accessToken, isRestoring, authorizedRequest } = useAuth();
  const [debt, setDebt] = useState<Debt | null>(null); const [payments, setPayments] = useState<Payment[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { const [nextDebt, nextPayments] = await Promise.all([authorizedRequest(token => getDebt(token, id)), authorizedRequest(token => getDebtPayments(token, id))]); setDebt(nextDebt); setPayments(nextPayments); } catch { Alert.alert('Não foi possível abrir a dívida', 'Tente novamente.'); } finally { setLoading(false); } }, [authorizedRequest, id]);
  useEffect(() => { void load(); }, [load]);
  async function pay(shareId: string, remaining: number | string) { try { await authorizedRequest(token => createPayment(token, id, shareId, { amount: Number(remaining), paymentDate: new Date().toISOString().slice(0, 10), note: null })); Alert.alert('Pagamento registrado', 'O pagamento foi enviado para confirmação quando necessário.'); void load(); } catch { Alert.alert('Não foi possível registrar', 'Tente novamente.'); } }
  if (isRestoring) return null;
  if (!accessToken) return <Redirect href="/login" />;
  if (loading) return <Screen><ActivityIndicator color={colors.primary} /></Screen>; if (!debt) return <Screen><Text style={{ color: colors.text }}>Dívida indisponível.</Text></Screen>;
  return <Screen><Pressable onPress={() => router.back()}><Text style={[s.back, { color: colors.primary }]}>‹ Voltar</Text></Pressable><View><Text style={[s.title, { color: colors.text }]}>{debt.description}</Text><Text style={[s.muted, { color: colors.textMuted }]}>{debt.category} · {debt.status === 'PAID' ? 'Quitada' : 'Em aberto'}</Text></View><View style={[s.total, { backgroundColor: colors.primary }]}><Text style={s.totalLabel}>Valor total</Text><Text style={s.totalValue}>{money(debt.totalAmount)}</Text><Text style={s.totalLabel}>Pago por {debt.paidBy.name}</Text></View><Text style={[s.section, { color: colors.text }]}>Participantes</Text>{debt.shares.map(share => <View key={share.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[s.name, { color: colors.text }]}>{share.person.name}{share.isPayer ? ' · pagador' : ''}</Text><Text style={[s.muted, { color: colors.textMuted }]}>Restante: {money(share.remainingAmount)}</Text></View>{Number(share.remainingAmount) > 0 && share.person.isCurrentUser ? <Pressable onPress={() => void pay(share.id, share.remainingAmount)} style={[s.pay, { backgroundColor: colors.primary }]}><Text style={s.payText}>Registrar</Text></Pressable> : null}</View>)}<Text style={[s.section, { color: colors.text }]}>Pagamentos</Text>{payments.length ? payments.map(payment => <View key={payment.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View><Text style={[s.name, { color: colors.text }]}>{money(payment.amount)}</Text><Text style={[s.muted, { color: colors.textMuted }]}>{new Date(`${payment.paymentDate}T12:00:00`).toLocaleDateString('pt-BR')} · {payment.status}</Text></View></View>) : <Text style={[s.muted, { color: colors.textMuted }]}>Ainda não há pagamentos registrados.</Text>}</Screen>;
}
const s=StyleSheet.create({ back:{fontFamily:'Inter_700Bold'},title:{fontFamily:'Inter_800ExtraBold',fontSize:28,letterSpacing:-.8},muted:{fontFamily:'Inter_400Regular',fontSize:13},total:{borderRadius:radius.card,padding:20,gap:7},totalLabel:{color:'#fff',fontFamily:'Inter_500Medium',fontSize:13},totalValue:{color:'#fff',fontFamily:'Inter_800ExtraBold',fontSize:30},section:{fontFamily:'Inter_700Bold',fontSize:19,marginTop:4},card:{borderWidth:1,borderRadius:radius.component,padding:15,flexDirection:'row',alignItems:'center',gap:10},name:{fontFamily:'Inter_700Bold',fontSize:15},pay:{paddingVertical:9,paddingHorizontal:12,borderRadius:radius.control},payText:{fontFamily:'Inter_700Bold',color:'#fff',fontSize:12}});
