import React from "react";
import { Pressable, Text } from "react-native";

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        active
          ? "border-ink bg-ink"
          : "border-border bg-surface"
      }`}
    >
      <Text
        className={`text-xs font-sans-medium uppercase tracking-widest ${
          active ? "text-primary-foreground" : "text-ink-muted"
        }`}
        style={{ letterSpacing: 2.5 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
