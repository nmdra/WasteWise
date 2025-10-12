import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AppHeader from '../../components/app-header';
import Button from '../../components/customer/Button';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { getBinById, BIN_CATEGORIES } from '../../services/binService';

export default function MyQR() {
  const router = useRouter();
  const { binId } = useLocalSearchParams(); // Get Firestore document ID from route params
  const [nonce, setNonce] = useState('');
  const [qrData, setQrData] = useState(null);
  const [userId, setUserId] = useState('');
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);
  let qrRef = null;

  useEffect(() => {
    loadBinData();
  }, [binId]);

  const loadBinData = async () => {
    try {
      setLoading(true);
      const id = await AsyncStorage.getItem('userId');
      setUserId(id || 'guest');

      if (binId) {
        // Load bin details from Firestore
        const binData = await getBinById(binId);
        if (binData) {
          setBin(binData);
          generateQR(id || 'guest', binId, binData);
        } else {
          Alert.alert('Error', 'Bin not found');
          router.back();
        }
      } else {
        // Fallback to generic account QR if no binId provided
        generateQR(id || 'guest', null, null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading bin data:', error);
      Alert.alert('Error', 'Failed to load bin details');
      setLoading(false);
    }
  };

  const generateQR = (uid, firestoreBinId, binData) => {
    const timestamp = Date.now();
    const newNonce = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
    const data = {
      accountId: uid,
      binId: firestoreBinId || 'bin_primary', // Use Firestore document ID
      binCategory: binData?.category || null,
      nonce: newNonce,
      type: firestoreBinId ? 'bin_qr' : 'customer_verification',
      timestamp: timestamp,
    };
    setNonce(newNonce);
    setQrData(JSON.stringify(data));
  };

  const handleRefresh = () => {
    generateQR(userId, binId, bin);
    Alert.alert('Success', 'QR code refreshed!');
  };

  const handleShare = async () => {
    try {
      const binInfo = bin ? `\nBin: ${bin.category} (${binId})` : '';
      await Share.share({
        message: `My WasteWise QR Code\nAccount ID: ${userId}${binInfo}\nNonce: ${nonce}`,
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading bin QR code...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {bin ? `${BIN_CATEGORIES[bin.category]?.label || bin.category} Bin QR` : 'My QR Code'}
            </Text>
            <Text style={styles.subtitle}>
              {bin 
                ? 'Show this QR to the collector during pickup or print and paste it on your bin'
                : 'Show this QR to the cleaner during pickup or print and paste it on your bin'
              }
            </Text>
          </View>

          {/* Bin Details Card */}
          {bin && (
            <View style={styles.binDetailsCard}>
              <View style={styles.binDetailRow}>
                <View style={[
                  styles.categoryIconLarge,
                  { backgroundColor: BIN_CATEGORIES[bin.category]?.color || Colors.primary }
                ]}>
                  <Text style={styles.categoryEmojiLarge}>
                    {BIN_CATEGORIES[bin.category]?.icon || '🗑️'}
                  </Text>
                </View>
                <View style={styles.binDetailInfo}>
                  <Text style={styles.binDetailCategory}>
                    {BIN_CATEGORIES[bin.category]?.label || bin.category}
                  </Text>
                  {bin.description && (
                    <Text style={styles.binDetailDescription}>{bin.description}</Text>
                  )}
                  {bin.location && (
                    <Text style={styles.binDetailLocation}>📍 {bin.location}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.binStatsRow}>
                <View style={styles.binStat}>
                  <Text style={styles.binStatValue}>{bin.scanCount || 0}</Text>
                  <Text style={styles.binStatLabel}>Scans</Text>
                </View>
                <View style={styles.binStat}>
                  <Text style={[
                    styles.binStatValue,
                    { color: bin.isActive ? Colors.state.success : Colors.state.error }
                  ]}>
                    {bin.isActive ? 'Active' : 'Inactive'}
                  </Text>
                  <Text style={styles.binStatLabel}>Status</Text>
                </View>
              </View>
            </View>
          )}

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
              <Text style={styles.infoLabel}>{bin ? 'Bin ID (Firestore)' : 'QR Code ID'}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {bin ? binId : nonce}
              </Text>
            </View>

            {bin && (
              <View style={styles.qrInfo}>
                <Text style={styles.infoLabel}>Custom Bin ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {bin.binId}
                </Text>
              </View>
            )}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg.page,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
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
  binDetailsCard: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.xl,
  },
  binDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIconLarge: {
    width: 60,
    height: 60,
    borderRadius: Radii.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmojiLarge: {
    fontSize: 32,
  },
  binDetailInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  binDetailCategory: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  binDetailDescription: {
    fontSize: FontSizes.body,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  binDetailLocation: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  binStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  binStat: {
    flex: 1,
    alignItems: 'center',
  },
  binStatValue: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  binStatLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
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
