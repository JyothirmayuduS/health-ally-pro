/**
 * Book a Consultation — Specialist discovery & filtering
 * Visual hierarchy: Search bar dominant → Specialty chips → Doctor cards
 */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Search, Star, MapPin, Clock, SlidersHorizontal, MessageCircle, Phone, Video } from "lucide-react-native";
import { doctors } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

const specialties = [
  "All",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Orthopedics",
  "General Physician",
  "Endocrinology",
];

import { ScrollView } from "react-native";

export default function BookScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q);
      const matchS = specialty === "All" || d.specialty === specialty;
      return matchQ && matchS;
    });
  }, [query, specialty]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.header}>
            {/* Page title */}
            <Animated.View entering={FadeInDown.duration(500)} style={s.titleBlock}>
              <Text style={[s.eyebrow, { color: colors.clay }]}>SPECIALISTS</Text>
              <Text style={[s.heading, { color: colors.foreground }]}>
                Find a{" "}
                <Text style={{ color: colors.clay, fontStyle: "italic" }}>doctor</Text>
              </Text>
              <Text style={[s.subHeading, { color: colors.inkMuted }]}>
                Book with 80+ board-certified physicians near you.
              </Text>
            </Animated.View>

            {/* Search bar */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(80)}
              style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Search size={18} color={colors.inkMuted} strokeWidth={1.75} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Name, specialty or hospital…"
                placeholderTextColor={colors.inkMuted}
                style={[s.searchInput, { color: colors.foreground }]}
              />
              <Pressable style={[s.filterBtn, { backgroundColor: colors.ink }]}>
                <SlidersHorizontal size={15} color={colors.primaryForeground} strokeWidth={1.75} />
              </Pressable>
            </Animated.View>

            {/* Specialty chips */}
            <Animated.View entering={FadeInDown.duration(400).delay(140)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chips}
              >
                {specialties.map((sp) => (
                  <Pressable
                    key={sp}
                    onPress={() => setSpecialty(sp)}
                    style={[
                      s.chip,
                      {
                        backgroundColor: specialty === sp ? colors.ink : colors.surface,
                        borderColor: specialty === sp ? colors.ink : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: specialty === sp ? colors.primaryForeground : colors.inkMuted },
                      ]}
                    >
                      {sp}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Result count */}
            <Text style={[s.resultCount, { color: colors.inkMuted }]}>
              {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} available
            </Text>
          </View>
        }
        renderItem={({ item: d, index }) => (
          <Animated.View entering={FadeInDown.duration(400).delay(index * 60)} style={s.cardWrap}>
            <Pressable 
              onPress={() => router.push(`/book/${d.id}`)}
              style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {/* Top row */}
              <View style={s.cardTop}>
                <Avatar initials={d.initials} size="lg" />
                <View style={s.cardInfo}>
                  <Text style={[s.docName, { color: colors.foreground }]}>{d.name}</Text>
                  <Text style={[s.docSpec, { color: colors.inkMuted }]}>{d.specialty}</Text>
                  <View style={s.ratingRow}>
                    <Star size={12} color={colors.clay} fill={colors.clay} />
                    <Text style={[s.rating, { color: colors.foreground }]}>{d.rating}</Text>
                    <Text style={[s.reviews, { color: colors.inkMuted }]}>({d.reviews})</Text>
                    <View style={[s.expBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[s.expText, { color: colors.inkMuted }]}>{d.experience}y exp</Text>
                    </View>
                  </View>
                </View>
                <View style={[s.feeBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.feeText, { color: colors.foreground }]}>${d.fee}</Text>
                </View>
              </View>

              {/* Bio */}
              <Text style={[s.bio, { color: colors.inkMuted }]} numberOfLines={2}>
                {d.bio}
              </Text>

              {/* Meta */}
              <View style={[s.metaRow, { borderTopColor: colors.border }]}>
                <View style={s.metaItem}>
                  <MapPin size={12} color={colors.inkMuted} strokeWidth={1.75} />
                  <Text style={[s.metaText, { color: colors.inkMuted }]}>{d.hospital}</Text>
                </View>
                <View style={s.metaItem}>
                  <Clock size={12} color={colors.inkMuted} strokeWidth={1.75} />
                  <Text style={[s.metaText, { color: colors.inkMuted }]}>{d.nextSlot}</Text>
                </View>
              </View>

              {/* CTA */}
              <View style={[s.ctaRow, { borderTopColor: colors.border }]}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable style={[s.iconBtn, { backgroundColor: colors.clay + "1A" }]} onPress={() => {}}>
                    <MessageCircle size={16} color={colors.clay} />
                  </Pressable>
                  <Pressable style={[s.iconBtn, { backgroundColor: colors.clay + "1A" }]} onPress={() => {}}>
                    <Phone size={16} color={colors.clay} />
                  </Pressable>
                  <Pressable style={[s.iconBtn, { backgroundColor: colors.clay + "1A" }]} onPress={() => {}}>
                    <Video size={16} color={colors.clay} />
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => router.push(`/book/${d.id}`)}
                  style={[s.bookBtn, { backgroundColor: colors.ink }]}
                >
                  <Text style={[s.bookBtnText, { color: colors.primaryForeground }]}>Book Slot</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: colors.inkMuted }]}>
              No doctors match your search.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { gap: 18, marginTop: 12, marginBottom: 12 },

  titleBlock: { gap: 6 },
  eyebrow: { fontSize: 11, fontFamily: "DMSans_500Medium", letterSpacing: 2.5 },
  heading: { fontSize: 38, fontFamily: "Fraunces_400Regular", letterSpacing: -1.2, lineHeight: 44 },
  subHeading: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 21 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    padding: 0,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontFamily: "DMSans_500Medium" },

  resultCount: { fontSize: 12, fontFamily: "DMSans_400Regular" },

  cardWrap: { marginBottom: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },

  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  cardInfo: { flex: 1, gap: 3 },
  docName: { fontSize: 17, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.3 },
  docSpec: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { fontSize: 12, fontFamily: "DMSans_600SemiBold" },
  reviews: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  expBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  expText: { fontSize: 10, fontFamily: "DMSans_500Medium" },
  feeBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  feeText: { fontSize: 15, fontFamily: "Fraunces_500Medium" },

  bio: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 },

  metaRow: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontFamily: "DMSans_400Regular" },

  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  slotLabel: { fontSize: 9, fontFamily: "DMSans_500Medium", letterSpacing: 1.5, textTransform: "uppercase" },
  slotValue: { fontSize: 14, fontFamily: "DMSans_600SemiBold", marginTop: 2 },
  bookBtn: { borderRadius: 14, paddingHorizontal: 22, paddingVertical: 11 },
  bookBtnText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  empty: { paddingVertical: 64, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "DMSans_400Regular" },
});
