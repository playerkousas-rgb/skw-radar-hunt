import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { RoleType, GameMap } from './lib/types';
import { saveRole, loadRole } from './lib/storage';
import { Colors } from './lib/colors';

import RoleSelectScreen from './screens/RoleSelectScreen';
import LeaderHomeScreen from './screens/LeaderHomeScreen';
import LeaderEditScreen from './screens/LeaderEditScreen';
import MemberImportScreen from './screens/MemberImportScreen';
import MemberRadarScreen from './screens/MemberRadarScreen';

// Suppress non-critical warnings
LogBox.ignoreLogs(['Warning:', 'Require cycle']);

type AppScreen =
  | 'role_select'
  | 'leader_home'
  | 'leader_edit'
  | 'member_import'
  | 'member_radar';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...FontAwesome.font,
    ...MaterialIcons.font,
  });

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('role_select');
  const [activeMap, setActiveMap] = useState<GameMap | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadRole().then((role) => {
      if (role === 'leader') {
        setCurrentScreen('leader_home');
      } else if (role === 'member') {
        setCurrentScreen('member_import');
      }
      setInitialized(true);
    });
  }, []);

  const handleSelectRole = useCallback((role: 'leader' | 'member') => {
    saveRole(role);
    if (role === 'leader') {
      setCurrentScreen('leader_home');
    } else {
      setCurrentScreen('member_import');
    }
  }, []);

  const handleSelectMap = useCallback((map: GameMap) => {
    setActiveMap(map);
    setCurrentScreen('leader_edit');
  }, []);

  const handleMapLoaded = useCallback((map: GameMap) => {
    setActiveMap(map);
    setCurrentScreen('member_radar');
  }, []);

  const handleUpdateMap = useCallback((map: GameMap) => {
    setActiveMap(map);
  }, []);

  const handleBackToRoles = useCallback(() => {
    saveRole(null);
    setCurrentScreen('role_select');
  }, []);

  if (!fontsLoaded || !initialized) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'role_select':
        return <RoleSelectScreen onSelectRole={handleSelectRole} />;

      case 'leader_home':
        return (
          <LeaderHomeScreen
            onSelectMap={handleSelectMap}
            onBack={handleBackToRoles}
          />
        );

      case 'leader_edit':
        return activeMap ? (
          <LeaderEditScreen
            map={activeMap}
            onUpdate={handleUpdateMap}
            onBack={() => setCurrentScreen('leader_home')}
          />
        ) : null;

      case 'member_import':
        return (
          <MemberImportScreen
            onMapLoaded={handleMapLoaded}
            onBack={handleBackToRoles}
          />
        );

      case 'member_radar':
        return activeMap ? (
          <MemberRadarScreen
            map={activeMap}
            onBack={() => setCurrentScreen('member_import')}
          />
        ) : null;

      default:
        return <RoleSelectScreen onSelectRole={handleSelectRole} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.container}>{renderScreen()}</View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
