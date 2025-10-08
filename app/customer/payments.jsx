import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import AppHeader from '../../components/app-header'
import ListItem from '../../components/customer/ListItem'
import { getMockInvoices } from '../../services/mockData'

export default function Payments() {
  const router = useRouter()
  const [invoices, setInvoices] = useState([])
  useEffect(() => { setInvoices(getMockInvoices()) }, [])

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Payments</Text>
        {invoices.map(inv => (
          <ListItem key={inv.id} leftIcon='' title={'Invoice #' + inv.id} subtitle={inv.date} rightChip={inv.status} chipColor={inv.status === 'paid' ? '#16A34A' : '#EF4444'} onPress={() => router.push('/customer/payment-detail')} />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
});