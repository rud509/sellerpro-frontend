import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';

const API_URL = 'https://sellerpro-backend.onrender.com';

export default function ChatHistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const url = API_URL + '/chat/history';
      const response = await fetch(url);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

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
          <Text style={styles.text}>Aucune conversation</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.session_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <Text style={styles.date}>{formatDate(item.last_message_at)}</Text>
              <Text style={styles.preview} numberOfLines={2}>{item.last_message}</Text>
              <Text style={styles.count}>{item.message_count} messages</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF9900', padding: 20 },
  list: { padding: 16 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF9900' },
  date: { color: '#FF9900', fontSize: 12, marginBottom: 6 },
  preview: { color: '#ffffff', fontSize: 14, marginBottom: 6 },
  count: { color: '#888', fontSize: 11 },
  text: { color: '#ffffff', fontSize: 16 }
});
