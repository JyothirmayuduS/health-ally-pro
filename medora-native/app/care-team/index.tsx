import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Video,
  Phone,
  MoreVertical,
  ChevronRight,
  Filter,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { doctors, appointments, medications } from "../../lib/mock-data";
import { Avatar } from "../../components/ui/Avatar";
import { format } from "date-fns";
import { SearchInput } from "../../components/ui/SearchInput";

export default function CareTeamScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Care Team</Text>
        <Pressable style={styles.moreBtn}>
          <MoreVertical size={20} color={colors.inkMuted} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Expert partners in your thyroid journey.
          </Text>
          <Text style={[styles.heroSub, { color: colors.inkMuted }]}>
            Connect with your specialists for personalized guidance and care.
          </Text>
        </View>

        {/* Search & Filter Bar */}
        <View style={[styles.searchBarWrapper, { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <View style={styles.searchInner}>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or specialty..."
            />
            <Pressable style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Filter size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <View style={styles.listContainer}>
          {filteredDoctors.map((doc, idx) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push(`/doctor/${doc.id}`)}
              style={[
                styles.doctorCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Avatar initials={doc.initials} size="lg" />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{doc.name}</Text>
                  <Text style={[styles.specialty, { color: colors.clay }]}>{doc.specialty}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaText, { color: colors.inkMuted }]}>{doc.experience} Years Exp.</Text>
                    <View style={[styles.dot, { backgroundColor: colors.border }]} />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>★ {doc.rating}</Text>
                  </View>
                  
                  {/* 🏥 CLINICAL HISTORY SECTION */}
                  {appointments.filter(a => a.doctorId === doc.id && a.status === 'completed').length > 0 && (
                    <View style={styles.historyBox}>
                       <View style={styles.historyRow}>
                          <Text style={[styles.historyLabel, { color: colors.inkMuted }]}>Last Visit:</Text>
                          <Text style={[styles.historyVal, { color: colors.foreground }]}>
                             {format(new Date(appointments.filter(a => a.doctorId === doc.id && a.status === 'completed').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date), "MMM d, yyyy")}
                          </Text>
                       </View>
                       {medications.some(m => m.prescribedBy === doc.name) && (
                          <View style={styles.historyRow}>
                             <Text style={[styles.historyLabel, { color: colors.inkMuted }]}>Rx History:</Text>
                             <Text style={[styles.historyVal, { color: colors.clay, fontFamily: 'Outfit-Bold' }]}>
                                {medications.find(m => m.prescribedBy === doc.name)?.name}
                             </Text>
                          </View>
                       )}
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

              <View style={styles.cardActions}>
                <View style={styles.actionGroup}>
                  <Pressable 
                    onPress={(e) => { e.stopPropagation(); }}
                    style={[styles.actionIconBtn, { backgroundColor: "#4CAF50" + "10" }]}
                  >
                    <Phone size={16} color="#4CAF50" />
                  </Pressable>
                  <Pressable 
                    onPress={(e) => { e.stopPropagation(); }}
                    style={[styles.actionBtn, { backgroundColor: colors.ink + "10" }]}
                  >
                    <MessageCircle size={16} color={colors.ink} />
                    <Text style={[styles.actionBtnText, { color: colors.ink }]}>Chat</Text>
                  </Pressable>
                  <Pressable 
                    onPress={(e) => { e.stopPropagation(); router.push("/care-team/video-call"); }}
                    style={[styles.actionBtn, { backgroundColor: colors.clay + "10" }]}
                  >
                    <Video size={16} color={colors.clay} />
                    <Text style={[styles.actionBtnText, { color: colors.clay }]}>Video</Text>
                  </Pressable>
                </View>
                <ChevronRight size={20} color={colors.border} />
              </View>
            </Pressable>
          ))}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  moreBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-end" },
  content: { flex: 1 },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    lineHeight: 34,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 24,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  doctorCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  info: { flex: 1 },
  name: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 2,
  },
  specialty: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  cardDivider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.5,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionGroup: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  historyBox: {
    marginTop: 12,
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
  },
  historyVal: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
});
