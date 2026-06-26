/**
 * Report Detail + Share Flow
 * ─ After sharing: animated success banner
 * ─ Doctor status cards: Accepted (green) / Pending (amber) / Declined (red)
 * ─ Status changes animate in with staggered FadeInDown
 */
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  FadeOutUp,
  ZoomIn,
  ZoomOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  Lock,
  Calendar,
  X,
  Check,
  Search,
  Star,
  MapPin,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Send,
  Stethoscope,
} from "lucide-react-native";
import { reports, doctors } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from "@/theme/ThemeProvider";

const { height: SCREEN_H } = Dimensions.get("window");

const TYPE_COLORS: Record<string, string> = {
  Lab: "#4CAF7D",
  Imaging: "#5B8FF9",
  Prescription: "#B6785C",
  Summary: "#9B7EBD",
};

type ShareStatus = "pending" | "accepted" | "declined";

const STATUS_CONFIG: Record<ShareStatus, { label: string; color: string; bg: string; Icon: any }> = {
  accepted: { label: "Accepted", color: "#4CAF7D", bg: "#E8F5E9", Icon: CheckCircle2 },
  pending: { label: "Pending", color: "#F59E0B", bg: "#FFF8E1", Icon: Clock },
  declined: { label: "Declined", color: "#EF4444", bg: "#FEF2F2", Icon: XCircle },
};

// ─── Animated doctor selection card ───────────────────────────────
function DoctorSelectCard({
  doctor,
  selected,
  onPress,
  colors,
}: {
  doctor: any;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  const scale = useSharedValue(1);
  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onPress();
  }, [onPress]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          ds.docCard,
          {
            backgroundColor: selected ? colors.ink : colors.background,
            borderColor: selected ? colors.ink : colors.border,
          },
        ]}
      >
        <View style={[ds.docAvatarWrap, { backgroundColor: selected ? "rgba(255,255,255,0.12)" : colors.surface }]}>
          <Text style={[ds.docInitials, { color: selected ? colors.primaryForeground : colors.foreground }]}>
            {doctor.initials}
          </Text>
        </View>
        <View style={ds.docInfo}>
          <Text style={[ds.docName, { color: selected ? colors.primaryForeground : colors.foreground }]} numberOfLines={1}>
            {doctor.name}
          </Text>
          <Text style={[ds.docSpec, { color: selected ? "rgba(255,255,255,0.6)" : colors.inkMuted }]}>
            {doctor.specialty}
          </Text>
          <View style={ds.docMeta}>
            <Star size={10} color={selected ? "#F0C97A" : colors.clay} fill={selected ? "#F0C97A" : colors.clay} />
            <Text style={[ds.docRating, { color: selected ? "rgba(255,255,255,0.7)" : colors.inkMuted }]}>
              {doctor.rating}
            </Text>
            <View style={[ds.dot, { backgroundColor: selected ? "rgba(255,255,255,0.3)" : colors.border }]} />
            <Text style={[ds.docRating, { color: selected ? "rgba(255,255,255,0.5)" : colors.inkMuted }]} numberOfLines={1}>
              {doctor.hospital}
            </Text>
          </View>
        </View>
        <View style={[ds.checkCircle, { backgroundColor: selected ? "#4CAF7D" : colors.surface, borderColor: selected ? "#4CAF7D" : colors.border }]}>
          {selected && (
            <Animated.View entering={ZoomIn.duration(200)}>
              <Check size={13} color="#fff" strokeWidth={2.5} />
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Doctor status card (post-share) ─────────────────────────────
function DoctorStatusCard({
  doctor,
  status,
  index,
  colors,
}: {
  doctor: any;
  status: ShareStatus;
  index: number;
  colors: any;
}) {
  const cfg = STATUS_CONFIG[status];
  const IconComp = cfg.Icon;
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 120, withSpring(1, { damping: 10, stiffness: 180 }));
    opacity.value = withDelay(index * 120, withTiming(1, { duration: 300 }));
  }, [status]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, dsc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Avatar initials={doctor.initials} size="md" />
      <View style={dsc.info}>
        <Text style={[dsc.name, { color: colors.foreground }]}>{doctor.name}</Text>
        <Text style={[dsc.spec, { color: colors.inkMuted }]}>{doctor.specialty}</Text>
      </View>
      <View style={[dsc.badge, { backgroundColor: cfg.bg }]}>
        <IconComp size={13} color={cfg.color} strokeWidth={2} />
        <Text style={[dsc.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </Animated.View>
  );
}

const dsc = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  spec: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
});

