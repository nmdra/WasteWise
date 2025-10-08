import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AppHeader from '../../../components/app-header';
import { Colors, Radii, Spacing, FontSizes } from '../../../constants/customerTheme';

const ISSUE_TYPES = ['Missing Bin', 'Damaged Tag', 'Overflow', 'Hazardous Waste'];

export default function ReportIssueScreen() {
  const router = useRouter();
  const [binId, setBinId] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!binId || !selectedIssue || !description) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', 'Issue reported successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader userName="Cleaner" userRole="cleaner" />
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Bin ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Bin ID"
            value={binId}
            onChangeText={setBinId}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Issue Type</Text>
          <View style={styles.issueGrid}>
            {ISSUE_TYPES.map((issue) => (
              <TouchableOpacity
                key={issue}
                style={[
                  styles.issueBtn,
                  selectedIssue === issue && styles.issueBtnActive,
                ]}
                onPress={() => setSelectedIssue(issue)}
              >
                <Text
                  style={[
                    styles.issueBtnText,
                    selectedIssue === issue && styles.issueBtnTextActive,
                  ]}
                >
                  {issue}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue in detail..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Upload Photo/Video</Text>
          <TouchableOpacity style={styles.uploadBox}>
            <MaterialIcons name="cloud-upload" size={32} color={Colors.text.muted} />
            <Text style={styles.uploadText}>Tap to upload photos or videos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  issueBtn: {
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radii.chip,
    borderWidth: 1,
    borderColor: Colors.line,
    width: '48%',
  },
  issueBtnActive: {
    backgroundColor: Colors.brand.green,
    borderColor: Colors.brand.green,
  },
  issueBtnText: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  issueBtnTextActive: {
    color: Colors.text.white,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    borderRadius: Radii.btn,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: FontSizes.small,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.brand.green,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.btn,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnText: {
    color: Colors.text.white,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
