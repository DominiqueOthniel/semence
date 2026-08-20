import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Slot, Tabs, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../src/theme/colors';
import { TOUCH, useLayout } from '../../src/hooks/useLayout';
import { BrandLockup } from '../../src/ui/BrandLogo';
import { useApp } from '../../src/store/AppContext';
import { Avatar } from '../../src/ui/primitives';
import { BotanicalField } from '../../src/ui/BotanicalMotif';
import { ClockStamp } from '../../src/ui/ClockStamp';

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
  onDark,
}: {
  focused: boolean;
  name: IconName;
  nameOutline: IconName;
  onDark?: boolean;
}) {
  const active = onDark ? colors.ambre : colors.or;
  const idle = onDark ? 'rgba(255,255,255,0.86)' : colors.ink3;
  return <Ionicons name={focused ? name : nameOutline} size={22} color={focused ? active : idle} />;
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
  const { settings } = useApp();

  return (
    <View style={styles.desktopRoot}>
      <View
        style={[
          styles.sidebar,
          {
            width: Math.max(sidebarWidth, 220),
            paddingTop: Math.max(insets.top, 28),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <BotanicalField variant="dark" density="panel" style={styles.sideMotif} />
        <BrandLockup
          height={132}
          tagline={'Faire fructifier\nvos finances'}
          style={styles.sideBrand}
        />
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
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.sideIcon}>
                <TabIcon
                  focused={focused}
                  name={link.icon}
                  nameOutline={link.iconOutline}
                  onDark
                />
              </View>
              <Text style={[styles.sideLabel, focused && styles.sideLabelOn]}>{link.label}</Text>
            </Pressable>
          );
        })}
        <View style={styles.sideFoot}>
          <View style={styles.sideClock}>
            <ClockStamp variant="gold" compact stacked />
          </View>
          <View style={styles.sideSecure}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.ambreVif} />
            <Text style={styles.sideSecureText}>Sécurisé & confidentiel</Text>
          </View>
          <View style={styles.sideProfile}>
            <Avatar
              name={settings?.name || 'Toi'}
              size={36}
              preset={settings?.avatarPreset}
              photoUri={settings?.avatarPhoto}
            />
            <Text style={styles.sideProfileName} numberOfLines={1}>
              {settings?.name || 'Profil'}
            </Text>
          </View>
        </View>
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
    minHeight: 0,
    height: '100%',
  },
  sidebar: {
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    zIndex: 2,
    borderRightWidth: 1,
    borderRightColor: colors.goldLine,
    position: 'relative',
    overflow: 'hidden',
  },
  sideMotif: {
    opacity: 0.22,
  },
  desktopMain: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: colors.ground,
    overflow: 'hidden',
    position: 'relative',
  },
  sideBrand: {
    marginBottom: 30,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(15, 36, 28, 0.28)',
    zIndex: 1,
  },
  sideItemOn: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.goldLine,
  },
  sideIcon: {
    width: 28,
    alignItems: 'center',
  },
  sideLabel: {
    marginLeft: 10,
    fontFamily: fonts.corpsSemi,
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
  },
  sideLabelOn: {
    fontFamily: fonts.corpsBold,
    color: colors.white,
  },
  sideFoot: {
    marginTop: 'auto',
    zIndex: 1,
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 2,
    borderRadius: radius.md,
    backgroundColor: 'rgba(15, 36, 28, 0.72)',
  },
  sideClock: {
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 10,
  },
  sideSecure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sideSecureText: {
    fontFamily: fonts.corpsMed,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
  },
  sideProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.panelDeep,
    borderWidth: 1,
    borderColor: colors.ruleOnDark,
    zIndex: 1,
  },
  sideProfileName: {
    flex: 1,
    fontFamily: fonts.corpsSemi,
    fontSize: 14,
    color: colors.white,
  },
});
