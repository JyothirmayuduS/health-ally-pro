import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Star, MapPin, ArrowRight } from "lucide-react-native";
import { doctors } from "@/lib/mock-data";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useTheme } from "@/theme/ThemeProvider";

export default function DoctorsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} className="gap-3 mt-4">
          <Eyebrow>Network</Eyebrow>
          <Text className="text-4xl font-serif text-foreground" style={{ letterSpacing: -0.5 }}>
            Our <Text className="italic text-clay">specialists</Text>
          </Text>
          <Text className="text-ink-muted font-sans text-base leading-relaxed">
            Every physician in the Medora network is board-certified and peer-reviewed.
          </Text>
        </Animated.View>

        {/* Doctor cards */}
        {doctors.map((d, i) => (
          <Animated.View key={d.id} entering={FadeInDown.duration(400).delay(i * 60)}>
            <Card className="p-5 gap-4">
              <View className="flex-row items-start gap-4">
                <Avatar initials={d.initials} size="lg" />
                <View className="flex-1">
                  <Text className="font-serif text-xl text-foreground" style={{ lineHeight: 24 }}>
                    {d.name}
                  </Text>
                  <Text className="mt-1 text-sm text-ink-muted font-sans">{d.specialty}</Text>
                </View>
                <View className="flex-row items-center gap-1 bg-surface-2 rounded-full px-2.5 py-1">
                  <Star size={12} color={colors.clay} fill={colors.clay} />
                  <Text className="text-xs font-sans-medium text-foreground">{d.rating}</Text>
                </View>
              </View>

              <Text className="text-sm text-ink-muted font-sans leading-relaxed">{d.bio}</Text>

              <View className="flex-row items-center justify-between border-t border-border pt-4">
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={14} color={colors.inkMuted} />
                  <Text className="text-xs text-ink-muted font-sans">{d.hospital}</Text>
                </View>
                <Pressable
                  onPress={() => router.push({ pathname: "/(tabs)/book/[doctorId]", params: { doctorId: d.id } })}
                  className="flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-sans-medium uppercase text-ink" style={{ letterSpacing: 2.5 }}>
                    Book
                  </Text>
                  <ArrowRight size={12} color={colors.ink} />
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
