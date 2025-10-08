import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChange } from '../services/auth';

// Quick reachability check for Firestore (used only on web to detect blocking extensions)
const checkFirestoreReachability = async (timeout = 2500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    // Use a lightweight GET to the Firestore REST root; keep it anonymous (no API key here),
    // we only need to know if the domain is reachable.
    const res = await fetch('https://firestore.googleapis.com/', { signal: controller.signal });
    clearTimeout(id);
    return res.ok || res.status === 400 || res.status === 403;
  } catch (err) {
    clearTimeout(id);
    return false;
  }
};

export default function SplashScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if user has seen onboarding
    let authUnsubscribe;
    let timeoutId;

    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const storedRole = await AsyncStorage.getItem('userRole');

        // On web, do a quick Firestore reachability check. Many adblock/privacy extensions
        // will block requests to firestore.googleapis.com and produce net::ERR_BLOCKED_BY_CLIENT.
        // Detect that and show a helpful alert rather than silently failing later.
        const isBlocked =
          Platform.OS === 'web' ? await checkFirestoreReachability().catch(() => true) : false;

        timeoutId = setTimeout(() => {
          if (!hasSeenOnboarding) {
            // First time user - show onboarding
            router.replace('/onboarding');
          } else {
            // Listen to Firebase auth state to decide navigation
            authUnsubscribe = onAuthStateChange(async (firebaseUser) => {
              if (authUnsubscribe) {
                authUnsubscribe();
                authUnsubscribe = undefined;
              }

              if (isBlocked) {
                // Show clear instructions to the developer/user about browser extensions
                Alert.alert(
                  'Network Blocked',
                  'Requests to Firebase/Firestore appear to be blocked by a browser extension or privacy tool.\n\nPlease disable ad-blocking/privacy extensions or whitelist the following domains: firestore.googleapis.com and *.firebaseapp.com. Alternatively test in an incognito window or use the Firestore emulator for local development.',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        await AsyncStorage.multiRemove([
                          'userToken',
                          'userId',
                          'userEmail',
                          'userFirstName',
                          'userRole',
                        ]);
                        router.replace('/login');
                      },
                    },
                  ],
                  { cancelable: false }
                );
                return;
              }

              if (!firebaseUser) {
                await AsyncStorage.multiRemove([
                  'userToken',
                  'userId',
                  'userEmail',
                  'userFirstName',
                  'userRole',
                ]);
                router.replace('/login');
                return;
              }

              const role = storedRole === 'cleaner' ? 'cleaner' : 'customer';
              if (role === 'cleaner') {
                router.replace('/(tabs)/cleaner/home');
              } else {
                router.replace('/customer/home');
              }
            });
          }
        }, 1500);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        router.replace('/onboarding');
      }
    };

    checkOnboarding();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, []);

  return (
    <LinearGradient colors={['#16A34A', '#0F766E']} style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <View style={styles.logoWrap}>
          {/* Placeholder for logo - replace with your actual logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoEmoji}>♻️</Text>
          </View>
        </View>
        <Text style={styles.appName}>WasteWise</Text>
        <Text style={styles.tagline}>Smart Waste • Clean Cities</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 28,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 64,
  },
  appName: {
    marginTop: 20,
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
