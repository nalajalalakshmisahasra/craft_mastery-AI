import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStackNavigator, FirstLaunchParamList, AuthStackRouteName } from './AuthStackNavigator';
import { ArtisanTabNavigator } from './ArtisanTabNavigator';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { AuthAdapter, AuthUser } from '../adapters/auth';
import { StorageAdapter } from '../adapters/storage';
import { PALETTE } from '../theme/tokens';

export const RootNavigator: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [hasSeenHero, setHasSeenHero] = useState<boolean>(false);
  const [initialRoute, setInitialRoute] = useState<AuthStackRouteName>('LanguageSelection');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      const [user, seenHero] = await Promise.all([
        AuthAdapter.getCurrentUser(),
        StorageAdapter.hasSeenHero(),
      ]);
      setCurrentUser(user);
      setHasSeenHero(seenHero);
      setInitialRoute(seenHero ? 'WelcomeLanguage' : 'LanguageSelection');
    } catch (err) {
      console.warn('Session check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await AuthAdapter.signOut();
    setCurrentUser(null);
  };

  const handleSwitchRole = (newRole: 'ARTISAN' | 'CUSTOMER') => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: PALETTE.primary,
          background: PALETTE.background,
          card: PALETTE.surface,
          text: PALETTE.textPrimary,
          border: PALETTE.surfaceBorder,
          notification: PALETTE.primaryLight,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      {!currentUser ? (
        <AuthStackNavigator
          onAuthenticated={handleAuthenticated}
          initialRouteName={initialRoute}
        />
      ) : currentUser.role === 'ARTISAN' ? (
        <ArtisanTabNavigator onLogout={handleLogout} onSwitchRole={handleSwitchRole} />
      ) : (
        <CustomerTabNavigator onLogout={handleLogout} onSwitchRole={handleSwitchRole} />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: PALETTE.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
