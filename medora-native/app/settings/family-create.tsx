import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeOutDown, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { X, UserPlus, CheckCircle2, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddFamilyMemberModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Child");
  
  const relations = ["Child", "Parent", "Spouse", "Other"];

  const handleCreate = () => {
    setStep(2);
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  return (
    <KeyboardAvoidingView 
      style={s.overlay} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View 
        entering={FadeInDown.duration(300)} 
        exiting={FadeOutDown.duration(300)}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      </Animated.View>

      <Animated.View 
        entering={SlideInDown.duration(350)}
        exiting={SlideOutDown.duration(250)}
        style={[s.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <View style={s.handleWrap}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
        </View>

        <View style={s.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <UserPlus size={14} color={colors.inkMuted} strokeWidth={2} />
              <Text style={[s.eyebrow, { color: colors.inkMuted }]}>FAMILY NETWORK</Text>
            </View>
            <Text style={[s.title, { color: colors.foreground }]}>Add Dependent</Text>
          </View>
          <Pressable 
            style={[s.closeBtn, { backgroundColor: colors.surface }]} 
            onPress={() => router.back()}
          >
            <X size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {step === 1 ? (
          <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
            
            <Text style={[s.label, { color: colors.foreground }]}>Full Name</Text>
            <TextInput 
              style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Eleanor Thorne"
              placeholderTextColor={colors.inkMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[s.label, { color: colors.foreground, marginTop: 16 }]}>Relationship</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
              {relations.map((rel) => {
                const isActive = relation === rel;
                return (
                  <Pressable 
                    key={rel}
                    onPress={() => setRelation(rel)}
                    style={[
                      s.chip, 
                      { 
                        backgroundColor: isActive ? colors.ink : colors.surface, 
                        borderColor: isActive ? colors.ink : colors.border 
                      }
                    ]}
                  >
                    <Text style={[s.chipText, { color: isActive ? colors.primaryForeground : colors.foreground }]}>
                      {rel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable 
              style={[s.submitBtn, { backgroundColor: name ? colors.clay : colors.surface }]}
              onPress={handleCreate}
              disabled={!name}
            >
              <Text style={[s.submitText, { color: name ? '#FFF' : colors.inkMuted }]}>Create Medical Profile</Text>
              <ChevronRight size={18} color={name ? '#FFF' : colors.inkMuted} strokeWidth={2} />
            </Pressable>

          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown} style={s.successBox}>
            <CheckCircle2 size={48} color={colors.clay} strokeWidth={1.5} style={{ marginBottom: 16 }} />
            <Text style={[s.title, { color: colors.foreground, textAlign: 'center' }]}>Profile Linked</Text>
            <Text style={[s.successDesc, { color: colors.inkMuted }]}>
              {name}'s secure health profile has been successfully mapped to your proxy network.
            </Text>
          </Animated.View>
        )}

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  handleWrap: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 5, borderRadius: 3, marginBottom: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Fraunces_500Medium",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
  },
  chipRow: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    marginTop: 32,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successDesc: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  }
});
