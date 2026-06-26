/**
 * Profile Screen – Patient identity, stats, health info, and preferences
 * Visual hierarchy: Hero identity card → Stats → Health info → Preferences → Sign out
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Mail,
  Calendar,
  FileText,
  Shield,
  LogOut,
  Bell,
  Heart,
  ChevronRight,
  Edit3,
  Phone,
  Droplets,
  User,
  Users,
  Scale,
} from "lucide-react-native";
import { patient, appointments, reports, familyMembers } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

function PreferenceRow({
  icon: Icon,
  title,
  subtitle,
  defaultOn,
  colors,
}: {
  icon: any;
  title: string;
  subtitle: string;
  defaultOn: boolean;
  colors: any;
}) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <View style={[s.prefRow]}>
      <View style={[s.prefIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Icon size={16} color={colors.inkMuted} strokeWidth={1.75} />
      </View>
      <View style={s.prefText}>
        <Text style={[s.prefTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[s.prefSub, { color: colors.inkMuted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: colors.border, true: colors.clay }}
        thumbColor="#fff"
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function MenuRow({
  icon: Icon,
  label,
  colors,
  destructive,
  onPress,
}: {
  icon: any;
  label: string;
  colors: any;
  destructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.menuRow]}
    >
      <View style={[s.prefIcon, { backgroundColor: destructive ? "#FFF4F2" : colors.background, borderColor: colors.border }]}>
        <Icon size={16} color={destructive ? colors.destructive : colors.inkMuted} strokeWidth={1.75} />
      </View>
      <Text style={[s.menuLabel, { color: destructive ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      {!destructive && <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.75} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const completedAppts = appointments.filter((a) => a.status === "completed").length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero identity card ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={[s.heroCard, { backgroundColor: colors.ink }]}>
            {/* Avatar + name */}
            <View style={s.heroTop}>
              <Avatar initials={patient.initials} size="xl" variant="ink" />
              <View style={{ flex: 1 }}>
                <Text style={[s.heroName, { color: colors.primaryForeground }]}>
                  {patient.name}
                </Text>
                <View style={s.heroEmailRow}>
                  <Mail size={12} color={colors.primaryForeground} strokeWidth={1.75} opacity={0.6} />
                  <Text style={[s.heroEmail, { color: colors.primaryForeground }]}>
                    {patient.email}
                  </Text>
                </View>
                <Text style={[s.heroMember, { color: colors.primaryForeground }]}>
                  Member since {patient.memberSince}
                </Text>
              </View>
            </View>

            {/* Edit button */}
            <Pressable 
              style={s.editBtn} 
              onPress={() => router.push("/settings/edit")}
            >
              <Edit3 size={14} color={colors.primaryForeground} strokeWidth={1.75} />
              <Text style={[s.editText, { color: colors.primaryForeground }]}>Edit profile</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Stat strip ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.statRow}>
          {[
            { icon: Calendar, label: "Appointments", value: String(appointments.length).padStart(2, "0") },
            { icon: FileText, label: "Reports", value: String(reports.length).padStart(2, "0") },
            { icon: Heart, label: "Visits done", value: String(completedAppts).padStart(2, "0") },
          ].map(({ icon: Icon, label, value }) => (
            <View
              key={label}
              style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Icon size={16} color={colors.clay} strokeWidth={1.75} />
              <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
              <Text style={[s.statLabel, { color: colors.inkMuted }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Family Network ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(130)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Family Network</Text>
            <Pressable onPress={() => router.push("/(tabs)/family")}>
              <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.clay }}>View all</Text>
            </Pressable>
          </View>
          <Pressable 
            onPress={() => router.push("/(tabs)/family")}
            style={[s.prefCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={[s.prefIcon, { backgroundColor: colors.clay + '1A', borderColor: 'transparent', width: 44, height: 44, borderRadius: 14 }]}>
                <Users size={20} color={colors.clay} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: colors.foreground, marginBottom: 2 }}>{familyMembers.length} Dependents</Text>
                <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: colors.inkMuted }}>Track medical progress & plans</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  {familyMembers.map((fm, i) => (
                    <View key={fm.id} style={{ 
                      width: 28, height: 28, borderRadius: 14, backgroundColor: fm.avatarColor, 
                      alignItems: 'center', justifyContent: 'center',
                      marginLeft: i > 0 ? -8 : 0,
                      borderWidth: 2, borderColor: colors.surface 
                    }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontFamily: "DMSans_700Bold" }}>{fm.initials}</Text>
                    </View>
                  ))}
                </View>
                <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.5} />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* ── Health info ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Health Profile</Text>
          <View style={[s.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { icon: User, label: "Full name", value: patient.name },
              { icon: Mail, label: "Email", value: patient.email },
              { icon: Calendar, label: "Age", value: `${patient.age} years` },
              { icon: Droplets, label: "Blood group", value: patient.bloodGroup },
            ].map(({ icon: Icon, label, value }, i) => (
              <View
                key={label}
                style={[
                  s.infoRow,
                  i < 3 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[s.infoIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon size={14} color={colors.inkMuted} strokeWidth={1.75} />
                </View>
                <View style={s.infoText}>
                  <Text style={[s.infoLabel, { color: colors.inkMuted }]}>{label}</Text>
                  <Text style={[s.infoValue, { color: colors.foreground }]}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Preferences ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
          <View style={[s.prefCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { icon: Bell, title: "Appointment reminders", subtitle: "1 hour before each visit", defaultOn: true },
              { icon: Heart, title: "Health insights", subtitle: "Weekly digest of your trends", defaultOn: false },
              { icon: Shield, title: "Two-factor auth", subtitle: "Required for sharing reports", defaultOn: true },
            ].map((item, i) => (
              <View
                key={item.title}
                style={[
                  i < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <PreferenceRow {...item} colors={colors} />
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(280)}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Account</Text>
          <View style={[s.prefCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { icon: Shield, label: "Privacy settings", onPress: () => router.push("/settings/privacy") },
              { icon: Phone, label: "Contact support", onPress: () => router.push("/settings/support") },
              { icon: Scale, label: "Terms & Conditions", onPress: () => router.push("/settings/terms") },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={[i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <MenuRow {...item} colors={colors} />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(340)}>
          <View style={[s.prefCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow
              icon={LogOut}
              label="Sign out"
              colors={colors}
              destructive
              onPress={() => router.replace("/login")}
            />
          </View>
        </Animated.View>

        <Text style={[s.version, { color: colors.inkMuted }]}>Medora v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },

  heroCard: {
    borderRadius: 24,
    padding: 22,
    gap: 18,
    marginTop: 12,
    shadowColor: "#1E3A32",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroName: { fontSize: 22, fontFamily: "Fraunces_500Medium", letterSpacing: -0.6, lineHeight: 28 },
  heroEmailRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  heroEmail: { fontSize: 12, fontFamily: "DMSans_400Regular", opacity: 0.65 },
  heroMember: { fontSize: 11, fontFamily: "DMSans_400Regular", opacity: 0.5, marginTop: 4 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editText: { fontSize: 13, fontFamily: "DMSans_500Medium", opacity: 0.85 },

  statRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
    gap: 5,
  },
  statValue: { fontSize: 22, fontFamily: "Fraunces_400Regular", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontFamily: "DMSans_500Medium", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },

  sectionTitle: {
    fontSize: 17,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.3,
    marginBottom: 10,
  },

  infoCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 0.8, textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontFamily: "DMSans_500Medium", marginTop: 2 },

  prefCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  prefRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  prefIcon: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  prefText: { flex: 1 },
  prefTitle: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  prefSub: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 2 },

  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: "DMSans_500Medium" },

  version: { fontSize: 11, fontFamily: "DMSans_400Regular", textAlign: "center", marginTop: 4 },
});
