import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../src/theme/colors';

function TabIcon({
  focused,
  name,
  nameOutline,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>['name'];
  nameOutline: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return <Ionicons name={focused ? name : nameOutline} size={22} color={focused ? colors.or : colors.ink3} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.rule,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.or,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: {
          fontFamily: fonts.corpsSemi,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" nameOutline="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="comptes"
        options={{
          title: 'Comptes',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="wallet" nameOutline="wallet-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="soir"
        options={{
          title: 'Soir',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="moon" nameOutline="moon-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: 'Plus',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="grid" nameOutline="grid-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
