import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Info, Activity, Clock, CheckCircle2, AlertTriangle, CheckSquare, RefreshCcw, PackagePlus } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import { medications } from "@/lib/mock-data";
import { isMedicationTaken, toggleMedicationTaken } from "@/lib/patient-meds-store";

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Find medication from mock store
  const med = medications.find((m) => m.id === id);

  const [isTaken, setIsTaken] = useState(false);

  useEffect(() => {
    if (!med) return;
    void isMedicationTaken(med.id).then(setIsTaken);
  }, [med?.id]);

  if (!med) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={[s.error, { color: colors.foreground }]}>Medication not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.clay, fontSize: 16 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const totalDays = 30;
  const takenDays = isTaken ? 1 : 0;
  const adherence = 0;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      
      {/* ── Scrollable Body ── */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        
        {/* Hero Image Section */}
        <Animated.View entering={FadeIn.duration(600)} style={s.heroImageWrap}>
          <Image 
            source={require("../../assets/images/med-abstract.png")} 
            style={s.heroImage}
            resizeMode="cover"
          />
          <View style={s.heroGradient} />
        </Animated.View>

        {/* Back Button Overlay */}
        <Pressable 
          onPress={() => router.back()} 
          style={[s.backBtn, { top: insets.top || 20, backgroundColor: "rgba(255,255,255,0.7)" }]}
        >
          <ChevronLeft size={24} color="#1E3A32" strokeWidth={2.5} />
        </Pressable>

        {/* Main Content Area */}
        <View style={s.contentPad}>
          
          {/* Header Metadata */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <View style={s.tagRow}>
              <View style={[s.tag, { backgroundColor: colors.clay + "1A" }]}>
                <Text style={[s.tagText, { color: colors.clay }]}>{med.frequency}</Text>
              </View>
              <View style={[s.tag, { backgroundColor: colors.ink + "1A" }]}>
                <Text style={[s.tagText, { color: colors.ink }]}>{med.time}</Text>
              </View>
              <View style={[s.tag, { backgroundColor: "#4CAF7D" + "1A" }]}>
                <Text style={[s.tagText, { color: "#4CAF7D" }]}>
                  {(med.instructionTag ?? "With food").toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[s.title, { color: colors.foreground }]}>{med.name}</Text>
            <Text style={[s.dosage, { color: colors.inkMuted }]}>{med.dosage}</Text>
          </Animated.View>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          {/* Core Feature: Why it's taken */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Why it's prescribed</Text>
            <View style={[s.whyCard, { backgroundColor: colors.surface }]}>
              <View style={[s.whyIcon, { backgroundColor: colors.clay + "1A" }]}>
                <Info size={20} color={colors.clay} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.whyFocus, { color: colors.foreground }]}>{med.reason}</Text>
                <Text style={[s.whyContext, { color: colors.inkMuted }]}>
                  Prescribed by {med.prescribedBy} to actively manage and stabilize your condition over the long term.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* New Feature: Best Way To Take */}
          {med.bestWayToTake && (
            <Animated.View entering={FadeInUp.duration(500).delay(250)} style={{ marginTop: 24 }}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Best practices</Text>
              <View style={[s.whyCard, { backgroundColor: colors.surface }]}>
                <View style={[s.whyIcon, { backgroundColor: "#4CAF7D" + "1A" }]}>
                  <CheckSquare size={20} color="#4CAF7D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.whyContext, { color: colors.inkMuted, lineHeight: 22 }]}>
                    {med.bestWayToTake}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* New Feature: Side Effects & Interactions */}
          {((med.sideEffects?.length ?? 0) > 0 || (med.interactions?.length ?? 0) > 0) && (
             <Animated.View entering={FadeInUp.duration(500).delay(280)} style={{ marginTop: 24 }}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Precautions</Text>
                <View style={[s.precautionsCard, { backgroundColor: colors.surface, borderColor: "#E5A059" + "40" }]}>
                   {(med.interactions?.length ?? 0) > 0 && (
                     <View style={s.precautionBlock}>
                        <View style={s.precautionHeader}>
                          <AlertTriangle size={16} color="#E5A059" />
                          <Text style={[s.precautionTitle, { color: colors.foreground }]}>Do not combine with</Text>
                        </View>
                        {med.interactions?.map((interaction, i) => (
                           <Text key={`int-${i}`} style={[s.listItem, { color: colors.inkMuted }]}>• {interaction}</Text>
                        ))}
                     </View>
                   )}
                   {((med.interactions?.length ?? 0) > 0 && (med.sideEffects?.length ?? 0) > 0) && <View style={[s.pDivider, { backgroundColor: colors.border }]} />}
                   {(med.sideEffects?.length ?? 0) > 0 && (
                     <View style={s.precautionBlock}>
                        <View style={s.precautionHeader}>
                          <Activity size={16} color="#E5A059" />
                          <Text style={[s.precautionTitle, { color: colors.foreground }]}>Possible side effects</Text>
                        </View>
                        {med.sideEffects?.map((effect, i) => (
                           <Text key={`ef-${i}`} style={[s.listItem, { color: colors.inkMuted }]}>• {effect}</Text>
                        ))}
                     </View>
                   )}
                </View>
             </Animated.View>
          )}

          {/* New Feature: Alternatives */}
          {(med.alternatives?.length ?? 0) > 0 && (
            <Animated.View entering={FadeInUp.duration(500).delay(290)} style={{ marginTop: 24 }}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Common alternatives</Text>
              <View style={s.altRow}>
                {med.alternatives?.map((alt, i) => (
                  <View key={`alt-${i}`} style={[s.altChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                     <RefreshCcw size={14} color={colors.clay} />
                     <Text style={[s.altText, { color: colors.inkMuted }]}>{alt}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Adherence Analytics */}
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ marginTop: 32 }}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Your adherence</Text>
            
            <View style={[s.adherenceCard, { backgroundColor: colors.surface }]}>
              <View style={s.adherenceTop}>
                <Activity size={20} color={colors.foreground} />
                <Text style={[s.adherencePct, { color: colors.foreground }]}>{adherence}%</Text>
              </View>
              
              <Text style={[s.adherenceSub, { color: colors.inkMuted }]}>
                You have taken this medication {takenDays} out of the last {totalDays} days.
              </Text>

              {/* Progress Bar Visual */}
              <View style={[s.progressBarBg, { backgroundColor: colors.border }]}>
                <Animated.View style={[s.progressBarFill, { backgroundColor: adhereColor(adherence), width: `${adherence}%` }]} />
              </View>
            </View>
          </Animated.View>

          {/* New Feature: Refill Logistics */}
          {typeof med.pillsRemaining === "number" && typeof med.totalPills === "number" && (
             <Animated.View entering={FadeInUp.duration(500).delay(320)} style={{ marginTop: 24 }}>
                <View style={[s.refillCard, { backgroundColor: colors.surface, borderColor: med.pillsRemaining <= 7 ? "#D35E50" : colors.border, borderWidth: med.pillsRemaining <= 7 ? 1.5 : 0 }]}>
                   <View style={s.refillHeader}>
                      <Text style={[s.refillTitle, { color: colors.foreground }]}>Current Supply</Text>
                      <Text style={[s.refillCount, { color: med.pillsRemaining <= 7 ? "#D35E50" : colors.ink }]}>{med.pillsRemaining} tablets left</Text>
                   </View>
                   <View style={[s.progressBarBg, { backgroundColor: colors.border, marginTop: -4, marginBottom: 16, height: 6 }]}>
                      <Animated.View style={[s.progressBarFill, { backgroundColor: med.pillsRemaining <= 7 ? "#D35E50" : colors.clay, width: `${(med.pillsRemaining/med.totalPills)*100}%` }]} />
                   </View>
                   
                   <Pressable 
                       style={[s.refillBtn, { backgroundColor: "#D35E50" }]}
                       onPress={() => router.push(`/refill/${med.id}`)}
                     >
                        <PackagePlus size={18} color="#fff" />
                        <Text style={s.refillBtnText}>Request Refill from Clinic</Text>
                     </Pressable>
                </View>
             </Animated.View>
          )}

        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <Animated.View entering={SlideInDown.duration(500).delay(400)} style={[s.actionBar, { paddingBottom: insets.bottom || 30, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable 
          style={[
            s.actionBtn, 
            { backgroundColor: isTaken ? colors.surface : colors.ink },
            isTaken && { borderWidth: 1, borderColor: colors.border }
          ]}
          onPress={() => {
            void toggleMedicationTaken(med.id).then((updated) => {
              const row = updated.find((m) => m.id === med.id);
              setIsTaken(row?.taken ?? false);
            });
          }}
        >
          {isTaken ? (
             <CheckCircle2 size={20} color={colors.inkMuted} />
          ) : (
             <Clock size={20} color={colors.primaryForeground} />
          )}
          <Text style={[s.actionBtnText, { color: isTaken ? colors.inkMuted : colors.primaryForeground }]}>
            {isTaken ? "Already taken today (Tap to Undo)" : "Mark as Taken"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function adhereColor(pct: number) {
  if (pct > 90) return "#4CAF7D";
  if (pct > 75) return "#E5A059";
  return "#D35E50";
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { fontSize: 18, fontFamily: "DMSans_600SemiBold" },
  
  heroImageWrap: {
    width: "100%",
    height: 380,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "transparent", 
    // In a real app we'd use expo-linear-gradient to blend into the background.
    // For now, border radius trick on the next container solves it.
  },

  backBtn: {
    position: "absolute",
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  contentPad: {
    paddingHorizontal: 24,
    paddingTop: 32,
    marginTop: -40,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: "#FDFBF9", // Fusing with body
  },

  tagRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  tagText: { fontSize: 13, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },

  title: { fontSize: 36, fontFamily: "Fraunces_500Medium", letterSpacing: -1, lineHeight: 42 },
  dosage: { fontSize: 18, fontFamily: "DMSans_400Regular", marginTop: 6, opacity: 0.7 },

  divider: { height: StyleSheet.hairlineWidth, width: "100%", marginVertical: 32 },

  sectionTitle: { fontSize: 18, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3, marginBottom: 16 },

  whyCard: { flexDirection: "row", padding: 20, borderRadius: 24, gap: 16, alignItems: "flex-start", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  whyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  whyFocus: { fontSize: 16, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2, lineHeight: 22, marginBottom: 6 },
  whyContext: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 22, opacity: 0.8 },

  precautionsCard: { borderRadius: 24, borderWidth: 1, padding: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  precautionBlock: { paddingVertical: 4 },
  precautionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  precautionTitle: { fontSize: 15, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  listItem: { fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 6, lineHeight: 22 },
  pDivider: { height: StyleSheet.hairlineWidth, width: "100%", marginVertical: 14 },

  altRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  altChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  altText: { fontSize: 13, fontFamily: "DMSans_500Medium" },

  adherenceCard: { padding: 24, borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  adherenceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  adherencePct: { fontSize: 32, fontFamily: "Fraunces_400Regular" },
  adherenceSub: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 22, marginBottom: 24 },
  progressBarBg: { height: 8, borderRadius: 4, width: "100%", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },

  refillCard: { padding: 20, borderRadius: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  refillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
  refillTitle: { fontSize: 14, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  refillCount: { fontSize: 17, fontFamily: "Fraunces_600SemiBold" },
  refillBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 16 },
  refillBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" },

  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  actionBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: -0.2,
  }
});
