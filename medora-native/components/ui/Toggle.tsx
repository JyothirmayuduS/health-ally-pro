import React, { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface ToggleProps {
  defaultOn?: boolean;
  onToggle?: (value: boolean) => void;
}

export function Toggle({ defaultOn = true, onToggle }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  const translateX = useSharedValue(defaultOn ? 20 : 0);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = () => {
    const next = !on;
    setOn(next);
    translateX.value = withTiming(next ? 20 : 0, { duration: 200 });
    onToggle?.(next);
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        className={`h-6 w-11 rounded-full ${on ? "bg-ink" : "bg-border"}`}
        style={{ justifyContent: "center" }}
      >
        <Animated.View
          className="h-5 w-5 rounded-full bg-surface"
          style={[
            { marginLeft: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
            thumbStyle,
          ]}
        />
      </View>
    </Pressable>
  );
}
