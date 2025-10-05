import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../../../components/app-header';

export default function CleanerStops() {
  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      <View style={styles.content}>
        <Text style={styles.title}>📋 Stops List</Text>
        <Text style={styles.subtitle}>View and manage all pickup stops</Text>
        <Text style={styles.coming}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0B1220',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  coming: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
