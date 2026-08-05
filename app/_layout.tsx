import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  LibreBaskerville_400Regular,
  LibreBaskerville_400Regular_Italic,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville';
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from '@expo-google-fonts/source-sans-3';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
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
    LibreBaskerville_400Regular,
    LibreBaskerville_400Regular_Italic,
    LibreBaskerville_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
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
          </Stack>
        </Gate>
      </AppProvider>
    </SafeAreaProvider>
  );
}
