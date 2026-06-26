import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CalendarDays, Clock4, Video, CheckCircle2 } from "lucide-react-native";
import { format } from "date-fns";
import { useTheme } from "@/theme/ThemeProvider";
import { doctors } from "@/lib/mock-data";

export function AppointmentStack({ appointments }: { appointments: any[] }) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset index if the date changes and we get a new appointments list
  useEffect(() => {
    setActiveIndex(0);
  }, [appointments]);

  if (appointments.length === 0) {
    return (
      <Card className="p-6 items-center justify-center py-10 border-dashed border-2 border-border bg-transparent shadow-none">
        <CalendarDays size={32} color={colors.inkMuted} strokeWidth={1} />
        <Text className="mt-3 text-ink-muted font-sans pb-1">No appointments on this date.</Text>
      </Card>
    );
  }

  if (activeIndex >= appointments.length) {
    return (
      <Card className="p-6 items-center justify-center py-10 bg-surface shadow-none border border-border">
        <CheckCircle2 size={32} color={colors.clay} strokeWidth={1} />
        <Text className="mt-3 text-ink font-sans pb-1">You are all caught up for today!</Text>
      </Card>
    );
  }

  // Calculate the remaining pile
  const visibleCards = appointments.slice(activeIndex, activeIndex + 3).reverse();

  return (
    <View style={{ position: "relative", minHeight: 280 }}>
      {visibleCards.map((appt, i) => {
        // Since we reversed, index 0 in `visibleCards` is actually the bottom-most card in the rendered stack.
        // The top card is at index `visibleCards.length - 1`.
        const isTopCard = i === visibleCards.length - 1;
        const stackDepth = visibleCards.length - 1 - i; // 0 for top, 1 for middle, 2 for back
        
        return (
          <SwipeableCard
            key={appt.id}
            appt={appt}
            isTop={isTopCard}
            depth={stackDepth}
            colors={colors}
            onSwipeComplete={() => setActiveIndex((prev) => prev + 1)}
          />
        );
      })}
    </View>
  );
}

function SwipeableCard({ appt, isTop, depth, colors, onSwipeComplete }: any) {
  const doc = doctors.find((d) => d.id === appt.doctorId);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(isTop) // Only allow swiping the top card
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.2; // slight vertical movement allowed
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 120 || Math.abs(event.velocityX) > 800) {
        // Swipe dismissed
        translateX.value = withSpring(Math.sign(event.translationX) * 500, { velocity: event.velocityX });
        runOnJS(onSwipeComplete)();
      } else {
        // Snap back exactly to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    // If it's the top card, follow the finger. 
    // If it's a backend card, stay still.
    const transX = isTop ? translateX.value : 0;
    const transY = isTop ? translateY.value : 0;

    // As you swipe the top card away, the backend cards should smoothly interpolate forward
    const swipeProgress = interpolate(
      Math.abs(translateX.value),
      [0, 150],
      [0, 1],
      Extrapolation.CLAMP
    );

    // Depth scales:
    // depth 0 (top): scale 1, top offset 16
    // depth 1: scale 0.95, top offset 8
    // depth 2: scale 0.9, top offset 0

    const currentDepth = Math.max(0, depth - swipeProgress);
    
    // Scale jumps from 1 -> 0.95 -> 0.9
    const scale = interpolate(currentDepth, [0, 1, 2], [1, 0.95, 0.9], Extrapolation.CLAMP);
    
    // Y offset pushes it downwards visually so they peak from the top
    const translateYOffset = interpolate(currentDepth, [0, 1, 2], [16, 8, 0], Extrapolation.CLAMP);
    
    // Opacity fades out heavily for deeper cards
    const opacity = interpolate(currentDepth, [0, 1, 2], [1, 0.6, 0.2], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: transX },
        { translateY: transY + translateYOffset },
        { scale },
      ],
      opacity,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10 - depth, // Top card has highest exactly
    };
  });

  if (!doc) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <Card variant="dark" className="p-0 overflow-hidden border-0 shadow-xl" style={{ shadowColor: colors.ink }}>
          <View className="p-6 pb-5">
            {/* Top Row: Avatar & Video Icon */}
            <View className="flex-row justify-between items-start">
              <View className="flex-row items-center gap-4 flex-1">
                <Avatar initials={doc.initials} size="lg" />
                <View className="flex-1 pr-2">
                  <Text className="font-sans-medium text-lg text-primary-foreground" style={{ letterSpacing: -0.3 }}>
                    {doc.name}
                  </Text>
                  <Text className="text-sm text-primary-foreground opacity-70 font-sans mt-0.5">
                    {doc.specialty}
                  </Text>
                </View>
              </View>
              <Pressable className="h-12 w-12 rounded-full bg-primary-foreground items-center justify-center shadow-sm">
                <Video size={20} color={colors.clay} strokeWidth={1.5} opacity={0.6}/>
              </Pressable>
            </View>

            {/* Middle Row: Date & Time */}
            <View className="flex-row gap-3 mt-6">
              <View className="flex-1 bg-[rgba(255,255,255,0.06)] rounded-xl p-3 flex-row items-center gap-3">
                <CalendarDays size={16} color={colors.inkMuted} opacity={0.4} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                <View className="flex-1">
                  <Text className="text-[10px] text-primary-foreground opacity-60 font-sans tracking-wide uppercase">Date</Text>
                  <Text className="text-[13px] font-sans-medium text-primary-foreground pt-0.5" numberOfLines={1}>
                    {format(new Date(appt.date), "dd MMM, EEE")}
                  </Text>
                </View>
              </View>
              <View className="flex-1 bg-[rgba(255,255,255,0.06)] rounded-xl p-3 flex-row items-center gap-3">
                <Clock4 size={16} color={colors.inkMuted} opacity={0.4} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                <View className="flex-1">
                  <Text className="text-[10px] text-primary-foreground opacity-60 font-sans tracking-wide uppercase">Time</Text>
                  <Text className="text-[13px] font-sans-medium text-primary-foreground pt-0.5" numberOfLines={1}>
                    {appt.time}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Row: Actions */}
            <View className="mt-5 flex-row gap-3">
              <Pressable className="flex-1 rounded-full bg-primary-foreground py-3.5 items-center">
                <Text className="text-[13px] font-sans-medium text-ink">Re-schedule</Text>
              </Pressable>
              <Pressable className="flex-1 rounded-full bg-[rgba(255,255,255,0.15)] py-3.5 items-center">
                <Text className="text-[13px] font-sans-medium text-primary-foreground">View profile</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </Animated.View>
    </GestureDetector>
  );
}
