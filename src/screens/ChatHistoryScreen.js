import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView
} from 'react-native';

const API_URL = 'https://sellerpro-backend.onrender.com';

export default function ChatHistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(API_URL + '/chat/history');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Erreur historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderSession = ({ item }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => navigation.navigate('Chat', { session_id: item.session_id })}
    >
      <Text style={styles.sessionDate}>{formatDate(item.last_message_at)}</Text>
      <Text style={styles.sessionPreview} numberOfLines={2}>
        {item.last_message}
      </Text>
      <Text style={styles.sessionCount}>{item.message_count} messages</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF9900" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historique Princy</Text>
      {sessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucune conversation</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.session_id}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF9900',padding: 20 },
  list: { padding: 16 },
  sessionCard: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16,
    marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF9900'
  },
  sessionDate: { color: '#FF9900', fontSize: 12, marginBottom: 6 },
  sessionPreview: { color: '#ffffff', fontSize: 14, marginBottom: 6 },
  sessionCount: { color: '#888', fontSize: 11 },
  emptyText: { color: '#888', fontSize: 16 }
});
