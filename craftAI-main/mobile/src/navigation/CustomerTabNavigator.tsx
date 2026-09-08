import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceScreen } from '../screens/customer/MarketplaceScreen';
import { InquiriesScreen } from '../screens/customer/InquiriesScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { PALETTE, RADIUS, TOUCH_TARGET } from '../theme/tokens';

export type CustomerTabParamList = {
  Marketplace: undefined;
  Inquiries: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

interface Props {
  onLogout?: () => void;
  onSwitchRole?: (role: 'ARTISAN') => void;
}

export const CustomerTabNavigator: React.FC<Props> = ({ onLogout, onSwitchRole }) => {
  return (
    <Tab.Navigator
      initialRouteName="Marketplace"
      screenOptions={({ route }) => ({
        headerShown: false,
        // Distinct navigation zone: an elevated surface separated from page
        // content by a crisp top hairline (background → surface → elevated).
        tabBarStyle: {
          backgroundColor: PALETTE.surface,
          borderTopColor: PALETTE.surfaceBorder,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            },
            android: {
              elevation: 10,
            },
          }),
        },
        tabBarActiveTintColor: PALETTE.primary,
        tabBarInactiveTintColor: PALETTE.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          minHeight: TOUCH_TARGET.minHeight,
          paddingVertical: 0,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cart';
          if (route.name === 'Marketplace') iconName = focused ? 'storefront' : 'storefront-outline';
          if (route.name === 'Inquiries') iconName = focused ? 'chatbox-ellipses' : 'chatbox-ellipses-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="Inquiries" component={InquiriesScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} onSwitchRole={onSwitchRole} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    minWidth: 56,
    height: 30,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: PALETTE.primaryMuted,
  },
});