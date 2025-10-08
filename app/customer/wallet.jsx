import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import AppHeader from '../../components/app-header'
import ListItem from '../../components/customer/ListItem'
import { getMockWallet } from '../../services/mockData'

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  useEffect(() => { setWallet(getMockWallet()) }, [])
  if (!wallet) return null

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Wallet</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}></Text>
        </View>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {wallet.transactions.map(tx => (
          <ListItem key={tx.id} leftIcon='' title={tx.description} subtitle={tx.date} rightText={'$' + tx.amount.toFixed(2)} />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  balanceCard: { backgroundColor: '#16A34A', padding: 24, borderRadius: 12, marginBottom: 24 },
  balanceLabel: { fontSize: 14, color: '#FFF', marginBottom: 8 },
  balanceValue: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
});