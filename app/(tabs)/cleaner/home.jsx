import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';
import ActionBar from '../../../components/cleaner/ActionBar';
import { getStopStats } from '../../../services/stopsService';

export default function CleanerHome() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [todaySchedule, setTodaySchedule] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', role: 'cleaner' });

  useEffect(() => {
    loadTodayRoute();
    loadUserInfo();
  }, [user]);

  const loadUserInfo = async () => {
    setUserInfo({
      name: user?.displayName || 'Collector',
      role: 'cleaner',
    });
  };

  const loadTodayRoute = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // Find today's schedule created by this collector
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('collectorId', '==', user.uid),
        where('date', '==', today),
        where('status', '==', 'active'),
        limit(1)
      );

      const snapshot = await getDocs(schedulesQuery);
      
      if (!snapshot.empty) {
        const scheduleDoc = snapshot.docs[0];
        const scheduleData = {
          id: scheduleDoc.id,
          ...scheduleDoc.data(),
        };
        
        setTodaySchedule(scheduleData);
        
        // Load stop stats for this schedule
        const stopStats = await getStopStats(scheduleDoc.id);
        setStats(stopStats);
      } else {
        setTodaySchedule(null);
        setStats(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading today route:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
        <AppHeader userName={userInfo.name} userRole={userInfo.role} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading today's route...</Text>
        </View>
      </View>
    );
  }

  const progressPct = stats && stats.total > 0
    ? Math.round((stats.collected / stats.total) * 100)
    : 0;

  // Show "no schedule" state if no schedule for today
  if (!todaySchedule) {
    return (
      <View style={styles.container}>
        <AppHeader userName={userInfo.name} userRole={userInfo.role} />
        
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroGreeting}>Today's Route 🚛</Text>
            <Text style={styles.heroSubtitle}>No schedule for today</Text>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Collection Schedule</Text>
            <Text style={styles.emptyText}>
              You don't have any active collection schedules for today.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/cleaner/manage-schedule')}
            >
              <Text style={styles.createButtonText}>Create Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewSchedulesButton}
              onPress={() => router.push('/(tabs)/cleaner/my-schedules')}
            >
              <Text style={styles.viewSchedulesButtonText}>View All Schedules</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const completed = stats?.collected || 0;
  const remaining = stats?.pending || 0;
  const totalStops = stats?.total || 0;

  return (
    <View style={styles.container}>
      <AppHeader userName={userInfo.name} userRole={userInfo.role} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>Today's Route 🚛</Text>
          <Text style={styles.heroSubtitle}>
            Zone {todaySchedule.zone} • {totalStops} stops scheduled
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Progress</Text>
          <Text style={styles.cardSubtitle}>
            {todaySchedule.area} • {new Date(todaySchedule.date).toLocaleDateString()}
          </Text>

          <View style={styles.statsRow}>
            <StatBlock label="Completed" value={completed} tint={Colors.state.success} />
            <StatBlock label="Remaining" value={remaining} tint={Colors.state.warning} />
            <StatBlock label="Total" value={totalStops} tint={Colors.text.primary} />
          </View>

          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPct}% complete</Text>

          <ActionBar
            items={[
              { label: 'View Details', kind: 'primary', onPress: () => router.push(`/(tabs)/cleaner/schedule-details?id=${todaySchedule.id}`) },
              { label: 'Manage Schedule', onPress: () => router.push('/(tabs)/cleaner/manage-schedule') },
              { label: 'All Schedules', onPress: () => router.push('/(tabs)/cleaner/my-schedules') },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 Zone:</Text>
              <Text style={styles.infoValue}>{todaySchedule.zone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🏘️ Area:</Text>
              <Text style={styles.infoValue}>{todaySchedule.area}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⏰ Time:</Text>
              <Text style={styles.infoValue}>
                {todaySchedule.timeRanges?.map(r => `${r.start} - ${r.end}`).join(', ')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🗑️ Waste Types:</Text>
              <Text style={styles.infoValue}>
                {todaySchedule.wasteTypes?.join(', ') || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/(tabs)/cleaner/schedule-details?id=${todaySchedule.id}`)}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>View All Stops</Text>
              <Text style={styles.actionSubtitle}>See complete stop list and mark collections</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/cleaner/my-schedules')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>My Schedules</Text>
              <Text style={styles.actionSubtitle}>View all your collection schedules</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.card,
    marginBottom: Spacing.md,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  viewSchedulesButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewSchedulesButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '700',
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
  infoCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  infoLabel: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.md,
  },
  actionIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  actionTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  actionSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: FontSizes.h2,
    color: Colors.primary,
    fontWeight: '700',
  },
});
