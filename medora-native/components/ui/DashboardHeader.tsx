import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Bell, Settings, ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface DashboardHeaderProps {
  name: string;
  initials: string;
  notificationCount?: number;
  greeting?: string;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  onAvatarPress?: () => void;
  secureMode?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Minimal, perfectly-aligned action pill button */
function ActionButton({
  onPress,
  hasUnread,
  children,
}: {
  onPress?: () => void;
  hasUnread?: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 12, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      style={{ position: "relative" }}
    >
      <Animated.View style={[styles.actionBtn, pressStyle]}>
        {children}
      </Animated.View>
      {hasUnread && (
        <View style={styles.unreadDot} />
      )}
    </Pressable>
  );
}

export function DashboardHeader({
  name,
  initials,
  notificationCount = 0,
  greeting,
  onNotificationPress,
  onSettingsPress,
  onAvatarPress,
  secureMode = false,
}: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();

  // Bell: gentle shake every 5s
  const bellRotate = useSharedValue(0);
  useEffect(() => {
    const shake = () => {
      bellRotate.value = withSequence(
        withTiming(-10, { duration: 70 }),
        withTiming(10, { duration: 70 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    };
    const id = setInterval(shake, 5000);
    return () => clearInterval(id);
  }, []);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotate.value}deg` }],
  }));

  const displayGreeting = greeting ?? getGreeting();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify().damping(18)}
      style={[
        styles.container,
        {
          // Subtle frosted-glass bottom separator
          borderBottomColor: isDark
            ? "rgba(255,255,255,0.07)"
            : "rgba(30,58,50,0.07)",
        },
      ]}
    >
      {/* ── LEFT: Avatar + Text ─────────────────────────────── */}
      <Pressable
        onPress={onAvatarPress}
        style={styles.left}
        hitSlop={8}
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {/* Avatar circle */}
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.claySoft },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: colors.ink }]}>
              {initials}
            </Text>
          </View>
          {/* Online status dot */}
          <View
            style={[
              styles.onlineDot,
              { borderColor: colors.background },
            ]}
          />
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text
            style={[styles.greetingText, { color: colors.inkMuted }]}
            numberOfLines={1}
          >
            {displayGreeting}!
          </Text>
          <Text
            style={[styles.nameText, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
      </Pressable>

      {/* ── RIGHT: Action Buttons ────────────────────────────── */}
      <View style={styles.right}>
        {/* Bell */}
        <ActionButton
          onPress={onNotificationPress}
          hasUnread={notificationCount > 0}
        >
          <Animated.View style={bellStyle}>
            <Bell
              size={20}
              color={colors.ink}
              strokeWidth={1.75}
            />
          </Animated.View>
        </ActionButton>

        {/* Settings */}
        <ActionButton onPress={onSettingsPress}>
          <Settings
            size={20}
            color={colors.ink}
            strokeWidth={1.75}
          />
        </ActionButton>
      </View>
    </Animated.View>
  );
}

const AVATAR_SIZE = 46;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // ── Left ───────────────────────────────────────────────────
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },

  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: "relative",
  },

  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitials: {
    fontSize: 17,
    fontFamily: "Fraunces_400Regular",
    letterSpacing: 0.3,
  },

  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF7D",
    borderWidth: 2,
  },

  textBlock: {
    flexShrink: 1,
    gap: 1,
  },

  greetingText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    letterSpacing: 0.1,
    lineHeight: 18,
  },

  nameText: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: -0.4,
    lineHeight: 24,
  },

  // ── Right ──────────────────────────────────────────────────
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    // iOS shadow
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    // Android
    elevation: 3,
  },

  unreadDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#E55B46",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(76, 175, 125, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
  },
  secureText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.5,
  },
});
