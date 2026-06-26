import React from "react";
import { View, Text } from "react-native";

interface EyebrowProps {
  children: string;
  color?: string;
  className?: string;
}

export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <Text
      className={`text-[11px] font-sans-medium text-ink-muted uppercase ${className}`}
      style={{ letterSpacing: 2.5 }}
    >
      {children}
    </Text>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View>
      <Eyebrow>{label}</Eyebrow>
      <View className="mt-1.5">
        {typeof value === "string" ? (
          <Text className="text-sm font-sans text-ink">{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}
