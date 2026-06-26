import React from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type AccessibilityRole,
} from "react-native";

type Props = PressableProps & {
  label: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityRole?: AccessibilityRole;
  checked?: boolean;
};

/** WCAG-friendly Pressable — explicit screen reader metadata on every interactive surface. */
export function AccessiblePressable({
  label,
  hint,
  children,
  accessibilityRole = "button",
  checked,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={checked !== undefined ? { checked } : undefined}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
