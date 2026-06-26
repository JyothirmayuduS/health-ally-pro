import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  Flame,
  Zap
} from "lucide-react-native";
import { dietMeals } from "@/lib/mock-data";
import { useTheme } from "@/theme/ThemeProvider";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export default function ClinicalRulesScreen() {
  const { mealId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();

  const meal = dietMeals.find((m) => m.id === mealId);

  if (!meal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.inkMuted, fontSize: 16 }}>Clinical protocol not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: colors.clay, borderRadius: 12 }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Clinical Rules</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
           <View style={styles.heroSection}>
              <View style={[styles.shieldLarge, { backgroundColor: colors.clay + "15" }]}>
                 <ShieldCheck size={32} color={colors.clay} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Absorption Guard Protocol</Text>
              <Text style={[styles.heroSub, { color: colors.inkMuted }]}>
                Clinical guidelines for consuming {meal.name} while on thyroid medication.
              </Text>
           </View>
        </Animated.View>

        {/* ⏱️ Timing Protocol */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.section}>
           <View style={styles.sectionHeader}>
              <Clock size={18} color={colors.clay} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timing Strategy</Text>
           </View>
           <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.gapHighlight, { backgroundColor: colors.clay + "10" }]}>
                 <Text style={[styles.gapValue, { color: colors.clay }]}>{meal.protocol?.medGap || "60 mins"}</Text>
                 <Text style={[styles.gapLabel, { color: colors.clay }]}>Minimum Gap Required</Text>
              </View>
              <Text style={[styles.ruleText, { color: colors.inkMuted }]}>
                Levothyroxine requires a high-acid, low-interference environment for peak absorption. 
                Wait at least {meal.protocol?.medGap || "60 mins"} after taking your medication before consuming this meal.
              </Text>
           </View>
        </Animated.View>

        {/* ⚠️ Critical Cautions */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
           <View style={styles.sectionHeader}>
              <AlertCircle size={18} color="#E55B46" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Absorption Barriers</Text>
           </View>
           <View style={styles.cautionContainer}>
              {meal.protocol?.caution.map((item, i) => (
                <View key={i} style={[styles.cautionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                   <View style={[styles.cautionIcon, { backgroundColor: "#E55B4610" }]}>
                      <Info size={14} color="#E55B46" />
                   </View>
                   <Text style={[styles.cautionText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
           </View>
        </Animated.View>

        {/* ✅ Optimization Tips */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.section}>
           <View style={styles.sectionHeader}>
              <CheckCircle2 size={18} color="#4CAF7D" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Optimization Strategy</Text>
           </View>
           <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.tipTitle, { color: colors.foreground }]}>Maximizing Bioavailability</Text>
              <Text style={[styles.tipDesc, { color: colors.inkMuted, marginTop: 8 }]}>
                To ensure nutrients like Selenium and Iodine in this meal reach your thyroid follicular cells efficiently, 
                avoid concurrent intake of calcium or iron supplements, which compete for transport pathways.
              </Text>
           </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  shieldLarge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ruleCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  gapHighlight: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  gapValue: {
    fontSize: 24,
    fontFamily: "Fraunces_600SemiBold",
  },
  gapLabel: {
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
  },
  ruleText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
  cautionContainer: {
    gap: 12,
  },
  cautionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cautionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cautionText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    flex: 1,
  },
  tipCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  tipTitle: {
    fontSize: 17,
    fontFamily: "Fraunces_500Medium",
  },
  tipDesc: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
});