// ─── Biometric Success Overlay ──────────────────────────────────────
function AuthSuccessOverlay({ colors }: { colors: any }) {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}
      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.92)', zIndex: 9992, alignItems: 'center', justifyContent: 'center' }]}
    >
       <Animated.View 
         entering={ZoomIn.duration(500)}
         style={as.container}
       >
          <View style={[as.iconBox, { backgroundColor: colors.ink }]}>
             <ShieldCheck size={40} color={colors.primaryForeground} strokeWidth={1.5} />
          </View>
          <Text style={[as.title, { color: colors.foreground }]}>Identity Verified</Text>
          <Text style={[as.sub, { color: colors.inkMuted }]}>Encrypted tunnel established</Text>
       </Animated.View>
    </Animated.View>
  );
}

// ─── Sharing Progress Modal ───────────────────────────────────────
function ShareProgressModal({ progress, stage, colors }: { progress: number; stage: string; colors: any }) {
  const barWidth = useSharedValue(0);
  
  React.useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  const animatedBar = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const IconSource = stage === 'Preparing' ? User : stage === 'Encrypting' ? Clock : stage === 'Transmitting' ? Send : Stethoscope;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.98)', zIndex: 9991, alignItems: 'center', justifyContent: 'center', padding: 40 }]}>
       <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', width: '100%', gap: 32 }}>
          
          <View style={ps.iconTrack}>
             <View style={[ps.iconNode, { backgroundColor: colors.surface, borderColor: stage === 'Preparing' ? colors.clay : colors.border }]}>
                <User size={22} color={stage === 'Preparing' ? colors.clay : colors.inkMuted} strokeWidth={1.5} />
             </View>
             <View style={[ps.dash, { backgroundColor: progress > 33 ? colors.clay : colors.border }]} />
             <View style={[ps.iconNode, { backgroundColor: colors.surface, borderColor: stage === 'Encrypting' ? colors.clay : colors.border }]}>
                <Clock size={22} color={stage === 'Encrypting' ? colors.clay : colors.inkMuted} strokeWidth={1.5} />
             </View>
             <View style={[ps.dash, { backgroundColor: progress > 66 ? colors.clay : colors.border }]} />
             <View style={[ps.iconNode, { backgroundColor: colors.surface, borderColor: stage === 'Transmitting' ? colors.clay : colors.border }]}>
                <Stethoscope size={22} color={stage === 'Transmitting' ? colors.clay : colors.inkMuted} strokeWidth={1.5} />
             </View>
          </View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={[ps.stageText, { color: colors.foreground }]}>{stage}...</Text>
            <Text style={[ps.subText, { color: colors.inkMuted }]}>
               {stage === 'Preparing' ? 'Accessing clinical records' : stage === 'Encrypting' ? 'Establishing secure tunnel' : 'Sending to selected providers'}
            </Text>
          </View>

          <View style={[ps.barOuter, { backgroundColor: colors.border }]}>
             <Animated.View style={[ps.barInner, { backgroundColor: colors.clay }, animatedBar]} />
          </View>
       </Animated.View>
    </View>
  );
}

const ps = StyleSheet.create({
  iconTrack: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconNode: { width: 48, height: 48, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dash: { width: 24, height: 2, borderRadius: 1 },
  stageText: { fontSize: 20, fontFamily: "Fraunces_500Medium", letterSpacing: -0.4 },
  subText: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  barOuter: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  barInner: { height: '100%', borderRadius: 3 },
});

const as = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  iconBox: { width: 80, height: 80, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 24, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: "DMSans_400Regular" },
});

