import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const userToken = await AsyncStorage.getItem('userToken');
        const userRole = await AsyncStorage.getItem('userRole');

        setTimeout(() => {
          if (!hasSeenOnboarding) {
            // First time user - show onboarding
            router.replace('/onboarding');
          } else if (!userToken) {
            // Seen onboarding but not logged in
            router.replace('/login');
          } else {
            // Logged in user - go to role-specific home
            if (userRole === 'cleaner') {
              router.replace('/(tabs)/cleaner/home');
            } else {
              router.replace('/(tabs)/customer/home');
            }
          }
        }, 1500);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        router.replace('/onboarding');
      }
    };

    checkOnboarding();
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
