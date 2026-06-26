import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Star,
  GraduationCap,
  Award,
  Phone,
  MessageCircle,
  Video,
  ChevronRight,
  Verified,
  Pill,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { doctors, medications } from "../../lib/mock-data";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate, 
  Extrapolate 
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 160;

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const scrollY = useSharedValue(0);

  const doc = doctors.find((c) => c.id === id);
  const docMeds = medications.filter(m => m.prescribedBy === doc?.name);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [80, 120],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY: interpolate(scrollY.value, [80, 120], [20, 0], Extrapolate.CLAMP) }],
      backgroundColor: colors.surface,
      borderBottomWidth: opacity > 0.5 ? 1 : 0,
      borderBottomColor: colors.border,
    };
  });

  const cardNameStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [60, 100],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const parallaxStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.5, 1],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  if (!doc) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🚀 Sticky Header (Fades in) */}
      <Animated.View style={[styles.stickyHeader, stickyHeaderStyle]}>
         <SafeAreaView edges={["top"]}>
            <View style={styles.headerInner}>
               <Pressable onPress={() => router.back()} style={styles.backBtnSmall}>
                  <ArrowLeft size={20} color={colors.foreground} />
               </Pressable>
               <Animated.Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {doc.name}
               </Animated.Text>
               <View style={{ width: 36 }} />
            </View>
         </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 🎨 Parallax Mesh Gradient Header */}
        <Animated.View style={[styles.headerContainer, parallaxStyle]}>
          <LinearGradient
             colors={[colors.clay, "#8D5D48", "#5D3A2C"]}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={StyleSheet.absoluteFill}
          />
          <View style={StyleSheet.absoluteFill}>
            {/* Subtle Abstract Shapes for "Mesh" feel */}
            <View style={[styles.shape, { top: -20, right: -30, backgroundColor: "rgba(255,255,255,0.1)" }]} />
            <View style={[styles.shape, { bottom: -40, left: -20, backgroundColor: "rgba(0,0,0,0.05)" }]} />
          </View>
          
          <SafeAreaView edges={["top"]}>
             <View style={styles.floatHeader}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                   <ArrowLeft size={24} color="#FFF" />
                </Pressable>
             </View>
          </SafeAreaView>
        </Animated.View>

        {/* 🧛 Main Identity Card */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.mainCard}>
           <View style={[styles.profileTop, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             <View style={styles.avatarRow}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.clay + "20" }]}>
                   <Text style={[styles.avatarInitials, { color: colors.clay }]}>{doc.initials}</Text>
                </View>
                <View style={styles.identityText}>
                   <View style={styles.nameRow}>
                     <Animated.Text style={[styles.name, { color: colors.foreground }, cardNameStyle]}>
                        {doc.name}
                     </Animated.Text>
                     <Verified size={18} color={colors.clay} />
                   </View>
                   <Text style={[styles.specialty, { color: colors.inkMuted }]}>{doc.specialty}</Text>
                   <View style={styles.ratingRow}>
                      <Star size={14} color="#FFB800" fill="#FFB800" />
                      <Text style={[styles.rating, { color: colors.foreground }]}>4.9</Text>
                      <Text style={[styles.reviewCount, { color: colors.inkMuted }]}>· 120 reviews</Text>
                   </View>
                </View>
             </View>

             <View style={[styles.divider, { backgroundColor: colors.border }]} />

             <View style={styles.clinicInfo}>
                <View style={[styles.iconBox, { backgroundColor: colors.clay + "10" }]}>
                   <MapPin size={16} color={colors.clay} />
                </View>
                <View style={styles.clinicDetails}>
                   <Text style={[styles.clinicName, { color: colors.foreground }]}>{doc.location || doc.hospital}</Text>
                   <Text style={[styles.clinicAddr, { color: colors.inkMuted }]}>Consultation Room 4 · Floor 2</Text>
                </View>
             </View>
           </View>

           {/* 📞 Action Buttons */}
           <View style={styles.actionGrid}>
             <Pressable 
              style={[styles.commBtn, { backgroundColor: "#4CAF50" + "15" }]}
              onPress={() => {}} 
             >
               <Phone size={22} color="#4CAF50" />
            </Pressable>
            <Pressable style={[styles.commBtn, { backgroundColor: "#2196F3" + "15" }]}>
               <MessageCircle size={22} color="#2196F3" />
            </Pressable>
            <Pressable 
               onPress={() => router.push("/care-team/video-call")}
               style={[styles.commBtn, { backgroundColor: colors.clay + "15" }]}
             >
               <Video size={22} color={colors.clay} />
            </Pressable>
            <Pressable 
             style={[styles.bookBtn, { backgroundColor: colors.ink }]}
             onPress={() => router.push(`/(tabs)/book/${doc.id}`)}
            >
               <Text style={styles.bookBtnText}>Book appointment</Text>
            </Pressable>
         </View>

         {/* 🎓 Academic & Professional Stats */}
         <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <GraduationCap size={20} color={colors.inkMuted} />
               <Text style={[styles.statLabel, { color: colors.inkMuted }]}>Experience</Text>
               <Text style={[styles.statVal, { color: colors.foreground }]}>{doc.experience}+ Years</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <Award size={20} color={colors.inkMuted} />
               <Text style={[styles.statLabel, { color: colors.inkMuted }]}>Patients</Text>
               <Text style={[styles.statVal, { color: colors.foreground }]}>2.5k+</Text>
            </View>
         </View>

         {/* 📄 Education & Background */}
         <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Expertise & Background</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <View style={styles.infoRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.clay }]} />
                  <Text style={[styles.infoText, { color: colors.inkMuted }]}>{doc.education || "Board certified specialist."}</Text>
               </View>
               <View style={[styles.miniDivider, { backgroundColor: colors.border }]} />
               <View style={styles.infoRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.clay }]} />
                  <Text style={[styles.infoText, { color: colors.inkMuted }]}>{doc.bio}</Text>
               </View>
            </View>
         </View>

         {/* 💊 Past Prescriptions */}
         {docMeds.length > 0 && (
           <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Past Prescriptions</Text>
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 {docMeds.map((med, idx) => (
                   <View key={med.id}>
                      <View style={styles.medRow}>
                         <View style={[styles.statIcon, { backgroundColor: colors.clay + "15" }]}>
                            <Pill size={16} color={colors.clay} />
                         </View>
                         <View style={{ flex: 1 }}>
                            <Text style={[styles.medName, { color: colors.foreground }]}>{med.name}</Text>
                            <Text style={[styles.medSub, { color: colors.inkMuted }]}>{med.dosage} · {med.frequency}</Text>
                         </View>
                      </View>
                      {idx < docMeds.length - 1 && <View style={[styles.miniDivider, { backgroundColor: colors.border, marginVertical: 12 }]} />}
                   </View>
                 ))}
              </View>
           </View>
         )}

         {/* 📅 Schedule Preview */}
         <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheduling</Text>
               <Pressable onPress={() => router.push(`/doctor/schedule/${doc.id}`)}>
                  <Text style={[styles.viewAll, { color: colors.clay }]}>View all</Text>
               </Pressable>
            </View>
            <Pressable style={[styles.scheduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/doctor/schedule/${doc.id}`)}>
               <View>
                  <Text style={[styles.nextAvail, { color: colors.inkMuted }]}>Next available slot</Text>
                  <Text style={[styles.availTime, { color: colors.foreground }]}>{doc.nextSlot}</Text>
               </View>
               <ChevronRight size={20} color={colors.border} />
            </Pressable>
         </View>

         {/* 🌟 Infinite Testimonials Marquee */}
         <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Patient Success Stories</Text>
            <ScrollView 
               horizontal 
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={{ gap: 16, paddingRight: 40 }}
               style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
            >
               {[
                  { text: "Dr. Thorne completely changed my approach to heart health. The metabolic focus was exactly what I needed.", patient: "Sarah M.", tag: "Hypertension" },
                  { text: "Incredibly thorough and empathetic. The telehealth interface makes follow-ups so easy.", patient: "James L.", tag: "Wellness" },
                  { text: "Finally found a doctor who looks at the root cause rather than just treating symptoms.", patient: "Elena R.", tag: "Recovery" }
               ].map((t, idx) => (
                  <View key={idx} style={[styles.testimonialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                     <View style={styles.testimonialHeader}>
                        <View style={[styles.tagBadge, { backgroundColor: colors.clay + "15" }]}>
                           <Text style={[styles.tagText, { color: colors.clay }]}>{t.tag}</Text>
                        </View>
                        <View style={styles.stars}>
                           {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} color="#FFB800" fill="#FFB800" />)}
                        </View>
                     </View>
                     <Text style={[styles.testimonialText, { color: colors.ink }]}>"{t.text}"</Text>
                     <Text style={[styles.patientName, { color: colors.inkMuted }]}>— {t.patient}</Text>
                  </View>
               ))}
            </ScrollView>
         </View>

         <View style={{ height: 40 }} />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerInner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  stickyTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    flex: 1,
    textAlign: "center",
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    width: "100%",
  },
  floatHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  shape: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingTop: 0,
  },
  mainCard: {
    marginTop: -40,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  profileTop: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 0,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  avatarInitials: { fontSize: 24, fontFamily: "Outfit-Bold" },
  identityText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 22, fontFamily: "Outfit-Bold" },
  specialty: { fontSize: 14, fontFamily: "Outfit-Medium", marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 14, fontFamily: "Outfit-Bold" },
  reviewCount: { fontSize: 12, fontFamily: "Outfit-Regular" },
  divider: { height: 1, marginVertical: 16, opacity: 0.5 },
  clinicInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  clinicDetails: { flex: 1 },
  clinicName: { fontSize: 15, fontFamily: "Outfit-Bold" },
  clinicAddr: { fontSize: 13, fontFamily: "Outfit-Regular" },
  actionGrid: { flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 24 },
  commBtn: { width: 54, height: 54, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  bookBtn: { flex: 1, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  bookBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Outfit-Bold" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statItem: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 11, fontFamily: "Outfit-Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  statVal: { fontSize: 16, fontFamily: "Outfit-Bold" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Outfit-Bold", marginBottom: 12 },
  viewAll: { fontSize: 14, fontFamily: "Outfit-Bold" },
  infoCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 12 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  infoText: { flex: 1, fontSize: 15, fontFamily: "Outfit-Regular", lineHeight: 22 },
  miniDivider: { height: 1, opacity: 0.3 },
  scheduleCard: { padding: 16, borderRadius: 20, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextAvail: { fontSize: 12, fontFamily: "Outfit-Medium", marginBottom: 2 },
  availTime: { fontSize: 15, fontFamily: "Outfit-Bold" },
  testimonialCard: {
    width: 260,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  testimonialHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: "Outfit-Bold", textTransform: "uppercase" },
  stars: { flexDirection: "row", gap: 2 },
  testimonialText: { fontSize: 14, fontFamily: "Outfit-Italic", lineHeight: 20 },
  patientName: { fontSize: 12, fontFamily: "Outfit-Medium" },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  medName: { fontSize: 16, fontFamily: "Outfit-Bold" },
  medSub: { fontSize: 13, fontFamily: "Outfit-Regular" },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
