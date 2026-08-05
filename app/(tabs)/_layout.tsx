import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../src/theme/colors';
import { TOUCH, useLayout } from '../../src/hooks/useLayout';

function TabIcon({
  focused,
  name,
  nameOutline,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>['name'];
  nameOutline: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Ionicons
      name={focused ? name : nameOutline}
      size={22}
      color={focused ? colors.or : colors.ink3}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isDesktop, isPhone } = useLayout();
  const bottomPad = Math.max(insets.bottom, isPhone ? 10 : 12);
  const barHeight = TOUCH + 20 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.rule,
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomPad,
          paddingTop: 10,
          maxWidth: isDesktop ? 720 : undefined,
          alignSelf: isDesktop ? 'center' : undefined,
          width: isDesktop ? '100%' : undefined,
          marginHorizontal: isDesktop ? 'auto' : undefined,
          ...(Platform.OS === 'web' && isDesktop
            ? {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: colors.rule,
              }
            : null),
        },
        tabBarActiveTintColor: colors.or,
        tabBarInactiveTintColor: colors.ink3,
        tabBarItemStyle: {
          minHeight: TOUCH,
          paddingHorizontal: isPhone ? 2 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.corpsSemi,
          fontSize: isPhone ? 11 : 12,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarAccessibilityLabel: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" nameOutline="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="comptes"
        options={{
          title: 'Comptes',
          tabBarAccessibilityLabel: 'Comptes',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="wallet" nameOutline="wallet-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="soir"
        options={{
          title: 'Soir',
          tabBarAccessibilityLabel: 'Rendez-vous du soir',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="moon" nameOutline="moon-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: 'Plus',
          tabBarAccessibilityLabel: 'Plus',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="grid" nameOutline="grid-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
