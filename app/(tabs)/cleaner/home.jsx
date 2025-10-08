import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';
import ActionBar from '../../../components/cleaner/ActionBar';

export default function CleanerHome() {
  const router = useRouter();
  const [routeOverview, setRouteOverview] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: '', role: 'cleaner' });

  useEffect(() => {
    MockCleaner.getRouteOverview().then(setRouteOverview);
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const firstName = await AsyncStorage.getItem('userFirstName');
      setUserInfo({
        name: firstName || 'Cleaner',
        role: 'cleaner',
      });
    } catch (error) {
      console.error('Error loading cleaner info:', error);
    }
  };

  if (!routeOverview) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg.page }} />;
  }

  const progressPct = Math.round(
    (routeOverview.completed / routeOverview.totalStops) * 100,
  );

  return (
    <View style={styles.container}>
      <AppHeader userName={userInfo.name} userRole={userInfo.role} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>Today’s Route 🚛</Text>
          <Text style={styles.heroSubtitle}>
            Zone {routeOverview.zone} • {routeOverview.totalStops} stops scheduled
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Progress</Text>
          <Text style={styles.cardSubtitle}>
            Route {routeOverview.routeId} • {routeOverview.date}
          </Text>

          <View style={styles.statsRow}>
            <StatBlock label="Completed" value={routeOverview.completed} tint={Colors.state.success} />
            <StatBlock label="Remaining" value={routeOverview.remaining} tint={Colors.state.warning} />
            <StatBlock label="Total" value={routeOverview.totalStops} tint={Colors.text.primary} />
          </View>

          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPct}% complete</Text>

          <ActionBar
            items={[
              { label: 'Navigate', kind: 'primary', onPress: () => router.push('/(tabs)/cleaner/map') },
              { label: 'Scan QR', onPress: () => router.push('/cleaner/qr') },
              { label: 'Checklist', onPress: () => router.push('/cleaner/checklist') },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next stops</Text>
          {routeOverview.next.map((stop) => (
            <View key={stop.stopId} style={styles.stopCard}>
              <View style={styles.stopBadge}>
                <Text style={styles.stopBadgeText}>{stop.stopId.replace('s_', '#')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopLabel}>{stop.label}</Text>
                <Text style={styles.stopMeta}>
                  {stop.distKm} km • {stop.priority}
                </Text>
              </View>
              <Text style={styles.stopNavigate}>→</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shift details</Text>
          <View style={styles.shiftCard}>
            <Text style={styles.shiftTime}>06:30 - 14:30</Text>
            <Text style={styles.shiftNote}>Break 12:00 - 12:30</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBlock({ label, value, tint }) {
  return (
    <View style={statStyles.wrap}>
      <Text style={[statStyles.value, { color: tint }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  scroll: {
    flex: 1,
  },
  heroCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  heroGreeting: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  heroSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
    fontSize: FontSizes.body,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  progressWrap: {
    height: 10,
    borderRadius: Radii.small,
    backgroundColor: Colors.bg.light,
    overflow: 'hidden',
    marginVertical: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.role.cleaner,
  },
  progressText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.sm,
  },
  stopBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stopBadgeText: {
    color: Colors.role.cleaner,
    fontWeight: '700',
  },
  stopLabel: {
    fontWeight: '700',
    color: Colors.text.primary,
    fontSize: FontSizes.body,
  },
  stopMeta: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
    fontSize: FontSizes.small,
  },
  stopNavigate: {
    color: Colors.role.cleaner,
    fontWeight: '700',
    fontSize: FontSizes.h3,
  },
  shiftCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  shiftTime: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.role.cleaner,
  },
  shiftNote: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
});
