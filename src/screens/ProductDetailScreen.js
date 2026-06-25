import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { amazonAPI, aiAPI, productsAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route, language = 'fr' }) {
  const { asin } = route.params || {};
  const [product, setProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (asin) loadProductData();
  }, [asin]);

  const loadProductData = async () => {
    try {
      const [productRes, historyRes] = await Promise.allSettled([
        amazonAPI.getProduct(asin),
        productsAPI.getPriceHistory(asin, 90),
      ]);
      if (productRes.status === 'fulfilled') setProduct(productRes.value.data);
      if (historyRes.status === 'fulfilled') setPriceHistory(historyRes.value.data?.data || []);
    } catch(e) { console.log(e); }
    finally { setLoading(false); }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const res = await aiAPI.analyzeProduct(asin);
      setAnalysis(res.data?.data?.analysis);
      setTab('ai');
    } catch(e) { console.log(e); }
    finally { setAnalyzing(false); }
  };

  if (loading) return (
    <View style={pd.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  const productData = product?.product || {};
  const pricing = product?.pricing || {};
  const bsr = product?.bsr || [];
  const title = productData?.summaries?.[0]?.itemName || asin;

  const chartData = priceHistory.length >= 2 ? {
    labels: priceHistory.slice(-7).map((_, i) => `J-${6-i}`),
    datasets: [
      {
        data: priceHistory.slice(-7).map(h => h.price || 0),
        color: () => COLORS.primary,
        strokeWidth: 2,
      },
      {
        data: priceHistory.slice(-7).map(h => h.buy_box_price || 0),
        color: () => COLORS.success,
        strokeWidth: 2,
      },
    ],
    legend: [language === 'fr' ? 'Mon prix' : 'My Price', 'Buy Box'],
  } : null;

  return (
    <View style={pd.container}>
      <LinearGradient colors={GRADIENTS.primary} style={pd.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={pd.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={pd.headerTitle} numberOfLines={2}>{title}</Text>
        <Text style={pd.asin}>ASIN: {asin}</Text>

        {pricing.buy_box_price && (
          <View style={pd.priceRow}>
            <View style={pd.priceCard}>
              <Text style={pd.priceLabel}>Buy Box</Text>
              <Text style={pd.priceValue}>${pricing.buy_box_price}</Text>
            </View>
            {bsr[0] && (
              <View style={pd.priceCard}>
                <Text style={pd.priceLabel}>BSR</Text>
                <Text style={pd.priceValue}>#{bsr[0].rank?.toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={pd.tabs}>
        {[
          ['info', language==='fr'?'📋 Info':'📋 Info'],
          ['chart', language==='fr'?'📈 Historique':'📈 History'],
          ['ai', language==='fr'?'🤖 Analyse IA':'🤖 AI Analysis'],
        ].map(([key, label]) => (
          <TouchableOpacity key={key} style={[pd.tab, tab===key && pd.tabActive]} onPress={() => setTab(key)}>
            <Text style={[pd.tabText, tab===key && pd.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={pd.content}>
        {/* Info Tab */}
        {tab === 'info' && (
          <View style={pd.section}>
            {bsr.map((rank, idx) => (
              <View key={idx} style={pd.infoRow}>
                <Text style={pd.infoLabel}>🏆 {rank.category}</Text>
                <Text style={pd.infoValue}>#{rank.rank?.toLocaleString()}</Text>
              </View>
            ))}
            {pricing.buy_box_price && (
              <View style={pd.infoRow}>
                <Text style={pd.infoLabel}>💲 Buy Box Price</Text>
                <Text style={[pd.infoValue, { color: COLORS.success }]}>${pricing.buy_box_price}</Text>
              </View>
            )}
            <TouchableOpacity style={pd.analyzeBtn} onPress={analyzeWithAI} disabled={analyzing}>
              <LinearGradient colors={GRADIENTS.primary} style={pd.analyzeBtnInner}>
                {analyzing
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={pd.analyzeBtnText}>🤖 {language==='fr'?'Analyser avec l\'IA':'Analyze with AI'}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Chart Tab - Keepa Style */}
        {tab === 'chart' && (
          <View style={pd.section}>
            <Text style={pd.sectionTitle}>{language==='fr'?'Historique des Prix (90j)':'Price History (90d)'}</Text>
            {chartData ? (
              <LineChart
                data={chartData}
                width={width - SPACING.lg * 2}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.surface,
                  backgroundGradientFrom: COLORS.surface,
                  backgroundGradientTo: COLORS.surfaceLight,
                  decimalPlaces: 2,
                  color: () => COLORS.primary,
                  labelColor: () => COLORS.textSecondary,
                  propsForDots: { r: '3' },
                }}
                bezier
                style={{ borderRadius: RADIUS.lg }}
                withLegend
              />
            ) : (
              <View style={pd.noChart}>
                <Text style={pd.noChartText}>
                  {language==='fr'
                    ? '📊 Pas encore assez de données.\nL\'historique se construira automatiquement.'
                    : '📊 Not enough data yet.\nHistory will build automatically.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* AI Analysis Tab */}
        {tab === 'ai' && (
          <View style={pd.section}>
            {analysis ? (
              <View style={pd.analysisBox}>
                <Text style={pd.analysisText}>{analysis}</Text>
              </View>
            ) : (
              <View style={pd.noAnalysis}>
                <Text style={pd.noAnalysisIcon}>🤖</Text>
                <Text style={pd.noAnalysisText}>
                  {language==='fr'
                    ? 'Cliquez sur "Analyser avec l\'IA" dans l\'onglet Info pour obtenir une analyse complète.'
                    : 'Click "Analyze with AI" in the Info tab to get a complete analysis.'}
                </Text>
                <TouchableOpacity style={pd.analyzeBtn} onPress={() => setTab('info')}>
                  <Text style={pd.analyzeLinkText}>← {language==='fr'?'Retour à Info':'Back to Info'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const pd = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xl },
  backBtn: { marginBottom: SPACING.sm },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xl, fontWeight: 'bold', lineHeight: 26 },
  asin: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.sm, marginTop: 4, marginBottom: SPACING.md },
  priceRow: { flexDirection: 'row', gap: SPACING.md },
  priceCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, padding: SPACING.md, flex: 1, alignItems: 'center' },
  priceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs },
  priceValue: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  content: { padding: SPACING.lg },
  section: { gap: SPACING.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md },
  infoLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  infoValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  analyzeBtn: { marginTop: SPACING.md },
  analyzeBtnInner: { padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  analyzeBtnText: { color: '#FFF', fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  analyzeLinkText: { color: COLORS.primary, fontSize: FONTS.sizes.md, textAlign: 'center' },
  noChart: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 40, alignItems: 'center' },
  noChartText: { color: COLORS.textMuted, textAlign: 'center', fontSize: FONTS.sizes.md, lineHeight: 24 },
  analysisBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg },
  analysisText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, lineHeight: 22 },
  noAnalysis: { alignItems: 'center', padding: 40, gap: SPACING.md },
  noAnalysisIcon: { fontSize: 48 },
  noAnalysisText: { color: COLORS.textMuted, textAlign: 'center', fontSize: FONTS.sizes.md, lineHeight: 22 },
});
