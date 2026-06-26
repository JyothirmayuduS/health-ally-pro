import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated as RNAnimated, Easing } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Package, MapPin, CheckCircle2, ShieldCheck, Truck } from "lucide-react-native";
import Animated, { FadeInUp, SlideInDown, FadeInDown, BounceIn } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import { medications } from "@/lib/mock-data";
import { addRefillRequest } from "@/lib/refill-requests-store";

export default function RefillRequestScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const med = medications.find((m) => m.id === id);
  
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  if (!med) return null;

  const handleSubmit = () => {
    setStatus("submitting");
    setTimeout(() => {
      addRefillRequest({
        medicationId: med.id,
        medicationName: med.name,
        deliveryMethod,
      });
      setStatus("success");
    }, 1200);
  };

  if (status === "success") {
     return (
        <View style={[s.successWrap, { backgroundColor: colors.background, paddingTop: insets.top }]}>
           <Animated.View entering={BounceIn.springify()}>
              <View style={[s.successCircle, { backgroundColor: "#4CAF7D" + "1A" }]}>
                 <CheckCircle2 size={48} color="#4CAF7D" />
              </View>
           </Animated.View>
           <Animated.View entering={FadeInUp.delay(200)}>
              <Text style={[s.successTitle, { color: colors.foreground }]}>Request Sent</Text>
              <Text style={[s.successSub, { color: colors.inkMuted }]}>
                {med.prescribedBy} will review your request shortly.
              </Text>
           </Animated.View>
           <Animated.View entering={FadeInUp.delay(350)} style={{ marginTop: 28, width: "100%", paddingHorizontal: 32 }}>
              <Pressable
                onPress={() => router.replace("/medications/refill-history")}
                style={[s.historyBtn, { borderColor: colors.border }]}
              >
                <Text style={[s.historyBtnText, { color: colors.foreground }]}>View refill history</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={{ marginTop: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontFamily: "DMSans_500Medium", color: colors.inkMuted }}>Done</Text>
              </Pressable>
           </Animated.View>
        </View>
     )
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top || 20 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.5} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Request Refill</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140, paddingTop: 10 }}>
         
         <Animated.View entering={FadeInDown.duration(400)} style={s.contentPad}>
            {/* Med Summary */}
            <Text style={[s.medName, { color: colors.foreground }]}>{med.name}</Text>
            <Text style={[s.medContext, { color: colors.inkMuted }]}>{med.dosage} • {med.frequency}</Text>

            {/* Trust Anchor */}
            <View style={[s.trustCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <ShieldCheck size={20} color={colors.clay} />
               <View style={{ flex: 1 }}>
                  <Text style={[s.trustTitle, { color: colors.foreground }]}>Direct Authorization</Text>
                  <Text style={[s.trustSub, { color: colors.inkMuted }]}>This request goes instantly to {med.prescribedBy} for 1-click clinical approval.</Text>
               </View>
            </View>

            <View style={[s.divider, { backgroundColor: colors.border }]} />

            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Delivery Method</Text>

            {/* Delivery Methods */}
            <Pressable 
               style={[
                 s.methodCard, 
                 { backgroundColor: colors.surface, borderColor: deliveryMethod === "delivery" ? colors.clay : colors.border },
                 deliveryMethod === "delivery" && s.methodActive
               ]}
               onPress={() => setDeliveryMethod("delivery")}
            >
               <View style={[s.methodIcon, { backgroundColor: deliveryMethod === "delivery" ? colors.clay : colors.border }]}>
                  <Truck size={20} color={deliveryMethod === "delivery" ? "#fff" : colors.inkMuted} />
               </View>
               <View style={{ flex: 1 }}>
                  <Text style={[s.methodTitle, { color: colors.foreground }]}>Home Delivery</Text>
                  <Text style={[s.methodSub, { color: colors.inkMuted }]}>Usually ships in 1-2 business days to your flat.</Text>
               </View>
               <View style={[s.radio, { borderColor: deliveryMethod === "delivery" ? colors.clay : colors.border }]}>
                  {deliveryMethod === "delivery" && <View style={[s.radioInner, { backgroundColor: colors.clay }]} />}
               </View>
            </Pressable>

            <Pressable 
               style={[
                 s.methodCard, 
                 { backgroundColor: colors.surface, borderColor: deliveryMethod === "pickup" ? colors.clay : colors.border },
                 deliveryMethod === "pickup" && s.methodActive
               ]}
               onPress={() => setDeliveryMethod("pickup")}
            >
               <View style={[s.methodIcon, { backgroundColor: deliveryMethod === "pickup" ? colors.clay : colors.border }]}>
                  <MapPin size={20} color={deliveryMethod === "pickup" ? "#fff" : colors.inkMuted} />
               </View>
               <View style={{ flex: 1 }}>
                  <Text style={[s.methodTitle, { color: colors.foreground }]}>Pharmacy Pickup</Text>
                  <Text style={[s.methodSub, { color: colors.inkMuted }]}>Oakhaven Medical Center Pharmacy. Same day.</Text>
               </View>
               <View style={[s.radio, { borderColor: deliveryMethod === "pickup" ? colors.clay : colors.border }]}>
                  {deliveryMethod === "pickup" && <View style={[s.radioInner, { backgroundColor: colors.clay }]} />}
               </View>
            </Pressable>

         </Animated.View>

      </ScrollView>

      {/* Floating Action Bar */}
      <Animated.View entering={SlideInDown.duration(500).delay(200)} style={[s.actionBar, { paddingBottom: insets.bottom || 30, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable 
          style={[s.actionBtn, { backgroundColor: status === "submitting" ? colors.inkMuted : colors.ink }]}
          onPress={handleSubmit}
          disabled={status !== "idle"}
        >
          {status === "submitting" ? (
             <RNAnimated.View style={s.spinner}>
               <Package size={20} color={colors.primaryForeground} />
             </RNAnimated.View>
          ) : (
             <Package size={20} color={colors.primaryForeground} />
          )}
          <Text style={[s.actionBtnText, { color: colors.primaryForeground }]}>
            {status === "submitting" ? "Securing Authorization..." : "Submit Refill Request"}
          </Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "DMSans_600SemiBold" },
  
  contentPad: { paddingHorizontal: 24, paddingTop: 10 },
  
  medName: { fontSize: 32, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5 },
  medContext: { fontSize: 16, fontFamily: "DMSans_400Regular", marginTop: 4, marginBottom: 32 },

  trustCard: { flexDirection: "row", padding: 20, borderRadius: 20, borderWidth: 1, gap: 14, alignItems: "center" },
  trustTitle: { fontSize: 16, fontFamily: "DMSans_600SemiBold", marginBottom: 2 },
  trustSub: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 },

  divider: { height: StyleSheet.hairlineWidth, width: "100%", marginVertical: 32 },
  sectionTitle: { fontSize: 18, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3, marginBottom: 16 },

  methodCard: { flexDirection: "row", padding: 20, borderRadius: 24, borderWidth: 1, gap: 16, alignItems: "center", marginBottom: 16 },
  methodActive: { borderWidth: 2 },
  methodIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  methodTitle: { fontSize: 16, fontFamily: "DMSans_600SemiBold", marginBottom: 4 },
  methodSub: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20, opacity: 0.8 },
  
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6 },

  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 18, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  actionBtnText: { fontSize: 16, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },

  spinner: { opacity: 0.6 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  successCircle: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 32, fontFamily: "Fraunces_600SemiBold", textAlign: "center", marginBottom: 8 },
  successSub: { fontSize: 16, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 24 },
  historyBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  historyBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});
