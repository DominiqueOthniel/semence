import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors, fonts } from '../../src/theme/colors';

function TabIcon({ focused, glyph }: { focused: boolean; glyph: string }) {
  return (
    <View
      style={{
        width: 28,
        height: 3,
        marginBottom: 6,
        backgroundColor: focused ? colors.or : 'transparent',
      }}
    >
      <Text style={{ position: 'absolute', top: -18, alignSelf: 'center', width: 28, textAlign: 'center', opacity: 0 }}>
        {glyph}
      </Text>
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: focused ? fonts.corpsSemi : fonts.corpsMed,
        fontSize: 11,
        color: focused ? colors.or : colors.ink3,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
  );
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
          height: 68,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.or,
        tabBarInactiveTintColor: colors.ink3,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} glyph="·" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Accueil" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="comptes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} glyph="·" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Comptes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="soir"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} glyph="·" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Soir" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} glyph="·" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Plus" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
