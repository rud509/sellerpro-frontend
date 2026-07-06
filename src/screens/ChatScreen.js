import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { aiAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { translations } from '../i18n/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_ID = `chat_${Date.now()}`;

const QUICK_ACTIONS_FR = [
  { label: '📊 Analyser mon compte', prompt: 'Analyse mon compte Amazon en détail et dis-moi ce qui va bien et ce que je dois améliorer', amazonData: true },
  { label: '📦 Prévisions stock', prompt: 'Analyse mon inventaire et prédit quels produits vont être en rupture. Dis-moi quoi commander et quand.', amazonData: true },
  { label: '🎯 Concurrents OOS', prompt: 'Y a-t-il des concurrents en rupture de stock en ce moment ? Si oui, quelle stratégie adopter ?', amazonData: false },
  { label: '💰 Calculer ma marge', prompt: 'Pour un produit vendu $25, qui me coûte $8 sur Alibaba et pèse 1 lb, calcule ma marge nette FBA complète.', amazonData: false },
  { label: '🔑 Research produit', prompt: 'Analyse l\'opportunité pour un produit de niche sur Amazon US. Je veux un score d\'opportunité et une analyse complète.', amazonData: false },
  { label: '✉️ Message Alibaba', prompt: 'Rédige un message de premier contact professionnel en anglais pour contacter un fournisseur Alibaba pour commander 500 unités d\'un produit avec un prix cible de $5/unité.', amazonData: false },
  { label: '📈 Rapport semaine', prompt: 'Génère mon rapport hebdomadaire complet avec analyse des ventes, stocks, et recommandations pour la semaine prochaine.', amazonData: true },
  { label: '⭐ Améliorer listing', prompt: 'Comment optimiser mon listing Amazon pour augmenter mes ventes ? Donne-moi des conseils sur le titre, les bullets et les mots-clés.', amazonData: false },
];

const QUICK_ACTIONS_EN = [
  { label: '📊 Analyze account', prompt: 'Analyze my Amazon account in detail and tell me what is going well and what I should improve', amazonData: true },
  { label: '📦 Stock forecast', prompt: 'Analyze my inventory and predict which products will run out. Tell me what to order and when.', amazonData: true },
  { label: '🎯 Competitor OOS', prompt: 'Are any competitors out of stock right now? If so, what strategy should I adopt?', amazonData: false },
  { label: '💰 Calculate margin', prompt: 'For a product sold at $25, costing me $8 on Alibaba and weighing 1 lb, calculate my complete FBA net margin.', amazonData: false },
  { label: '🔑 Product research', prompt: 'Analyze a niche product opportunity on Amazon US. I want an opportunity score and complete analysis.', amazonData: false },
  { label: '✉️ Alibaba message', prompt: 'Write a professional first contact message in English to contact an Alibaba supplier to order 500 units with a target price of $5/unit.', amazonData: false },
  { label: '📈 Weekly report', prompt: 'Generate my complete weekly report with sales analysis, inventory, and recommendations for next week.', amazonData: true },
  { label: '⭐ Improve listing', prompt: 'How can I optimize my Amazon listing to increase sales? Give me advice on title, bullets and keywords.', amazonData: false },
];

export default function ChatScreen({ language = 'fr', navigation }) {
  const t = translations[language];
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: language === 'fr'
        ? '👋 Bonjour ! Je suis Princy. Je peux analyser votre compte Amazon, vous aider à commander sur Alibaba, surveiller vos concurrents, prévoir vos stocks et bien plus encore.\n\n**Que puis-je faire pour vous aujourd\'hui ?**'
        : '👋 Hello! I\'m Princy. I can analyze your Amazon account, help you order from Alibaba, monitor competitors, forecast inventory, and much more.\n\n**What can I do for you today?**'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const quickActions = language === 'fr' ? QUICK_ACTIONS_FR : QUICK_ACTIONS_EN;

  const sendMessage = async (text = null, includeAmazonData = false) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await aiAPI.chat(apiMessages, SESSION_ID, includeAmazonData);
      const aiResponse = typeof response.data === 'string' ? response.data : (response.data?.reply || response.data?.response || 'Désolé, une erreur est survenue.');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'fr'
          ? '❌ Erreur de connexion. Vérifiez que le serveur est en ligne.'
          : '❌ Connection error. Please check that the server is online.'
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.aiContainer]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {isUser ? (
            <Text style={styles.userText}>{item.content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{item.content}</Markdown>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <Text style={styles.headerTitle}>🤖 Princy</Text>
        <Text style={styles.headerSubtitle}>
          {language === 'fr' ? 'Princy' : 'Amazon & Alibaba Assistant'}
        </Text>
     <TouchableOpacity
            onPress={() => navigation.navigate('ChatHistory')}
            style={{alignSelf: 'flex-end', padding: 8}}
          >
            <Text style={{color: '#fff', fontSize: 12}}>📜 Historique</Text>
          </TouchableOpacity>
 </LinearGradient>

      {/* Quick Actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsScroll}
        contentContainerStyle={styles.quickActionsContent}
      >
        {quickActions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.quickActionBtn}
            onPress={() => sendMessage(action.prompt, action.amazonData)}
          >
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingBubble}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.thinking}</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t.chatPlaceholder}
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { opacity: input.trim() ? 1 : 0.5 }]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || isLoading}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.sendBtnGradient}>
            <Ionicons name="send" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginTop: 2 },

  quickActionsScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  quickActionsContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  quickActionBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  quickActionText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.medium, whiteSpace: 'nowrap' },

  messagesList: { flex: 1 },
  messagesContent: { padding: SPACING.md, gap: SPACING.md },

  messageContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  userContainer: { justifyContent: 'flex-end' },
  aiContainer: { justifyContent: 'flex-start' },

  avatar: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  avatarText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },

  bubble: { maxWidth: '82%', borderRadius: RADIUS.lg, padding: SPACING.md },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  userText: { color: '#FFF', fontSize: FONTS.sizes.md, lineHeight: 22 },

  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, paddingLeft: SPACING.xl + 32 },
  loadingText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontStyle: 'italic' },

  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm, backgroundColor: COLORS.surface },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, maxHeight: 100, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 44, height: 44 },
  sendBtnGradient: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center' },
});

const markdownStyles = {
  body: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, lineHeight: 22 },
  heading1: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: 'bold', marginVertical: SPACING.sm },
  heading2: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginVertical: SPACING.xs },
  heading3: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: 'bold', marginVertical: SPACING.xs },
  strong: { color: COLORS.textPrimary, fontWeight: 'bold' },
  em: { color: COLORS.textSecondary, fontStyle: 'italic' },
  bullet_list: { marginVertical: SPACING.xs },
  list_item: { color: COLORS.textPrimary, marginVertical: 2 },
  code_inline: { backgroundColor: COLORS.surfaceLight, color: COLORS.accent, borderRadius: 4, paddingHorizontal: 4 },
  fence: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm, padding: SPACING.sm, marginVertical: SPACING.xs },
  blockquote: { borderLeftWidth: 3, borderLeftColor: COLORS.primary, paddingLeft: SPACING.md, marginVertical: SPACING.xs },
  link: { color: COLORS.primary },
};
