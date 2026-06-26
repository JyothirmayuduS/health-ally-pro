import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  CalendarPlus,
  Clock4,
  Pill,
  Stethoscope,
  ChevronRight,
  FileText,
} from "lucide-react-native";
import { AccessiblePressable } from "@/components/ui/AccessiblePressable";
import { useTheme } from "@/theme/ThemeProvider";

const LINKS = [
  {
    title: "Book appointment",
    subtitle: "Schedule with your care team",
    href: "/(tabs)/book" as const,
    Icon: CalendarPlus,
  },
  {
    title: "Live queue",
    subtitle: "Check your position in line",
    href: "/(tabs)/queue" as const,
    Icon: Clock4,
  },
  {
    title: "Find doctors",
    subtitle: "Browse specialists",
    href: "/(tabs)/doctors" as const,
    Icon: Stethoscope,
  },
  {
    title: "Visits",
    subtitle: "Upcoming and past appointments",
    href: "/visits" as const,
    Icon: FileText,
  },
  {
    title: "Prescriptions",
    subtitle: "Active and past e-prescriptions",
    href: "/prescriptions" as const,
    Icon: Pill,
  },
] as const;

export default function CareHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: colors.clay }]}>Care Hub</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Appointments & clinical care</Text>
        <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
          Book visits, track queue status, and manage prescriptions — aligned with the web Care hub.
        </Text>

        <View style={styles.list}>
          {LINKS.map((item) => (
            <AccessiblePressable
              key={item.title}
              label={item.title}
              hint={item.subtitle}
              onPress={() => router.push(item.href)}
              style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.clay + "18" }]}>
                <item.Icon size={20} color={colors.clay} strokeWidth={2} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.ink }]}>{item.title}</Text>
                <Text style={[styles.rowSub, { color: colors.inkMuted }]}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={colors.inkMuted} />
            </AccessiblePressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  kicker: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
  },
  rowSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
});
