import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, GRADIENTS } from '../utils/theme';
import { aiAPI } from '../services/api';

export default function ProductScannerScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scanProduct = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await aiAPI.scanProduct(query.trim());
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setResult(response.data);
      }
    } catch (e) {
      setError('Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#00C853';
    if (score >= 6) return '#FFD600';
    return '#FF1744';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Scanner Produits</Text>
        <Text style={styles.headerSubtitle}>Trouve les produits gagnants</Text>
      </LinearGradient>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.searchContainer}>
          <Text style={styles.label}>ASIN ou mots-clés</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Ex: B08XYZ123 ou 'yoga mat'"
              placeholderTextColor={COLORS.textMuted}
              color={COLORS.textPrimary}
            />
            <TouchableOpacity
              style={[styles.scanBtn, !query.trim() && { opacity: 0.5 }]}
              onPress={scanProduct}
              disabled={!query.trim() || loading}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.scanBtnGradient}>
                <Ionicons name="search" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Princy analyse le produit...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Score Gagnant</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(result.score) }]}>
                {result.score}/10
              </Text>
              <Text style={styles.verdictText}>
                {result.emoji} {result.verdict}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statLabel}>BSR</Text>
                <Text style={styles.statValue}>{result.bsr}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statLabel}>Vendeurs</Text>
                <Text style={styles.statValue}>{result.vendeurs}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statLabel}>Prix</Text>
                <Text style={styles.statValue}>{result.prix}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📈</Text>
                <Text style={styles.statLabel}>Marge</Text>
                <Text style={styles.statValue}>{result.marge_estimee}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statLabel}>Note</Text>
                <Text style={styles.statValue}>{result.note}/5</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💬</Text>
                <Text style={styles.statLabel}>Avis</Text>
                <Text style={styles.statValue}>{result.avis}</Text>
              </View>
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonTitle}>💡 Analyse de Princy</Text>
              <Text style={styles.reasonText}>{result.raison}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 55,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center'
  },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginTop: 4 },
  content: { flex: 1, padding: SPACING.md },
  searchContainer: { marginBottom: SPACING.lg },
  label: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  scanBtn: { width: 48, height: 48 },
  scanBtnGradient: {
    width: 48, height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: { alignItems: 'center', padding: SPACING.xl },
  loadingText: { color: COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
  errorContainer: {
    backgroundColor: 'rgba(255,23,68,0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  errorText: { color: '#FF1744', fontSize: FONTS.sizes.sm },
  resultContainer: { gap: SPACING.md },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  scoreLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  scoreValue: { fontSize: 48, fontWeight: FONTS.weights.bold, marginVertical: SPACING.xs },
  verdictText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.medium },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  statValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold },
  reasonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl
  },
  reasonTitle: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginBottom: SPACING.xs },
  reasonText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, lineHeight: 20 }
});
