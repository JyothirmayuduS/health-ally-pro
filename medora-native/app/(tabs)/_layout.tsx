import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  LayoutDashboard,
  Activity,
  CalendarHeart,
  UserRound,
  UtensilsCrossed,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

/** 5-tab IA mirroring patient web portal: Home, Care Hub, Health Hub, Diet, Profile */
const VISIBLE_TABS = [
  { name: "index", title: "Home", Icon: LayoutDashboard },
  { name: "care", title: "Care Hub", Icon: CalendarHeart },
  { name: "health", title: "Health Hub", Icon: Activity },
  { name: "nutrition", title: "Diet", Icon: UtensilsCrossed },
  { name: "profile", title: "Profile", Icon: UserRound },
] as const;

const HIDDEN_TABS = ["book", "reports", "queue", "doctors", "family", "move"] as const;

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
          paddingBottom: 8,
          height: 76,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 10,
          letterSpacing: 0.6,
          marginTop: 3,
        },
      }}
    >
      {VISIBLE_TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 44,
                  height: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 15,
                  backgroundColor: focused ? colors.ink + "12" : "transparent",
                }}
              >
                <Icon size={21} color={color} strokeWidth={focused ? 2 : 1.75} />
              </View>
            ),
          }}
        />
      ))}
      {HIDDEN_TABS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
