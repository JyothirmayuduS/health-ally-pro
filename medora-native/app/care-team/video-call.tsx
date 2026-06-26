import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MoreHorizontal,
  Activity,
  Thermometer,
  Wind,
  ShieldCheck,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function VideoCallScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTime, setCallTime] = useState(0);

  // Animation for the "Live" pulse
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    );
    
    const timer = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8 / pulse.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 📸 Background Feed (Doctor) */}
      <Image 
        source={{ uri: "doctor_video_feed_1776603317496.png" }} 
        style={styles.fullScreenFeed}
        resizeMode="cover"
      />
      
      {/* 🟢 Dark Overlay for readability */}
      <View style={styles.overlay} />

      {/* 🚀 Top Bar Controls */}
      <SafeAreaView style={styles.topBar}>
        <Animated.View entering={FadeInUp.delay(300)} style={styles.topInfo}>
          <View style={styles.liveIndicator}>
             <Animated.View style={[styles.pulseDot, pulseStyle]} />
             <View style={styles.solidDot} />
             <Text style={styles.liveText}>LIVE: DR. ELEANOR THORNE</Text>
          </View>
          <Text style={styles.timerText}>{formatTime(callTime)}</Text>
        </Animated.View>
        
        <View style={styles.headerActions}>
           <View style={styles.encryptionBadge}>
             <ShieldCheck size={14} color="#4ADE80" />
             <Text style={styles.encryptionText}>End-to-end Encrypted</Text>
           </View>
        </View>
      </SafeAreaView>

      {/* 📊 Floating Health Vitals (Premium Overlay) */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.vitalsColumn}>
        <View style={styles.vitalCard}>
           <Activity size={18} color="#FF6B6B" />
           <View>
              <Text style={styles.vitalVal}>72 BPM</Text>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
           </View>
        </View>
        
        <View style={styles.vitalCard}>
           <Wind size={18} color="#4EA8DE" />
           <View>
              <Text style={styles.vitalVal}>98%</Text>
              <Text style={styles.vitalLabel}>SpO2</Text>
           </View>
        </View>

        <View style={styles.vitalCard}>
           <Text style={[styles.vitalVal, { color: colors.clay, fontSize: 16 }]}>T4-Active</Text>
           <Text style={styles.vitalLabel}>Current Status</Text>
        </View>
      </Animated.View>

      {/* 🤳 Picture-in-Picture (Patient Feed) */}
      <Animated.View entering={FadeIn.delay(800)} style={styles.pipWrapper}>
         {!isVideoOff ? (
            <View style={styles.pipContent}>
               <View style={styles.pipPlaceholder}>
                  <Text style={styles.pipText}>Cure Link Active</Text>
               </View>
            </View>
         ) : (
            <View style={[styles.pipContent, { backgroundColor: "#1A1A1A" }]}>
               <VideoOff size={24} color="#666" />
            </View>
         )}
      </Animated.View>

      {/* 📱 Bottom Control Bar */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.footer}>
         <View style={styles.controlBar}>
            <Pressable 
              onPress={() => setIsMuted(!isMuted)}
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            >
              {isMuted ? <MicOff size={24} color="#FFF" /> : <Mic size={24} color="#FFF" />}
            </Pressable>

            <Pressable 
              onPress={() => setIsVideoOff(!isVideoOff)}
              style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            >
              {isVideoOff ? <VideoOff size={24} color="#FFF" /> : <VideoIcon size={24} color="#FFF" />}
            </Pressable>

            <Pressable 
              style={[styles.controlBtn, { backgroundColor: "#FF4D4D", width: 70, borderRadius: 24 }]} 
              onPress={() => router.back()}
            >
              <PhoneOff size={24} color="#FFF" />
            </Pressable>

            <Pressable style={styles.controlBtn}>
               <MoreHorizontal size={24} color="#FFF" />
            </Pressable>
         </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fullScreenFeed: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topInfo: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B6B",
    position: "absolute",
    left: 0,
  },
  solidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF6B6B",
  },
  liveText: { color: "#FFF", fontSize: 10, fontFamily: "Outfit-Bold", letterSpacing: 0.5 },
  timerText: { color: "#FFF", fontSize: 16, fontFamily: "Outfit-Bold" },
  headerActions: { alignItems: "flex-end" },
  encryptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  encryptionText: { color: "#FFF", fontSize: 10, fontFamily: "Outfit-Medium" },
  vitalsColumn: {
    position: "absolute",
    left: 20,
    top: height * 0.25,
    gap: 12,
  },
  vitalCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 110,
  },
  vitalVal: { fontSize: 14, fontFamily: "Outfit-Bold", color: "#1A1A1A" },
  vitalLabel: { fontSize: 10, fontFamily: "Outfit-Regular", color: "#666" },
  pipWrapper: {
    position: "absolute",
    right: 20,
    top: height * 0.2,
    width: 100,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  pipContent: { flex: 1, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  pipPlaceholder: { flex: 1, backgroundColor: "#222", width: "100%", justifyContent: "flex-end", padding: 8 },
  pipText: { color: "#FFF", fontSize: 8, fontFamily: "Outfit-Bold", opacity: 0.6 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  controlBar: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,107,107,0.8)",
  },
});
