import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Radii, Spacing, FontSizes } from '../../constants/customerTheme';
import AppHeader from '../../components/app-header';
import Button from '../../components/customer/Button';

export default function MyQR() {
  const router = useRouter();
  const [nonce, setNonce] = useState('');
  const [qrData, setQrData] = useState(null);
  const [userId, setUserId] = useState('');
  let qrRef = null;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      const email = await AsyncStorage.getItem('userEmail');
      setUserId(id || 'guest');
      generateQR(id || 'guest');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const generateQR = (uid) => {
    const timestamp = Date.now();
    const newNonce = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
    const data = {
      accountId: uid,
      binId: 'bin_primary',
      nonce: newNonce,
      type: 'customer_verification',
      timestamp: timestamp,
    };
    setNonce(newNonce);
    setQrData(JSON.stringify(data));
  };

  const handleRefresh = () => {
    generateQR(userId);
    Alert.alert('Success', 'QR code refreshed!');
  };

  const handleShare = async () => {
    try {
      // In a real app, you'd save the QR as an image first
      await Share.share({
        message: `My WasteWise QR Code\nAccount ID: ${userId}\nNonce: ${nonce}`,
        title: 'Share QR Code',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print QR Code',
      'You can:\n\n1. Take a screenshot of this QR code\n2. Share it to your device\n3. Print it from your device\n4. Paste it on your waste bin\n\nMake sure the QR code is clearly visible!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My QR Code</Text>
          <Text style={styles.subtitle}>
            Show this QR to the cleaner during pickup or print and paste it on your bin
          </Text>
        </View>

        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            {qrData ? (
              <QRCode
                value={qrData}
                size={240}
                color={Colors.text.primary}
                backgroundColor={Colors.bg.card}
                getRef={(ref) => (qrRef = ref)}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>Generating QR...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.qrInfo}>
            <Text style={styles.infoLabel}>Account ID</Text>
            <Text style={styles.infoValue}>{userId}</Text>
          </View>

          <View style={styles.qrInfo}>
            <Text style={styles.infoLabel}>QR Code ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {nonce}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Refresh QR"
            onPress={handleRefresh}
            variant="primary"
            fullWidth
            icon="🔄"
          />
          
          <View style={styles.actionRow}>
            <Button
              title="Share"
              onPress={handleShare}
              variant="ghost"
              icon="📤"
            />
            <Button
              title="Print Instructions"
              onPress={handlePrint}
              variant="ghost"
              icon="🖨️"
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 How to Use</Text>
          
          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Screenshot or Print</Text>
              <Text style={styles.stepDesc}>
                Take a screenshot of this QR code or use print instructions
              </Text>
            </View>
          </View>

          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Paste on Bin</Text>
              <Text style={styles.stepDesc}>
                Print and paste it on your waste bin in a visible location
              </Text>
            </View>
          </View>

          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Cleaner Scans</Text>
              <Text style={styles.stepDesc}>
                During pickup, the cleaner will scan your QR code
              </Text>
            </View>
          </View>

          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Auto-Logged</Text>
              <Text style={styles.stepDesc}>
                Pickup is automatically recorded to your account
              </Text>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityCard}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityTitle}>Security Note</Text>
          <Text style={styles.securityText}>
            This QR code is linked to your account. For security, refresh it periodically or if you suspect unauthorized use.
          </Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
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
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  qrCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.xl,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: Colors.text.muted,
    fontSize: FontSizes.body,
  },
  qrInfo: {
    width: '100%',
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radii.small,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    marginBottom: Spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    justifyContent: 'space-between',
  },
  instructionsCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.lg,
  },
  instructionsTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepText: {
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: FontSizes.body,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepDesc: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  securityCard: {
    backgroundColor: Colors.brand.lightGreen,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  securityTitle: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  securityText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
