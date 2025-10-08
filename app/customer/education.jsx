import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native'
import AppHeader from '../../components/app-header'
import ListItem from '../../components/customer/ListItem'
import { getMockSortingGuide } from '../../services/mockData'

export default function Education() {
  const [guide, setGuide] = useState([])
  const [search, setSearch] = useState('')
  useEffect(() => { setGuide(getMockSortingGuide()) }, [])
  const filtered = guide.filter(g => g.item.toLowerCase().includes(search.toLowerCase()))

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Waste Sorting Guide</Text>
        <TextInput style={styles.searchBox} placeholder='Search items...' value={search} onChangeText={setSearch} />
        <ScrollView style={styles.list}>
          {filtered.map((g, i) => (
            <ListItem key={i} leftIcon={g.icon} title={g.item} subtitle={'Category: ' + g.category} />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  searchBox: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#D1D5DB' },
  list: { flex: 1 },
});