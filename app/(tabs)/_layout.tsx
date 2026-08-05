import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Slot, Tabs, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../src/theme/colors';
import { TOUCH, useLayout } from '../../src/hooks/useLayout';
import { BrandMark } from '../../src/ui/BrandLogo';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const DESKTOP_LINKS: {
  href: '/(tabs)' | '/(tabs)/comptes' | '/(tabs)/soir' | '/(tabs)/plus';
  label: string;
  match: string[];
  icon: IconName;
  iconOutline: IconName;
}[] = [
  {
    href: '/(tabs)',
    label: 'Accueil',
    match: ['/', '/(tabs)', '/(tabs)/'],
    icon: 'home',
    iconOutline: 'home-outline',
  },
  {
    href: '/(tabs)/comptes',
    label: 'Comptes',
    match: ['/comptes', '/(tabs)/comptes'],
    icon: 'wallet',
    iconOutline: 'wallet-outline',
  },
  {
    href: '/(tabs)/soir',
    label: 'Soir',
    match: ['/soir', '/(tabs)/soir'],
    icon: 'moon',
    iconOutline: 'moon-outline',
  },
  {
    href: '/(tabs)/plus',
    label: 'Plus',
    match: ['/plus', '/(tabs)/plus'],
    icon: 'grid',
    iconOutline: 'grid-outline',
  },
];

function TabIcon({
  focused,
  name,
  nameOutline,
}: {
  focused: boolean;
  name: IconName;
  nameOutline: IconName;
}) {
  return (
    <Ionicons
      name={focused ? name : nameOutline}
      size={22}
      color={focused ? colors.or : colors.ink3}
    />
  );
}

function isActive(pathname: string, match: string[]) {
  const p = pathname.replace(/\/$/, '') || '/';
  return match.some((m) => {
    const n = m.replace(/\/$/, '') || '/';
    if (n === '/' || n === '/(tabs)') {
      return p === '/' || p === '/(tabs)' || p.endsWith('/(tabs)');
    }
    return p === n || p.endsWith(n);
  });
}

function DesktopShell() {
  const { sidebarWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.desktopRoot}>
      <View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <BrandMark size={36} style={{ marginBottom: 28, paddingHorizontal: 8 }} />
        {DESKTOP_LINKS.map((link) => {
          const focused = isActive(pathname, link.match);
          return (
            <Pressable
              key={link.href}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={link.label}
              onPress={() => router.replace(link.href)}
              style={({ pressed }) => [
                styles.sideItem,
                focused && styles.sideItemOn,
                pressed && { opacity: 0.88 },
              ]}
            >
              <View style={styles.sideIcon}>
                <TabIcon focused={focused} name={link.icon} nameOutline={link.iconOutline} />
              </View>
              <Text style={[styles.sideLabel, focused && styles.sideLabelOn]}>{link.label}</Text>
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Text style={styles.sideFoot}>Semence · hors ligne</Text>
      </View>
      <View style={styles.desktopMain}>
        <Slot />
      </View>
    </View>
  );
}

function MobileTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
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
        },
        tabBarActiveTintColor: colors.or,
        tabBarInactiveTintColor: colors.ink3,
        tabBarItemStyle: {
          minHeight: TOUCH,
        },
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

export default function TabsLayout() {
  const { isCompact } = useLayout();
  return isCompact ? <MobileTabs /> : <DesktopShell />;
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.ground,
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.rule,
    paddingHorizontal: 12,
  },
  desktopMain: {
    flex: 1,
    minWidth: 0,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  sideItemOn: {
    backgroundColor: colors.orWash,
  },
  sideIcon: {
    width: 28,
    alignItems: 'center',
  },
  sideLabel: {
    marginLeft: 10,
    fontFamily: fonts.corpsMed,
    fontSize: 15,
    color: colors.ink2,
  },
  sideLabelOn: {
    fontFamily: fonts.corpsBold,
    color: colors.or,
  },
  sideFoot: {
    fontFamily: fonts.corps,
    fontSize: 12,
    color: colors.ink3,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
});
