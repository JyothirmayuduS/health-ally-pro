import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Activity,
  ChevronRight,
  Dumbbell,
  FileText,
  Pill,
} from "lucide-react-native";
import { AccessiblePressable } from "@/components/ui/AccessiblePressable";
import { useTheme } from "@/theme/ThemeProvider";

const LINKS = [
  {
    title: "Medications",
    subtitle: "Today's doses and adherence",
    href: "/medications" as const,
    Icon: Pill,
  },
  {
    title: "Reports & labs",
    subtitle: "Results and imaging",
    href: "/(tabs)/reports" as const,
    Icon: FileText,
  },
  {
    title: "Exercise & recovery",
    subtitle: "Physical therapy routines",
    href: "/(tabs)/move" as const,
    Icon: Dumbbell,
  },
] as const;

export default function HealthHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: colors.clay }]}>Health Hub</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Meds, movement & results</Text>
        <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
          Track adherence, review labs, and complete prescribed exercise — mirroring the web Health hub.
        </Text>

        <View style={[styles.hero, { backgroundColor: colors.ink + "10", borderColor: colors.border }]}>
          <Activity size={22} color={colors.ink} strokeWidth={2} />
          <Text style={[styles.heroText, { color: colors.ink }]}>
            Daily progress syncs with your care team when connected.
          </Text>
        </View>

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
    marginBottom: 16,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    lineHeight: 18,
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
