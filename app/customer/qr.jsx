import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View, ActivityIndicator, Platform, Modal, TextInput, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/app-header';
import Button from '../../components/customer/Button';
import { Colors, FontSizes, Radii, Spacing } from '../../constants/customerTheme';
import { getBinById, updateBin, deleteBinCompletely, BIN_CATEGORIES } from '../../services/binService.optimized';

export default function MyQR() {
  const router = useRouter();
  const { binId } = useLocalSearchParams(); // Get Firestore document ID from route params
  const [nonce, setNonce] = useState('');
  const [qrData, setQrData] = useState(null);
  const [userId, setUserId] = useState('');
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBin, setEditingBin] = useState(null);
  const [deletingBin, setDeletingBin] = useState(false);
  const qrRef = useRef(null);

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
      if (!qrRef.current) {
        Alert.alert('Error', 'QR code not ready. Please try again.');
        return;
      }

      // Get QR code as base64
      qrRef.current.toDataURL(async (dataURL) => {
        try {
          const binInfo = bin ? `${BIN_CATEGORIES[bin.category]?.label || bin.category} Bin` : 'Account';
          const filename = `WasteWise_QR_${binInfo.replace(/\s/g, '_')}_${Date.now()}.png`;
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;

          // Write base64 to file
          await FileSystem.writeAsStringAsync(fileUri, dataURL, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: 'Share QR Code',
              UTI: 'public.png',
            });
          } else {
            // Fallback to text sharing
            const binDetails = bin ? `\nBin: ${bin.category} (${binId})` : '';
            await Share.share({
              message: `My WasteWise QR Code\nAccount ID: ${userId}${binDetails}\nNonce: ${nonce}`,
              title: 'Share QR Code',
            });
          }
        } catch (error) {
          console.error('Error sharing QR code:', error);
          Alert.alert('Error', 'Failed to share QR code');
        }
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print QR Code',
      'You can:\n\n1. Take a screenshot of this QR code\n2. Share it to your device\n3. Print it from your device\n4. Paste it on your waste bin\n\nMake sure the QR code is clearly visible!',
      [{ text: 'OK' }]
    );
  };

  const handleEditBin = () => {
    if (!bin) return;
    setEditingBin({
      ...bin,
      description: bin.description || '',
      location: bin.location || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBin) return;

    try {
      const updates = {
        category: editingBin.category,
        description: editingBin.description.trim(),
        location: editingBin.location.trim(),
      };

      const result = await updateBin(editingBin.id, updates);

      if (result.success) {
        Alert.alert('Success', 'Bin updated successfully');
        setEditingBin(null);
        // Refresh bin data
        await loadBinData();
      } else {
        Alert.alert('Error', 'Failed to update bin');
      }
    } catch (error) {
      console.error('Error updating bin:', error);
      Alert.alert('Error', 'Failed to update bin');
    }
  };

  const handleDeleteBin = () => {
    if (!bin) return;

    Alert.alert(
      'Delete Bin',
      `Are you sure you want to delete bin "${bin.binId}"? This action cannot be undone and will remove the bin from all future collection schedules.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingBin(true);
              const result = await deleteBinCompletely(bin.id);

              if (result.success) {
                Alert.alert('Success', 'Bin deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/customer/bins')
                  }
                ]);
              } else {
                Alert.alert('Error', 'Failed to delete bin');
              }
            } catch (error) {
              console.error('Error deleting bin:', error);
              Alert.alert('Error', 'Failed to delete bin');
            } finally {
              setDeletingBin(false);
            }
          }
        }
      ]
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
                  getRef={(ref) => (qrRef.current = ref)}
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
          
          {bin && (
            <View style={styles.managementActions}>
              <Button
                title="Edit Bin"
                onPress={handleEditBin}
                variant="outline"
                icon="✏️"
                style={styles.managementButton}
              />
              <Button
                title="Delete Bin"
                onPress={handleDeleteBin}
                variant="outline"
                icon="🗑️"
                style={[styles.managementButton, styles.deleteButton]}
                disabled={deletingBin}
              />
            </View>
          )}
          
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

      {/* Edit Bin Modal */}
      {editingBin && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditingBin(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.editModalContent]}>
              <Text style={styles.modalTitle}>Edit Bin Details</Text>
              
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bin Code</Text>
                  <Text style={styles.binCodeDisplay}>{editingBin.binId}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categorySelector}>
                    {Object.entries(BIN_CATEGORIES).map(([key, category]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.categoryOption,
                          editingBin.category === key && styles.categoryOptionSelected
                        ]}
                        onPress={() => setEditingBin({...editingBin, category: key})}
                      >
                        <Text style={styles.categoryEmoji}>{category.icon}</Text>
                        <Text style={[
                          styles.categoryLabel,
                          editingBin.category === key && styles.categoryLabelSelected
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingBin.description}
                    onChangeText={(text) => setEditingBin({...editingBin, description: text})}
                    placeholder="Add a description for this bin"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingBin.location}
                    onChangeText={(text) => setEditingBin({...editingBin, location: text})}
                    placeholder="Where is this bin located?"
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setEditingBin(null)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalButtonTextConfirm}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  managementActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  managementButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: Colors.state.error,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  modalButtonTextConfirm: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: '#fff',
  },
  // Edit modal styles
  editModalContent: {
    maxHeight: '80%',
  },
  editForm: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.small,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.light,
    minHeight: 40,
  },
  binCodeDisplay: {
    fontSize: FontSizes.body,
    fontFamily: 'monospace',
    color: Colors.text.secondary,
    backgroundColor: Colors.bg.light,
    padding: Spacing.md,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    flex: 1,
    minWidth: 80,
    padding: Spacing.md,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.brand.lightGreen,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
