import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppHeader from '../../../components/app-header';
import MapboxView from '../../../components/cleaner/MapboxView';
import { Colors } from '../../../constants/customerTheme';
import { MockCleaner } from '../../../services/mockCleanerApi';

export default function CleanerMap() {
  const [mapData, setMapData] = useState(null);
  const [userName, setUserName] = useState('Cleaner');

  useEffect(() => {
    MockCleaner.getMapData().then(setMapData);
    loadUser();
  }, []);

  const loadUser = async () => {
    // UI-only mode: no AsyncStorage checks
    setUserName('Cleaner');
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