// ─── Main screen ──────────────────────────────────────────────────
export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const initial = reports.find((r) => r.id === reportId);
  const [shared, setShared] = useState<string[]>(initial?.shared ?? []);
  const [showShare, setShowShare] = useState(false);
  const [query, setQuery] = useState("");
  const [expiry, setExpiry] = useState(7);

  // Post-share state
  const [shareStatuses, setShareStatuses] = useState<Record<string, ShareStatus>>({});

  // Biometric / Sharing state
  const [authSuccess,  setAuthSuccess]   = useState(false);
  const [isSharing,      setIsSharing]      = useState(false);
  const [sharingStage,   setSharingStage]   = useState("Preparing");
  const [sharingProgress, setSharingProgress] = useState(0);

  // Biometric Auth Gate – Shifted to 'Grant Access' within modal
  const handleSecureGrantAccess = async () => {
    if (shared.length === 0) return;
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          startSharingSequence();
        }, 1200);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to grant clinical access',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          startSharingSequence();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startSharingSequence = () => {
    setShowShare(false);
    setIsSharing(true);
    setSharingProgress(10);
    setSharingStage("Preparing");

    setTimeout(() => { setSharingProgress(40); setSharingStage("Encrypting"); }, 800);
    setTimeout(() => { setSharingProgress(75); setSharingStage("Transmitting"); }, 1600);
    setTimeout(() => { 
      setSharingProgress(100); 
      setIsSharing(false);
      simulateResponses(shared);
    }, 2800);
  };

  // Simulate async doctor responses after share
  const simulateResponses = useCallback((sharedIds: string[]) => {
    // Initially all pending
    const initial: Record<string, ShareStatus> = {};
    sharedIds.forEach((id) => { initial[id] = "pending"; });
    setShareStatuses(initial);

    // Simulate responses arriving over time
    const mockResponses: ShareStatus[] = ["accepted", "accepted", "declined", "accepted", "pending"];
    sharedIds.forEach((id, i) => {
      const delay = 1000 + i * 800;
      const response = mockResponses[i % mockResponses.length];
      setTimeout(() => {
        setShareStatuses((prev) => ({ ...prev, [id]: response }));
      }, delay);
    });
  }, []);

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((d) =>
        !query ? true : d.name.toLowerCase().includes(query.toLowerCase()) || d.specialty.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  if (!initial) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.inkMuted, fontFamily: "DMSans_400Regular", padding: 24 }}>Report not found.</Text>
      </SafeAreaView>
    );
  }

  const toggleShare = (id: string) =>
    setShared((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleShare = () => {
    setShowShare(false);
    simulateResponses(shared);
  };

  const sharedDoctors = doctors.filter((d) => shared.includes(d.id));
  const typeColor = TYPE_COLORS[initial.type] ?? colors.clay;

  const labResults = [
    { k: "Glucose", v: "92 mg/dL", flag: "Normal", ok: true },
    { k: "HbA1c", v: "5.4 %", flag: "Normal", ok: true },
    { k: "Cholesterol", v: "186 mg/dL", flag: "Normal", ok: true },
    { k: "LDL", v: "118 mg/dL", flag: "Borderline", ok: false },
    { k: "HDL", v: "61 mg/dL", flag: "Optimal", ok: true },
  ];

  const statusDoctors = Object.keys(shareStatuses).map((id) => ({
    ...(doctors.find((d) => d.id === id)!),
    status: shareStatuses[id],
  }));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {authSuccess && <AuthSuccessOverlay colors={colors} />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Back nav */}
        <Pressable onPress={() => router.back()} style={s.backRow}>
          <ArrowLeft size={18} color={colors.ink} strokeWidth={1.75} />
          <Text style={[s.backText, { color: colors.inkMuted }]}>Archive</Text>
        </Pressable>

        {/* ── Report header ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500)} style={s.reportHeader}>
          <View style={[s.typeBadge, { backgroundColor: typeColor + "18", borderColor: typeColor + "40" }]}>
            <View style={[s.typeDot, { backgroundColor: typeColor }]} />
            <Text style={[s.typeText, { color: typeColor }]}>{initial.type} Report</Text>
          </View>
          <Text style={[s.title, { color: colors.foreground }]}>{initial.title}</Text>
          <Text style={[s.meta, { color: colors.inkMuted }]}>
            {initial.doctor}{"  ·  "}
            {new Date(initial.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {"  ·  "}{initial.size}
          </Text>
          <View style={s.actionRow}>
            <Pressable style={[s.ghostBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Download size={15} color={colors.ink} strokeWidth={1.75} />
              <Text style={[s.ghostBtnText, { color: colors.ink }]}>Download</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowShare(true)}
              style={[s.primaryBtn, { backgroundColor: colors.ink }]}
            >
              <Share2 size={15} color={colors.primaryForeground} strokeWidth={1.75} />
              <Text style={[s.primaryBtnText, { color: colors.primaryForeground }]}>Share</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Doctor status section (post-share) ──────────────── */}
        {statusDoctors.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.statusSection}>
            <View style={s.statusHeader}>
              <AlertCircle size={16} color={colors.clay} strokeWidth={1.75} />
              <Text style={[s.statusTitle, { color: colors.foreground }]}>Share Status</Text>
            </View>
            <View style={s.statusList}>
              {statusDoctors.map((d, i) => (
                <DoctorStatusCard
                  key={d.id}
                  doctor={d}
                  status={d.status}
                  index={i}
                  colors={colors}
                />
              ))}
            </View>
            {/* Legend */}
            <View style={[s.legendRow, { borderTopColor: colors.border }]}>
              {(Object.entries(STATUS_CONFIG) as [ShareStatus, typeof STATUS_CONFIG[ShareStatus]][]).map(([key, cfg]) => {
                const count = statusDoctors.filter((d) => d.status === key).length;
                if (count === 0) return null;
                return (
                  <View key={key} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: cfg.color }]} />
                    <Text style={[s.legendText, { color: colors.inkMuted }]}>
                      {count} {cfg.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Document preview ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[s.cardHeader, { borderBottomColor: colors.border }]}>
              <View style={s.cardHeaderLeft}>
                <FileText size={15} color={typeColor} strokeWidth={1.75} />
                <Text style={[s.cardLabel, { color: colors.inkMuted }]}>Lab Results</Text>
              </View>
              <View style={s.encryptedBadge}>
                <Lock size={11} color={colors.inkMuted} strokeWidth={1.75} />
                <Text style={[s.encryptedText, { color: colors.inkMuted }]}>AES-256</Text>
              </View>
            </View>
            <View style={s.labTable}>
              {labResults.map((row, i) => (
                <Animated.View
                  key={row.k}
                  entering={FadeInDown.duration(300).delay(100 + i * 60)}
                  style={[s.labRow, i < labResults.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                >
                  <Text style={[s.labKey, { color: colors.inkMuted }]}>{row.k}</Text>
                  <View style={s.labRight}>
                    <Text style={[s.labVal, { color: colors.foreground }]}>{row.v}</Text>
                    <View style={[s.flagPill, { backgroundColor: row.ok ? "#4CAF7D18" : "#B6785C18" }]}>
                      <Text style={[s.flagText, { color: row.ok ? "#4CAF7D" : "#B6785C" }]}>{row.flag}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Access control panel ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)}>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.accessHeader}>
              <ShieldCheck size={18} color={colors.clay} strokeWidth={1.75} />
              <View>
                <Text style={[s.accessTitle, { color: colors.foreground }]}>Access Control</Text>
                <Text style={[s.accessSub, { color: colors.inkMuted }]}>
                  {sharedDoctors.length === 0 ? "This report is private" : `Shared with ${sharedDoctors.length} doctor${sharedDoctors.length > 1 ? "s" : ""}`}
                </Text>
              </View>
            </View>
            {sharedDoctors.length > 0 && (
              <View style={s.sharedList}>
                {sharedDoctors.map((d) => (
                  <View key={d.id} style={[s.sharedRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Avatar initials={d.initials} size="sm" />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.sharedName, { color: colors.foreground }]}>{d.name}</Text>
                      <Text style={[s.sharedSpec, { color: colors.inkMuted }]}>{d.specialty}</Text>
                    </View>
                    <Pressable onPress={() => toggleShare(d.id)} style={[s.revokeBtn, { borderColor: colors.border }]}>
                      <X size={13} color={colors.inkMuted} strokeWidth={1.75} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Pressable
              onPress={() => { setQuery(""); setShowShare(true); }}
              style={[s.addDoctorBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Share2 size={15} color={colors.inkMuted} strokeWidth={1.75} />
              <Text style={[s.addDoctorText, { color: colors.inkMuted }]}>Share with a doctor</Text>
            </Pressable>
            <View style={[s.auditBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[s.auditLabel, { color: colors.inkMuted }]}>AUDIT TRAIL</Text>
              <Text style={[s.auditItem, { color: colors.inkMuted }]}>· Uploaded {new Date(initial.date).toLocaleDateString()}</Text>
              <Text style={[s.auditItem, { color: colors.inkMuted }]}>· Encrypted with AES-256</Text>
              <Text style={[s.auditItem, { color: colors.inkMuted }]}>· {sharedDoctors.length} active access grant{sharedDoctors.length !== 1 ? "s" : ""}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Share bottom sheet ─────────────────────────────────── */}
      <Modal visible={showShare} transparent animationType="none">
        <Pressable style={s.overlay} onPress={() => setShowShare(false)}>
          <Animated.View
            entering={SlideInDown.duration(400)}
            exiting={SlideOutDown.duration(250)}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <Pressable
              onPress={() => {}}
              style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}
            >
              <View style={[s.handle, { backgroundColor: colors.border }]} />

              <View style={s.sheetHeader}>
                <View>
                  <Text style={[s.sheetTitle, { color: colors.foreground }]}>Share Report</Text>
                  <Text style={[s.sheetSub, { color: colors.inkMuted }]} numberOfLines={1}>{initial.title}</Text>
                </View>
                <Pressable onPress={() => setShowShare(false)} style={[s.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <X size={16} color={colors.inkMuted} strokeWidth={1.75} />
                </Pressable>
              </View>

              <View style={[s.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Search size={16} color={colors.inkMuted} strokeWidth={1.75} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by name or specialty…"
                  placeholderTextColor={colors.inkMuted}
                  style={[s.searchInput, { color: colors.foreground }]}
                />
              </View>

              <ScrollView
                style={{ maxHeight: SCREEN_H * 0.36 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
              >
                {filteredDoctors.map((d) => (
                  <DoctorSelectCard
                    key={d.id}
                    doctor={d}
                    selected={shared.includes(d.id)}
                    onPress={() => toggleShare(d.id)}
                    colors={colors}
                  />
                ))}
              </ScrollView>

              {/* Expiry stepper */}
              <View style={[s.expiryRow, { borderTopColor: colors.border }]}>
                <View style={s.expiryLeft}>
                  <Calendar size={14} color={colors.inkMuted} strokeWidth={1.75} />
                  <View>
                    <Text style={[s.expiryLabel, { color: colors.foreground }]}>Access expires in</Text>
                    <Text style={[s.expirySub, { color: colors.inkMuted }]}>Revoke anytime from this screen</Text>
                  </View>
                </View>
                <View style={s.stepperRow}>
                  <Pressable onPress={() => setExpiry((e) => Math.max(1, e - 1))} style={[s.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Minus size={14} color={colors.ink} strokeWidth={2} />
                  </Pressable>
                  <Text style={[s.expiryVal, { color: colors.foreground }]}>{expiry}d</Text>
                  <Pressable onPress={() => setExpiry((e) => Math.min(30, e + 1))} style={[s.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Plus size={14} color={colors.ink} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleSecureGrantAccess}
                style={[s.doneBtn, { backgroundColor: colors.ink, opacity: shared.length === 0 ? 0.35 : 1 }]}
                disabled={shared.length === 0}
              >
                <Check size={16} color={colors.primaryForeground} strokeWidth={2} />
                <Text style={[s.doneBtnText, { color: colors.primaryForeground }]}>
                  Grant access to {shared.length} doctor{shared.length !== 1 ? "s" : ""}
                </Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {isSharing && (
        <ShareProgressModal 
          progress={sharingProgress} 
          stage={sharingStage} 
          colors={colors} 
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },

  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  backText: { fontSize: 13, fontFamily: "DMSans_500Medium" },

  // ── Success banner
  statusSection: { gap: 12 },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusTitle: { fontSize: 16, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },
  statusList: { gap: 10 },
  legendRow: { flexDirection: "row", gap: 16, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 12, fontFamily: "DMSans_400Regular" },

  reportHeader: { gap: 12 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  typeText: { fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.5 },
  title: { fontSize: 28, fontFamily: "Fraunces_400Regular", letterSpacing: -0.8, lineHeight: 35 },
  meta: { fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  ghostBtn: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 11 },
  ghostBtnText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 11 },
  primaryBtnText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },

  card: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: { fontSize: 12, fontFamily: "DMSans_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
  encryptedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  encryptedText: { fontSize: 11, fontFamily: "DMSans_400Regular" },

  labTable: { paddingHorizontal: 16 },
  labRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13 },
  labKey: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  labRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  labVal: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  flagPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  flagText: { fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.3 },

  accessHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  accessTitle: { fontSize: 16, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },
  accessSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  sharedList: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  sharedRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  sharedName: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  sharedSpec: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 1 },
  revokeBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addDoctorBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderStyle: "dashed", paddingVertical: 13 },
  addDoctorText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  auditBox: { margin: 16, borderRadius: 12, borderWidth: 1, padding: 12, gap: 5 },
  auditLabel: { fontSize: 9, fontFamily: "DMSans_600SemiBold", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  auditItem: { fontSize: 12, fontFamily: "DMSans_400Regular" },

  // ── Sheet
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 20, gap: 16, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  sheetTitle: { fontSize: 20, fontFamily: "Fraunces_500Medium", letterSpacing: -0.4 },
  sheetSub: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "DMSans_400Regular", padding: 0 },
  expiryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
  expiryLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  expiryLabel: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  expirySub: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 2 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  expiryVal: { fontSize: 17, fontFamily: "Fraunces_500Medium", minWidth: 32, textAlign: "center" },
  doneBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 15 },
  doneBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});

// ── Doctor card styles ─────────────────────────────────────────────
const ds = StyleSheet.create({
  docCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13 },
  docAvatarWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  docInitials: { fontSize: 15, fontFamily: "Fraunces_500Medium" },
  docInfo: { flex: 1, gap: 3 },
  docName: { fontSize: 14, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  docSpec: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  docMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  docRating: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
