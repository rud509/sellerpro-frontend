import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { analyticsAPI, amazonAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { translations } from '../i18n/translations';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ language = 'fr' }) {
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pnlData, setPnlData] = useState(null);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState(30);
  const [tab, setTab] = useState('overview'); // overview, chart, fba
  
  // FBA Calculator state
  const [sellPrice, setSellPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [weight, setWeight] = useState('1');
  const [fbaResult, setFbaResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const loadData = async () => {
    try {
      const [pnlRes, histRes] = await Promise.allSettled([
        analyticsAPI.pnl(period),
        analyticsAPI.history(period)
      ]);
      if (pnlRes.status === 'fulfilled') setPnlData(pnlRes.value.data?.data);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data?.data || []);
    } catch(e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [period]));

  const calculateFBA = async () => {
    if (!sellPrice || !costPrice) return;
    setCalcLoading(true);
    try {
      const res = await analyticsAPI.fbaCalculator(
        parseFloat(sellPrice), parseFloat(costPrice), parseFloat(weight) || 1
      );
      setFbaResult(res.data?.data);
    } catch(e) { console.log(e); }
    finally { setCalcLoading(false); }
  };

  if (loading) return <View style={ss.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  const chartData = history.length > 0 ? {
    labels: history.slice(-7).map(d => d.date?.slice(5,10) || ''),
    datasets: [{ data: history.slice(-7).map(d => d.total_sales || 0), color: () => COLORS.primary, strokeWidth: 2 }]
  } : null;

  return (
    <ScrollView style={ss.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}>
      <LinearGradient colors={GRADIENTS.primary} style={ss.header}>
        <Text style={ss.headerTitle}>📈 Analytics</Text>
        <View style={ss.periodRow}>
          {[7,30,90].map(p => (
            <TouchableOpacity key={p} style={[ss.periodBtn, period===p && ss.periodActive]} onPress={() => setPeriod(p)}>
              <Text style={[ss.periodText, period===p && ss.periodTextActive]}>{p}j</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={ss.tabs}>
        {[['overview','📊 ' + (language==='fr'?'Vue':'Overview')], ['chart','📉 ' + (language==='fr'?'Graphique':'Chart')], ['fba','🧮 FBA']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[ss.tab, tab===key && ss.tabActive]} onPress={() => setTab(key)}>
            <Text style={[ss.tabText, tab===key && ss.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview */}
      {tab === 'overview' && pnlData && (
        <View style={ss.content}>
          {[
            { label: language==='fr'?'Ventes totales':'Total Sales', value: `$${(pnlData.total_sales||0).toLocaleString('en-US', {minimumFractionDigits:2})}`, color: COLORS.success, icon: '💰' },
            { label: language==='fr'?'Revenu net':'Net Revenue', value: `$${(pnlData.net_revenue||0).toLocaleString('en-US', {minimumFractionDigits:2})}`, color: COLORS.primary, icon: '📈' },
            { label: language==='fr'?'Frais Amazon':'Amazon Fees', value: `$${(pnlData.total_fees||0).toFixed(2)}`, color: COLORS.warning, icon: '💸' },
            { label: language==='fr'?'Remboursements':'Refunds', value: `$${(pnlData.total_refunds||0).toFixed(2)}`, color: COLORS.danger, icon: '↩️' },
            { label: language==='fr'?'Nb commandes':'Orders Count', value: pnlData.orders_count?.toString() || '0', color: COLORS.info, icon: '🛒' },
            { label: language==='fr'?'Panier moyen':'Avg Order Value', value: `$${(pnlData.average_order_value||0).toFixed(2)}`, color: COLORS.accent, icon: '🎯' },
          ].map((item, idx) => (
            <View key={idx} style={ss.kpiRow}>
              <Text style={ss.kpiIcon}>{item.icon}</Text>
              <Text style={ss.kpiLabel}>{item.label}</Text>
              <Text style={[ss.kpiValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
          {pnlData.total_sales > 0 && (
            <View style={ss.marginCard}>
              <Text style={ss.marginTitle}>{language==='fr'?'Marge nette estimée':'Estimated Net Margin'}</Text>
              <Text style={ss.marginValue}>
                {((pnlData.net_revenue / pnlData.total_sales) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      {tab === 'chart' && (
        <View style={ss.content}>
          {chartData ? (
            <>
              <Text style={ss.chartTitle}>{t.salesOverTime}</Text>
              <LineChart
                data={chartData}
                width={width - SPACING.lg * 2}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.surface,
                  backgroundGradientFrom: COLORS.surface,
                  backgroundGradientTo: COLORS.surfaceLight,
                  decimalPlaces: 0,
                  color: () => COLORS.primary,
                  labelColor: () => COLORS.textSecondary,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary }
                }}
                bezier
                style={{ borderRadius: RADIUS.lg }}
              />
            </>
          ) : (
            <Text style={ss.empty}>{language==='fr'?'Pas assez de données pour afficher le graphique.':'Not enough data to display the chart.'}</Text>
          )}
        </View>
      )}

      {/* FBA Calculator */}
      {tab === 'fba' && (
        <View style={ss.content}>
          <Text style={ss.sectionTitle}>🧮 {t.fbaCalculator}</Text>
          <Text style={ss.inputLabel}>{t.sellingPrice} ($)</Text>
          <TextInput style={ss.input} value={sellPrice} onChangeText={setSellPrice} keyboardType="decimal-pad" placeholder="25.00" placeholderTextColor={COLORS.textMuted} />
          <Text style={ss.inputLabel}>{t.costPrice} ($)</Text>
          <TextInput style={ss.input} value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" placeholder="8.00" placeholderTextColor={COLORS.textMuted} />
          <Text style={ss.inputLabel}>{language==='fr'?'Poids (lbs)':'Weight (lbs)'}</Text>
          <TextInput style={ss.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="1.0" placeholderTextColor={COLORS.textMuted} />

          <TouchableOpacity style={ss.calcBtn} onPress={calculateFBA} disabled={calcLoading}>
            <LinearGradient colors={GRADIENTS.primary} style={ss.calcBtnInner}>
              {calcLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={ss.calcBtnText}>{t.calculate}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {fbaResult && (
            <View style={ss.resultCard}>
              {[
                { label: language==='fr'?'Frais Amazon':'Amazon Fees', value: `$${fbaResult.referral_fee}`, color: COLORS.warning },
                { label: language==='fr'?'Frais FBA':'FBA Fees', value: `$${fbaResult.fulfillment_fee}`, color: COLORS.warning },
                { label: language==='fr'?'Frais stockage':'Storage Fees', value: `$${fbaResult.storage_fee}`, color: COLORS.warning },
                { label: language==='fr'?'Total frais':'Total Fees', value: `$${fbaResult.total_fees}`, color: COLORS.danger },
                { label: t.grossProfit, value: `$${fbaResult.gross_profit}`, color: fbaResult.gross_profit > 0 ? COLORS.success : COLORS.danger },
                { label: t.margin, value: `${fbaResult.margin_percent}%`, color: fbaResult.margin_percent > 20 ? COLORS.success : fbaResult.margin_percent > 10 ? COLORS.warning : COLORS.danger },
                { label: t.roi, value: `${fbaResult.roi_percent}%`, color: fbaResult.roi_percent > 50 ? COLORS.success : COLORS.warning },
                { label: t.breakEven, value: `$${fbaResult.break_even_price}`, color: COLORS.info },
              ].map((item, idx) => (
                <View key={idx} style={ss.resultRow}>
                  <Text style={ss.resultLabel}>{item.label}</Text>
                  <Text style={[ss.resultValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold', marginBottom: SPACING.md },
  periodRow: { flexDirection: 'row', gap: SPACING.sm },
  periodBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  periodActive: { backgroundColor: '#FFF' },
  periodText: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  periodTextActive: { color: COLORS.primary },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  tabTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  content: { padding: SPACING.lg, gap: SPACING.sm },
  kpiRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md },
  kpiIcon: { fontSize: 20, marginRight: SPACING.md },
  kpiLabel: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  kpiValue: { fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  marginCard: { backgroundColor: COLORS.primary + '20', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '40', marginTop: SPACING.md },
  marginTitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  marginValue: { color: COLORS.primary, fontSize: FONTS.sizes.huge, fontWeight: 'bold', marginTop: SPACING.xs },
  chartTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: SPACING.md },
  empty: { color: COLORS.textMuted, textAlign: 'center', padding: 40 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: 'bold', marginBottom: SPACING.md },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  calcBtn: { marginTop: SPACING.sm },
  calcBtnInner: { padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  calcBtnText: { color: '#FFF', fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  resultCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  resultLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  resultValue: { fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
});
