import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { X, Camera, Check, User, Mail, Phone, ShieldCheck, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { patient } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [name, setName] = useState(patient.name);
  const [email, setEmail] = useState(patient.email);
  const [phone, setPhone] = useState("+1 (555) 0123");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.closeBtn}>
            <X size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Identity Profile</Text>
          <Pressable 
            onPress={handleSave} 
            disabled={!name || !email || isSaving}
            style={[s.saveBtn, { backgroundColor: colors.ink }]}
          >
            {isSaving ? (
              <Text style={[s.saveText, { color: colors.primaryForeground }]}>...</Text>
            ) : (
              <Check size={20} color={colors.primaryForeground} strokeWidth={2.5} />
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Clinical Identity Header */}
          <Animated.View entering={FadeIn.duration(600)} style={s.identityHeader}>
            <View style={s.avatarWrapper}>
              <Avatar initials={patient.initials} size="xl" variant="clay" />
              <Pressable style={[s.cameraOverlay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Camera size={14} color={colors.foreground} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={s.identityMeta}>
              <Text style={[s.patientId, { color: colors.inkMuted }]}>PATIENT ID: MED-0842-X</Text>
              <Text style={[s.clinicalStatus, { color: colors.clay }]}>Identity Verified</Text>
            </View>
          </Animated.View>

          {/* Verification Badge */}
          <View style={[s.verifiedBlock, { backgroundColor: colors.clay + '0A', borderColor: colors.clay + '20' }]}>
            <ShieldCheck size={16} color={colors.clay} strokeWidth={2} />
            <Text style={[s.verifiedText, { color: colors.clay }]}>Securely linked to Primary Care Provider</Text>
          </View>

          {/* Form Groups */}
          <View style={s.formGroups}>
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Text style={[s.groupLabel, { color: colors.inkMuted }]}>PERSONAL IDENTITY</Text>
              <View style={[s.groupedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.inputRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <User size={18} color={colors.inkMuted} style={s.inputIcon} />
                  <TextInput 
                    style={[s.input, { color: colors.foreground }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full legal name"
                    placeholderTextColor={colors.inkMuted}
                  />
                </View>
                <View style={s.inputRow}>
                  <Mail size={18} color={colors.inkMuted} style={s.inputIcon} />
                  <TextInput 
                    style={[s.input, { color: colors.foreground }]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Email address"
                    placeholderTextColor={colors.inkMuted}
                  />
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <Text style={[s.groupLabel, { color: colors.inkMuted }]}>CONTACT INFORMATION</Text>
              <View style={[s.groupedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={s.inputRow}>
                  <Phone size={18} color={colors.inkMuted} style={s.inputIcon} />
                  <TextInput 
                    style={[s.input, { color: colors.foreground }]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="Primary phone number"
                    placeholderTextColor={colors.inkMuted}
                  />
                </View>
              </View>
            </Animated.View>

            <Text style={[s.disclaimer, { color: colors.inkMuted }]}>
              Medora uses end-to-end encryption. Changing your identity profile requires re-verification by your care team.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_600SemiBold",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityMeta: {
    flex: 1,
  },
  patientId: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  clinicalStatus: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  verifiedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    flex: 1,
  },
  formGroups: {
    gap: 24,
  },
  groupLabel: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 10,
  },
  groupedCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 16,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    height: "100%",
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
    opacity: 0.7,
  }
});
