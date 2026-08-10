import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { AppProvider, useApp } from '../src/store/AppContext';
import { colors } from '../src/theme/colors';

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, unlocked, settings } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const root = segments[0];
    const inOnboarding = root === 'onboarding';
    const inLock = root === 'lock';

    if (!settings || !settings.onboardingDone) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (!unlocked) {
      if (!inLock) router.replace('/lock');
      return;
    }

    if (inOnboarding || inLock) {
      router.replace('/(tabs)');
    }
  }, [ready, unlocked, settings, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ground }}>
        <ActivityIndicator color={colors.or} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ground }}>
      <ActivityIndicator color={colors.or} size="large" />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const fontsReady = fontsLoaded || !!fontError || fontTimeout;

  if (!fontsReady) return <Loading />;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.ground },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="lock" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="saisie"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Saisie',
                headerStyle: { backgroundColor: colors.ground },
                headerTintColor: colors.ink,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="transfert"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Transfert',
                headerStyle: { backgroundColor: colors.ground },
                headerTintColor: colors.ink,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="dette"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Dette',
                headerStyle: { backgroundColor: colors.ground },
                headerTintColor: colors.ink,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="credit"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Crédit',
                headerStyle: { backgroundColor: colors.ground },
                headerTintColor: colors.ink,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="objectif"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Objectif',
                headerStyle: { backgroundColor: colors.ground },
                headerTintColor: colors.ink,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="reflexes"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </Stack>
        </Gate>
      </AppProvider>
    </SafeAreaProvider>
  );
}
