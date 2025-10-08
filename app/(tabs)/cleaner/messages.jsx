import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';

export default function CleanerMessages() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    MockCleaner.getMessages().then((data) => setMessages(data.reverse()));
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages((prev) => [
      { id: `me_${Date.now()}`, from: 'Me', text, time: 'now' },
      ...prev,
    ]);
    setText('');
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />

      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.bubble}>
            <Text style={styles.from}>{item.from}</Text>
            <Text style={styles.body}>{item.text}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.send} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  list: {
    flex: 1,
  },
  bubble: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
  },
  from: {
    fontWeight: '700',
    color: Colors.text.primary,
  },
  body: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  time: {
    marginTop: Spacing.xs,
    color: Colors.text.muted,
    fontSize: FontSizes.tiny,
  },
  inputRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.bg.card,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bg.card,
  },
  send: {
    backgroundColor: Colors.role.cleaner,
    borderRadius: Radii.btn,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  sendText: {
    color: Colors.text.white,
    fontWeight: '700',
  },
});
