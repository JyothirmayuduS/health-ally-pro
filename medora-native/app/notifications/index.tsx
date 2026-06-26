import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  Bell, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Clock4,
  Stethoscope
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
  Easing
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { requestNotificationPermission, scheduleTestNotification } from "@/lib/notifications";
import { scheduleMedicationReminders } from "@/lib/medication-reminders";
import { medications } from "@/lib/mock-data";

const { width } = Dimensions.get("window");

export default function NotificationSetupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const ringScale = useSharedValue(1);

  React.useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setIsFinishing(true);
      await scheduleMedicationReminders(medications);
      await scheduleTestNotification();
      setTimeout(() => {
        router.back();
      }, 2500);
    }
  };

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [1, 1.2], [0.3, 0]),
  }));

  function interpolate(value: number, input: number[], output: number[]) {
    "worklet";
    const [i1, i2] = input;
    const [o1, o2] = output;
    return o1 + ((value - i1) * (o2 - o1)) / (i2 - i1);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Animated Bell Hero */}
        <View style={styles.heroWrap}>
          <Animated.View style={[styles.ring, ringStyle, { borderColor: colors.clay }]} />
          <Animated.View entering={ZoomIn.duration(800)} style={[styles.bellWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Bell size={40} color={colors.clay} strokeWidth={1.5} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>Stay Synchronized</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
             Enable live updates to track your position in the clinic queue and receive precision medication reminders.
          </Text>
        </Animated.View>

        {/* Value Prop Cards */}
        <View style={styles.propGrid}>
           {[
             { title: "Live Queue", desc: "Know exactly when it's your turn.", icon: Clock4, color: "#4CAF7D" },
             { title: "Care Team", desc: "Instant messages from your doctors.", icon: Stethoscope, color: colors.clay },
             { title: "Precision", desc: "Never miss a critical medication dose.", icon: Zap, color: colors.ink },
           ].map((prop, i) => (
             <Animated.View 
               key={prop.title} 
               entering={FadeInDown.delay(400 + i * 100).duration(500)}
               style={[styles.propCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
             >
                <View style={[styles.propIcon, { backgroundColor: prop.color + "15" }]}>
                   <prop.icon size={18} color={prop.color} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.propTitle, { color: colors.foreground }]}>{prop.title}</Text>
                   <Text style={[styles.propDesc, { color: colors.inkMuted }]}>{prop.desc}</Text>
                </View>
             </Animated.View>
           ))}
        </View>

        {/* Action Zone */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.footer}>
           {!isFinishing ? (
             <>
               <Pressable 
                 onPress={handleEnable}
                 style={[styles.enableBtn, { backgroundColor: colors.ink }]}
               >
                 <Text style={[styles.enableBtnText, { color: colors.primaryForeground }]}>Enable Live Updates</Text>
               </Pressable>
               <Pressable onPress={() => router.back()} style={styles.maybeBtn}>
                 <Text style={[styles.maybeBtnText, { color: colors.inkMuted }]}>Maybe later</Text>
               </Pressable>
             </>
           ) : (
             <Animated.View entering={ZoomIn} style={styles.successWrap}>
                <CheckCircle2 size={32} color="#4CAF7D" />
                <Text style={[styles.successText, { color: colors.foreground }]}>You're all set!</Text>
                <Text style={[styles.successSub, { color: colors.inkMuted }]}>Sending a test notification now...</Text>
             </Animated.View>
           )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    height: 56,
    justifyContent: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  heroWrap: {
    marginTop: 40,
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  bellWrap: {
    width: 100,
    height: 100,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  ring: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  textWrap: {
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  propGrid: {
    width: "100%",
    gap: 12,
  },
  propCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  propIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  propTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  propDesc: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  footer: {
    marginTop: "auto",
    width: "100%",
    paddingBottom: 20,
    gap: 12,
  },
  enableBtn: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  enableBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  maybeBtn: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  maybeBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  successWrap: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  successText: {
    fontSize: 20,
    fontFamily: "Fraunces_500Medium",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
});
