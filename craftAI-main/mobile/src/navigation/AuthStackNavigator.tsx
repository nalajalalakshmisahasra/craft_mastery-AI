import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HeroPitchScreen } from '../screens/auth/HeroPitchScreen';
import { WelcomeLanguageScreen, AuthStackParamList } from '../screens/auth/WelcomeLanguageScreen';
import { LanguageSelectionScreen } from '../screens/auth/LanguageSelectionScreen';
import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { AuthUser } from '../adapters/auth';
import { PALETTE } from '../theme/tokens';

// The first-launch flow extends AuthStackParamList so the existing screens
// (WelcomeLanguage, PhoneAuth, Onboarding) keep working. A new LanguageSelection
// screen is inserted at the front for first-time users; returning users skip
// straight to WelcomeLanguage.
export type FirstLaunchParamList = AuthStackParamList & {
  LanguageSelection: undefined;
};

export type AuthStackRouteName = keyof FirstLaunchParamList;

const Stack = createNativeStackNavigator<FirstLaunchParamList>();

interface Props {
  onAuthenticated?: (user: AuthUser) => void;
  initialRouteName?: AuthStackRouteName;
}

export const AuthStackNavigator: React.FC<Props> = ({
  onAuthenticated,
  initialRouteName = 'LanguageSelection',
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: PALETTE.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HeroPitch" component={HeroPitchScreen} />
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="WelcomeLanguage" component={WelcomeLanguageScreen} />
      <Stack.Screen name="PhoneAuth">
        {(props) => <PhoneAuthScreen {...props} onAuthenticated={onAuthenticated} />}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {(props) => <OnboardingScreen {...props} onAuthenticated={onAuthenticated} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
