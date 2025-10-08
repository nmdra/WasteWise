import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../../components/app-header';
import { Colors } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';
import MapboxView from '../../../components/cleaner/MapboxView';

export default function CleanerMap() {
  const [mapData, setMapData] = useState(null);
  const [userName, setUserName] = useState('Cleaner');

  useEffect(() => {
    MockCleaner.getMapData().then(setMapData);
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const firstName = await AsyncStorage.getItem('userFirstName');
      if (firstName) {
        setUserName(firstName);
      }
    } catch (error) {
      console.error('Error loading cleaner name:', error);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader userName={userName} userRole="cleaner" />
      <View style={styles.mapWrap}>
        {!mapData ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.role.cleaner} size="large" />
          </View>
        ) : (
          <MapboxView center={mapData.current} stops={mapData.stops} polyline={mapData.polyline} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.page,
  },
  mapWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg.card,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
