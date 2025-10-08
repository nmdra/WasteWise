import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import { MockCleaner } from '../../services/mockCleanerApi';

export default function CleanerAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    MockCleaner.getAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg.page }} />;
  }

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Daily performance</Text>
          <Text style={styles.subtitle}>Date: {analytics.date}</Text>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Completed</Text>
            <Text style={styles.metricValue}>{analytics.completed}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Missed</Text>
            <Text style={styles.metricValue}>{analytics.missed}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Avg minutes / stop</Text>
            <Text style={styles.metricValue}>{analytics.avgStopMin}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  metric: {
    marginTop: Spacing.lg,
  },
  metricLabel: {
    color: Colors.text.secondary,
  },
  metricValue: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
});
