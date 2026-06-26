import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, ScrollText, ShieldCheck, Scale } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

function LegalSection({ title, content }: { title: string, content: string }) {
  const { colors } = useTheme();
  return (
    <View style={s.legalSection}>
      <Text style={[s.legalTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[s.legalContent, { color: colors.inkMuted }]}>{content}</Text>
    </View>
  );
}

export default function TermsAndConditionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[s.heroBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[s.iconCircle, { backgroundColor: colors.clay + '15' }]}>
              <Scale size={32} color={colors.clay} strokeWidth={1.5} />
            </View>
            <Text style={[s.heroHeading, { color: colors.foreground }]}>Legal Agreement</Text>
            <Text style={[s.heroDate, { color: colors.inkMuted }]}>Last Updated: October 2024</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.body}>
          <LegalSection 
            title="1. Acceptance of Terms"
            content="By creating a Medora account, you agree to these terms. If you do not agree to all terms, you must not use our healthcare coordination services."
          />
          <LegalSection 
            title="2. Health Data Privacy"
            content="Your medical records are your property. Medora acts as a secure vault. While we provide AI assistance, we do not share your identifiable data with third parties without explicit cryptographic consent."
          />
          <LegalSection 
            title="3. Clinical Disclaimer"
            content="Medora is a tracking and orchestration tool. The AI 'Assistant' is not a licensed physician. Always seek the advice of your actual Care Team for medical emergencies or diagnosis."
          />
          <LegalSection 
            title="4. Proxy Access"
            content="When adding family dependents, you certify that you have the legal right to manage their medical data. Misuse of proxy access is grounds for account termination."
          />
          <LegalSection 
            title="5. Data Encryption"
            content="We employ industry-standard end-to-end encryption for all uploaded reports. In the event of password loss, Medora cannot recover your encrypted data to maintain security integrity."
          />
          
          <View style={[s.footer, { borderTopColor: colors.border }]}>
            <Text style={[s.footerText, { color: colors.inkMuted }]}>
              Questions? Contact our legal team at legal@medora.clinic
            </Text>
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
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_600SemiBold",
  },
  content: {
    padding: 24,
  },
  heroBox: {
    padding: 32,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroHeading: {
    fontSize: 22,
    fontFamily: "Fraunces_600SemiBold",
    marginBottom: 4,
  },
  heroDate: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  body: {
    gap: 28,
  },
  legalSection: {
    gap: 8,
  },
  legalTitle: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  legalContent: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    paddingTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    textAlign: 'center',
  }
});
