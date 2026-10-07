import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { downloadReportCsv, getReportOverview, type ReportOverview } from '@/core/api/finance-api';
import { useAuth } from '@/core/auth/auth-context';
import { formatMonth, localMonth, shiftMonth } from '@/core/finance/month';
import { palette, radius } from '@/constants/Colors';

const WINDOW_MONTHS = 6;
const money = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
const percent = (value: number | string) => `${Math.round(Number(value))}%`;

export default function Reports() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { authorizedRequest } = useAuth();
  const [to, setTo] = useState(() => localMonth());
  const [from, setFrom] = useState(() => shiftMonth(localMonth(), -(WINDOW_MONTHS - 1)));
  const [report, setReport] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setReport(await authorizedRequest(token => getReportOverview(token, from, to)));
    } catch {
      setReport(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, from, to]);
  useEffect(() => { void load(); }, [load]);

  const canMoveForward = to < localMonth();
  const openPlusPaid = Number(report?.debts.openDebtsCount ?? 0) + Number(report?.debts.paidDebtsCount ?? 0);
  function slide(delta: number) {
    if (delta > 0 && !canMoveForward) return;
    setFrom(current => shiftMonth(current, delta));
    setTo(current => shiftMonth(current, delta));
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const csv = await authorizedRequest(token => downloadReportCsv(token, from, to));
      const file = new File(Paths.cache, `finance-control-${from}-${to}.csv`);
      file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Compartilhar relatório Finance Control',
        });
      } else {
        await Share.share({ message: csv, title: 'Relatório Finance Control' });
      }
    } catch {
      Alert.alert('Não foi possível exportar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => { setLoading(true); void load(); }}
          tintColor={colors.primary}
        />
      }
    >
      <Brand />
      <Text style={[s.title, { color: colors.text }]}>Relatórios</Text>
      <Text style={[s.muted, { color: colors.textMuted }]}>
        Entenda sua evolução financeira e suas dívidas.
      </Text>

      <View style={[s.period, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable accessibilityLabel="Período anterior" onPress={() => slide(-1)}>
          <Text style={[s.arrow, { color: colors.primary }]}>‹</Text>
        </Pressable>
        <View style={s.periodCenter}>
          <Text style={[s.periodLabel, { color: colors.textMuted }]}>Período</Text>
          <Text style={[s.periodValue, { color: colors.text }]}>
            {formatMonth(from)} — {formatMonth(to)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Próximo período"
          disabled={!canMoveForward}
          onPress={() => slide(1)}
        >
          <Text style={[s.arrow, { color: canMoveForward ? colors.primary : colors.border }]}>›</Text>
        </Pressable>
      </View>

      {loading && !report ? <ActivityIndicator color={colors.primary} /> : null}

      {!loading && failed ? (
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.summary, { color: colors.text }]}>Não foi possível carregar o relatório</Text>
          <Text style={[s.muted, { color: colors.textMuted }]}>
            Verifique sua conexão e tente novamente.
          </Text>
          <Pressable onPress={() => { setLoading(true); void load(); }} style={[s.retry, { borderColor: colors.primary }]}>
            <Text style={[s.retryText, { color: colors.primary }]}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {report ? (
        <>
          <View style={s.cards}>
            <Metric label="Receitas" value={money(report.finance.totalIncome)} color={colors.positive} colors={colors} />
            <Metric label="Despesas" value={money(report.finance.totalExpenses)} color={colors.danger} colors={colors} />
          </View>

          <View style={[s.hero, { backgroundColor: colors.primary }]}>
            <Text style={s.heroLabel}>Saldo do período</Text>
            <Text style={s.heroValue}>{money(report.finance.balance)}</Text>
            <Text style={s.heroLabel}>
              Economia de {percent(report.finance.savingsRatePercentage)} em {report.monthCount} meses
            </Text>
          </View>

          <Text style={[s.section, { color: colors.text }]}>Destaques</Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Info label="Média de receitas" value={money(report.highlights.averageMonthlyIncome)} c={colors} />
            <Info label="Média de despesas" value={money(report.highlights.averageMonthlyExpenses)} c={colors} />
            <Info label="Maior categoria" value={report.highlights.highestExpenseCategory ?? '—'} c={colors} />
            <Info label="Melhor mês" value={report.highlights.bestBalanceMonth ?? '—'} c={colors} />
          </View>

          <Text style={[s.section, { color: colors.text }]}>Despesas por categoria</Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {report.finance.expenseCategories.length ? (
              report.finance.expenseCategories.map(item => (
                <Info
                  key={item.category}
                  label={item.name}
                  value={`${money(item.amount)} · ${percent(item.percentage)}`}
                  c={colors}
                />
              ))
            ) : (
              <Text style={[s.muted, { color: colors.textMuted }]}>Sem despesas no período.</Text>
            )}
          </View>

          <Text style={[s.section, { color: colors.text }]}>Dívidas</Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Info label="Volume total" value={money(report.debts.totalVolume)} c={colors} />
            <Info label="Você deve" value={money(report.debts.totalOwed)} c={colors} />
            <Info label="A receber" value={money(report.debts.totalToReceive)} c={colors} />
            <Info label="Em aberto" value={`${report.debts.openDebtsCount} de ${openPlusPaid} dívidas`} c={colors} />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={exporting}
            onPress={() => void exportCsv()}
            style={[s.export, { backgroundColor: colors.primary }, exporting && s.disabled]}
          >
            {exporting ? <ActivityIndicator color="#fff" /> : <Text style={s.exportText}>Exportar CSV</Text>}
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function Metric({ label, value, color, colors }: { label: string; value: string; color: string; colors: typeof palette.light }) {
  return (
    <View style={[s.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.muted, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[s.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

function Info({ label, value, c }: { label: string; value: string; c: typeof palette.light }) {
  return (
    <View style={s.info}>
      <Text style={[s.muted, { color: c.textMuted }]}>{label}</Text>
      <Text style={[s.infoValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 },
  muted: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  period: { borderWidth: 1, borderRadius: radius.component, padding: 12, flexDirection: 'row', alignItems: 'center' },
  periodCenter: { flex: 1, alignItems: 'center' },
  arrow: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, paddingHorizontal: 10 },
  periodLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  periodValue: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  cards: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, borderWidth: 1, borderRadius: radius.component, padding: 14, gap: 8 },
  metricValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 18 },
  hero: { borderRadius: radius.card, padding: 20, gap: 8 },
  heroLabel: { fontFamily: 'Inter_500Medium', color: '#fff', fontSize: 13 },
  heroValue: { fontFamily: 'Inter_800ExtraBold', color: '#fff', fontSize: 30 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: radius.component, padding: 16, gap: 14 },
  summary: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  info: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  infoValue: { fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'right', flexShrink: 1 },
  retry: { minHeight: 44, borderWidth: 1, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  export: { minHeight: 52, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  exportText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  disabled: { opacity: .6 },
});
