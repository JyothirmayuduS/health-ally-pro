import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, Shield, Eye, Brain, Share2, Info } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

function PrivacyToggle({ 
  icon: Icon, 
  title, 
  desc, 
  defaultVal 
}: { 
  icon: any, 
  title: string, 
  desc: string, 
  defaultVal: boolean 
}) {
  const { colors } = useTheme();
  const [val, setVal] = useState(defaultVal);
  return (
    <View style={[s.row, { borderBottomColor: colors.border }]}>
      <View style={[s.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Icon size={18} color={colors.inkMuted} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[s.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[s.rowDesc, { color: colors.inkMuted }]}>{desc}</Text>
      </View>
      <Switch 
        value={val} 
        onValueChange={setVal} 
        trackColor={{ false: colors.border, true: colors.clay }}
        thumbColor="#FFF"
      />
    </View>
  );
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Privacy Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[s.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Shield size={32} color={colors.clay} strokeWidth={1.5} style={{ marginBottom: 16 }} />
            <Text style={[s.heroTitle, { color: colors.foreground }]}>Your Data, Your Control</Text>
            <Text style={[s.heroDesc, { color: colors.inkMuted }]}>
              Medora is built on a foundation of trust. We never sell your health data, and everything is encrypted at rest.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.inkMuted }]}>VISIBILITY & AI</Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <PrivacyToggle 
              icon={Brain}
              title="AI Context Learning"
              desc="Allow the Medora AI to personalize advice based on your reports."
              defaultVal={true}
            />
            <PrivacyToggle 
              icon={Eye}
              title="Doctor Stealth Mode"
              desc="Your profile will be hidden from searches unless you share a report."
              defaultVal={false}
            />
            <PrivacyToggle 
              icon={Share2}
              title="Anonymous Research"
              desc="Contribute anonymized data to clinical trials for metabolic health."
              defaultVal={true}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={s.infoBox}>
          <Info size={16} color={colors.inkMuted} style={{ marginTop: 2 }} />
          <Text style={[s.infoText, { color: colors.inkMuted }]}>
            Changes here take effect immediately across all linked devices. Some regulatory data must be kept for 7 years as per medical legal requirements.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 24,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: "Fraunces_600SemiBold",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    lineHeight: 18,
  }
});
