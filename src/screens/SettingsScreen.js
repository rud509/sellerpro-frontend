// ==================== SETTINGS SCREEN ====================
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { translations } from '../i18n/translations';
import { showMessage } from 'react-native-flash-message';
import api from '../services/api';

export default function SettingsScreen({ language = 'fr', setLanguage, navigation }) {
  const t = translations[language];
  const [backendUrl, setBackendUrl] = useState('https://sellerpro-backend.onrender.com');
  const [stockThreshold, setStockThreshold] = useState('15');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(['backendUrl', 'stockThreshold', 'notifEnabled']).then(results => {
      results.forEach(([key, val]) => {
        if (key === 'backendUrl' && val) setBackendUrl(val);
        if (key === 'stockThreshold' && val) setStockThreshold(val);
        if (key === 'notifEnabled' && val) setNotifEnabled(val === 'true');
      });
    });
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await api.get('/health');
      if (res.data?.status === 'healthy') {
        setConnectionStatus('connected');
        showMessage({ message: '✅ Serveur connecté !', type: 'success' });
      } else {
        setConnectionStatus('disconnected');
      }
    } catch(e) {
      setConnectionStatus('disconnected');
      showMessage({ message: '❌ Impossible de se connecter au serveur', type: 'danger' });
    }
    finally { setTesting(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    await AsyncStorage.multiSet([
      ['backendUrl', backendUrl],
      ['stockThreshold', stockThreshold],
      ['notifEnabled', notifEnabled.toString()],
      ['language', language],
    ]);
    setSaving(false);
    showMessage({ message: `✅ ${t.saved}`, type: 'success' });
  };

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    AsyncStorage.setItem('language', lang);
  };

  return (
    <ScrollView style={set.container}>
      <LinearGradient colors={GRADIENTS.primary} style={set.header}>
        <Text style={set.headerTitle}>⚙️ {t.settings}</Text>
      </LinearGradient>

      <View style={set.content}>
        {/* Language */}
        <View style={set.section}>
          <Text style={set.sectionTitle}>🌐 {t.language}</Text>
          <View style={set.langRow}>
            <TouchableOpacity style={[set.langBtn, language==='fr' && set.langActive]} onPress={() => toggleLanguage('fr')}>
              <Text style={[set.langText, language==='fr' && set.langTextActive]}>🇫🇷 Français</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[set.langBtn, language==='en' && set.langActive]} onPress={() => toggleLanguage('en')}>
              <Text style={[set.langText, language==='en' && set.langTextActive]}>🇺🇸 English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server URL */}
        <View style={set.section}>
          <Text style={set.sectionTitle}>🖥️ {t.backendUrl}</Text>
          <TextInput style={set.input} value={backendUrl} onChangeText={setBackendUrl} placeholder="https://..." placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />
          <TouchableOpacity style={set.testBtn} onPress={testConnection} disabled={testing}>
            {testing ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={set.testBtnText}>{t.testConnection}</Text>}
          </TouchableOpacity>
          {connectionStatus && (
            <Text style={[set.statusText, { color: connectionStatus === 'connected' ? COLORS.success : COLORS.danger }]}>
              {connectionStatus === 'connected' ? t.connected : t.disconnected}
            </Text>
          )}
        </View>

        {/* Notifications */}
        <View style={set.section}>
          <Text style={set.sectionTitle}>🔔 {t.pushNotifications}</Text>
          <View style={set.row}>
            <Text style={set.rowLabel}>{t.pushNotifications}</Text>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={notifEnabled ? '#FFF' : COLORS.textMuted} />
          </View>
          <Text style={set.label}>{t.stockThreshold}</Text>
          <TextInput style={set.input} value={stockThreshold} onChangeText={setStockThreshold} keyboardType="number-pad" placeholder="15" placeholderTextColor={COLORS.textMuted} />
        </View>

        {/* Save */}
        <TouchableOpacity onPress={saveSettings} disabled={saving}>
          <LinearGradient colors={GRADIENTS.primary} style={set.saveBtn}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={set.saveBtnText}>💾 {t.save}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* App info */}
        <View style={set.infoCard}>
          <Text style={set.infoTitle}>SellerPro</Text>
          <Text style={set.infoSub}>{t.version} 1.0.0</Text>
          <Text style={set.infoSub}>Amazon US · Claude AI · Supabase</Text>
        </View>
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const set = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xl },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: SPACING.xs },
  label: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  langRow: { flexDirection: 'row', gap: SPACING.md },
  langBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  langActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
  langText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  langTextActive: { color: COLORS.primary },
  testBtn: { backgroundColor: COLORS.surfaceLight, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  testBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  statusText: { textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  saveBtn: { padding: SPACING.lg, borderRadius: RADIUS.lg, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center' },
  infoTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  infoSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: SPACING.xs },
});
