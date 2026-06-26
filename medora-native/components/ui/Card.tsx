import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "soft" | "dark" | "clay";
}

export function Card({ variant = "soft", className = "", style, ...props }: CardProps) {
  const base = "rounded-2xl border border-border";
  const variants: Record<string, string> = {
    soft: `${base} bg-surface`,
    default: `${base} bg-card`,
    dark: `${base} bg-ink border-ink`,
    clay: `${base} bg-clay-soft border-clay-soft`,
  };

  return (
    <View
      className={`${variants[variant]} ${className}`}
      style={[{ shadowColor: "#1E3A32", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }, style]}
      {...props}
    />
  );
}
