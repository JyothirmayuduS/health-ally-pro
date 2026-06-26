import React from "react";
// Medora Support v2.1 - Refined Layout
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, MessageCircle, Phone, Mail, HelpCircle, ExternalLink, ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

function SupportAction({ 
  icon: Icon, 
  title, 
  desc, 
  onPress, 
  color = "#5B8FF9" 
}: { 
  icon: any, 
  title: string, 
  desc: string, 
  onPress?: () => void,
  color?: string 
}) {
  const { colors } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        s.actionCard, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <View style={[s.iconBox, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} strokeWidth={2} />
      </View>
      <View style={s.actionContent}>
        <Text style={[s.actionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[s.actionDesc, { color: colors.inkMuted }]}>{desc}</Text>
      </View>
      <View style={s.chevronWrap}>
        <ChevronLeft size={18} color={colors.inkMuted} style={{ transform: [{ rotate: '180deg'}] }} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={s.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[s.heroCard, { backgroundColor: colors.ink }]}>
            <View style={s.heroMain}>
              <Text style={[s.heroTitle, { color: colors.primaryForeground }]}>We're here for you.</Text>
              <Text style={[s.heroDesc, { color: colors.primaryForeground, opacity: 0.8 }]}>
                Our clinical support team is reachable 24/7 for account issues and medical technicalities.
              </Text>
            </View>
            <ShieldCheck size={48} color={colors.primaryForeground} opacity={0.1} style={s.heroIcon} />
          </View>
        </Animated.View>

        <View style={s.actionGroup}>
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <SupportAction 
              icon={MessageCircle}
              title="Live Chat Support"
              desc="Average response time: 2 minutes"
              onPress={() => {}}
              color={colors.clay}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <SupportAction 
              icon={Phone}
              title="Call Support Team"
              desc="Speak directly with a coordinator"
              onPress={() => Linking.openURL('tel:+15551234567')}
              color="#4CAF50"
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <SupportAction 
              icon={Mail}
              title="Email Inquiry"
              desc="support@medora.clinic"
              onPress={() => Linking.openURL('mailto:support@medora.clinic')}
              color="#5B8FF9"
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={s.faqSection}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Self Service</Text>
          <View style={[s.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              "Setting up 2FA",
              "Adding health dependents",
              "Sharing reports with doctors",
              "Managing subscription billing"
            ].map((text, i, arr) => (
              <Pressable 
                key={text} 
                style={[
                  s.faqItem, 
                  i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
                ]}
              >
                <HelpCircle size={16} color={colors.inkMuted} strokeWidth={1.5} />
                <Text style={[s.faqText, { color: colors.foreground }]}>{text}</Text>
                <ExternalLink size={14} color={colors.inkMuted} strokeWidth={1.5} />
              </Pressable>
            ))}
          </View>
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
  headerTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_600SemiBold",
  },
  backBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center'
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 32,
  },
  heroMain: { flex: 1, zIndex: 1 },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Fraunces_600SemiBold",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
  heroIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  actionGroup: {
    gap: 16,
    marginBottom: 40,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  chevronWrap: {
    width: 24,
    alignItems: 'center',
  },
  faqSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_600SemiBold",
    marginLeft: 4,
  },
  faqCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  faqText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  }
});
