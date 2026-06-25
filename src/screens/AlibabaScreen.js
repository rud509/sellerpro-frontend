import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, FlatList, Clipboard, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { alibabaAPI, aiAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { showMessage } from 'react-native-flash-message';

const STAGES = [
  { key: 'initial', label: '1️⃣ Premier contact', en: '1️⃣ Initial Contact' },
  { key: 'counter_offer', label: '2️⃣ Contre-offre', en: '2️⃣ Counter Offer' },
  { key: 'closing', label: '3️⃣ Clôture', en: '3️⃣ Closing' },
  { key: 'quality', label: '4️⃣ Qualité', en: '4️⃣ Quality Check' },
];

export default function AlibabaScreen({ language = 'fr', navigation }) {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [stage, setStage] = useState('initial');
  const [productName, setProductName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [prevOffer, setPrevOffer] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      const res = await alibabaAPI.getNegotiations();
      setNegotiations(res.data?.data || []);
    } catch(e) { console.log(e); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const generateMessage = async () => {
    if (!productName || !targetPrice || !quantity) {
      showMessage({ message: language==='fr'?'Remplissez tous les champs !':'Fill all fields!', type: 'warning' });
      return;
    }
    setGenerating(true);
    try {
      const res = await aiAPI.negotiate({
        product_name: productName,
        target_price: parseFloat(targetPrice),
        quantity: parseInt(quantity),
        supplier_name: supplierName || 'Supplier',
        negotiation_stage: stage,
        previous_offer: prevOffer ? parseFloat(prevOffer) : null,
        language: 'english'
      });
      setGeneratedMsg(res.data?.data?.message || '');

      // Sauvegarder dans DB
      await alibabaAPI.createNegotiation({
        product_name: productName,
        supplier_name: supplierName,
        target_price: parseFloat(targetPrice),
        quantity: parseInt(quantity),
        stage: stage,
      });
      loadData();
    } catch(e) {
      showMessage({ message: '❌ Erreur lors de la génération', type: 'danger' });
    }
    finally { setGenerating(false); }
  };

  const copyMessage = () => {
    Clipboard.setString(generatedMsg);
    showMessage({ message: language==='fr'?'✅ Message copié !':'✅ Message copied!', type: 'success' });
  };

  if (loading) return <View style={al.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <View style={al.container}>
      <LinearGradient colors={GRADIENTS.primary} style={al.header}>
        <View style={al.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={al.headerTitle}>🏭 Alibaba</Text>
            <Text style={al.headerSub}>{language==='fr'?'Négociation IA':'AI Negotiation'}</Text>
          </View>
          <TouchableOpacity style={al.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={negotiations}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
        ListHeaderComponent={negotiations.length > 0 ? (
          <Text style={al.listTitle}>{language==='fr'?'Négociations en cours':'Active Negotiations'}</Text>
        ) : null}
        renderItem={({ item }) => (
          <View style={al.negCard}>
            <View style={al.negHeader}>
              <Text style={al.negProduct}>{item.product_name}</Text>
              <Text style={al.negStage}>{item.stage}</Text>
            </View>
            <View style={al.negDetails}>
              <Text style={al.negDetail}>🏭 {item.supplier_name}</Text>
              <Text style={al.negDetail}>🎯 ${item.target_price}/unit</Text>
              <Text style={al.negDetail}>📦 {item.quantity} units</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={al.empty}>
            <Text style={al.emptyIcon}>🏭</Text>
            <Text style={al.emptyText}>{language==='fr'?'Aucune négociation.\nCommencez en cliquant sur + !':'No negotiations yet.\nClick + to start!'}</Text>
          </View>
        }
      />

      {/* Modal Génération */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={al.modalBg}>
          <ScrollView style={al.modal} showsVerticalScrollIndicator={false}>
            <Text style={al.modalTitle}>✉️ {language==='fr'?'Générer un Message':'Generate Message'}</Text>

            {/* Stage selector */}
            <Text style={al.inputLabel}>{language==='fr'?'Étape de négociation :':'Negotiation Stage:'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={al.stageScroll}>
              {STAGES.map(s => (
                <TouchableOpacity key={s.key} style={[al.stageBtn, stage===s.key && al.stageActive]} onPress={() => setStage(s.key)}>
                  <Text style={[al.stageText, stage===s.key && al.stageTextActive]}>{language==='fr'?s.label:s.en}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={al.inputLabel}>{language==='fr'?'Produit :':'Product:'}</Text>
            <TextInput style={al.input} value={productName} onChangeText={setProductName} placeholder={language==='fr'?'ex: Bluetooth Speaker':'ex: Bluetooth Speaker'} placeholderTextColor={COLORS.textMuted} />

            <Text style={al.inputLabel}>{language==='fr'?'Fournisseur :':'Supplier:'}</Text>
            <TextInput style={al.input} value={supplierName} onChangeText={setSupplierName} placeholder="Shenzhen Electronics Co." placeholderTextColor={COLORS.textMuted} />

            <Text style={al.inputLabel}>{language==='fr'?'Prix cible ($/unité) :':'Target Price ($/unit):'}</Text>
            <TextInput style={al.input} value={targetPrice} onChangeText={setTargetPrice} keyboardType="decimal-pad" placeholder="5.50" placeholderTextColor={COLORS.textMuted} />

            <Text style={al.inputLabel}>{language==='fr'?'Quantité (unités) :':'Quantity (units):'}</Text>
            <TextInput style={al.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="500" placeholderTextColor={COLORS.textMuted} />

            {(stage === 'counter_offer' || stage === 'closing') && (
              <>
                <Text style={al.inputLabel}>{language==='fr'?'Offre précédente ($) :':'Previous Offer ($):'}</Text>
                <TextInput style={al.input} value={prevOffer} onChangeText={setPrevOffer} keyboardType="decimal-pad" placeholder="7.00" placeholderTextColor={COLORS.textMuted} />
              </>
            )}

            <TouchableOpacity style={al.generateBtn} onPress={generateMessage} disabled={generating}>
              <LinearGradient colors={GRADIENTS.primary} style={al.generateBtnInner}>
                {generating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={al.generateBtnText}>🤖 {language==='fr'?'Générer le message':'Generate Message'}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {/* Message généré */}
            {generatedMsg ? (
              <View style={al.messageBox}>
                <View style={al.messageHeader}>
                  <Text style={al.messageTitle}>{language==='fr'?'✉️ Message généré :':'✉️ Generated Message:'}</Text>
                  <TouchableOpacity style={al.copyBtn} onPress={copyMessage}>
                    <Ionicons name="copy" size={18} color={COLORS.primary} />
                    <Text style={al.copyText}>{language==='fr'?'Copier':'Copy'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={al.messageText}>{generatedMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={al.closeBtn} onPress={() => setShowModal(false)}>
              <Text style={al.closeBtnText}>{language==='fr'?'Fermer':'Close'}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      <View style={{ height: 80 }} />
    </View>
  );
}

const al = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm },
  addBtn: { padding: SPACING.xs },
  listTitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.sm },
  negCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  negHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  negProduct: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '600', flex: 1 },
  negStage: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600', backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  negDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  negDetail: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: FONTS.sizes.md, lineHeight: 24 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SPACING.xl, maxHeight: '92%' },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: 'bold', marginBottom: SPACING.lg },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xs },
  stageScroll: { marginBottom: SPACING.md },
  stageBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  stageActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stageText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  stageTextActive: { color: '#FFF' },
  generateBtn: { marginTop: SPACING.md },
  generateBtnInner: { padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  generateBtnText: { color: '#FFF', fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  messageBox: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '40' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  messageTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  copyText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  messageText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 22 },
  closeBtn: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  closeBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
});
