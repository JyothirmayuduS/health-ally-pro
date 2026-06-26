import React from "react";
import { Pressable, Text, type PressableProps, ActivityIndicator } from "react-native";

interface ButtonProps extends PressableProps {
  variant?: "primary" | "secondary" | "clay" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<string, { container: string; text: string }> = {
  primary: {
    container: "bg-ink",
    text: "text-primary-foreground",
  },
  secondary: {
    container: "bg-surface border border-border",
    text: "text-ink",
  },
  clay: {
    container: "bg-clay",
    text: "text-accent-foreground",
  },
  destructive: {
    container: "bg-destructive",
    text: "text-destructive-foreground",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-ink",
  },
};

const sizeClasses: Record<string, { container: string; text: string }> = {
  sm: { container: "px-4 py-2", text: "text-xs" },
  md: { container: "px-5 py-2.5", text: "text-sm" },
  lg: { container: "px-6 py-3", text: "text-sm" },
};

export function Button({
  variant = "primary",
  size = "md",
  label,
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const v = variantClasses[variant];
  const s = sizeClasses[size];

  return (
    <Pressable
      className={`${v.container} ${s.container} rounded-full flex-row items-center justify-center gap-2 ${fullWidth ? "w-full" : ""} ${disabled ? "opacity-40" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? "#FCFAF8" : "#1E3A32"} />
      ) : (
        <>
          {icon}
          <Text className={`${v.text} ${s.text} font-sans-medium`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
