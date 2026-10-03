import { DateTimePicker as NativeDateTimePicker } from "@expo/ui/community/datetime-picker";
import { View } from "react-native";

import { useThemeColors, useThemeScheme } from "@/theme/tokens";
import { Text } from "./text";

export type DateTimePickerProps = {
  /** The picker's label, and its accessible name. */
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  minimumDate?: Date;
  maximumDate?: Date;
  /** Android presents a dialog: the caller mounts the picker to show it and unmounts on dismiss. */
  onDismiss?: () => void;
  /** `inline` (iOS) keeps the calendar in the view; `spinner` is the wheel. */
  display?: "default" | "spinner" | "compact" | "inline";
  className?: string;
};

/**
 * A date or time, using the platform's picker — the iOS wheel and calendar, the Material dialog — with
 * the app's accent colour and the current scheme handed to it, so it does not arrive in the system's
 * default blue on a dark screen.
 */
export function DateTimePicker({
  label,
  value,
  onChange,
  mode = "time",
  minimumDate,
  maximumDate,
  onDismiss,
  display = "inline",
  className,
}: DateTimePickerProps) {
  const colors = useThemeColors();
  const scheme = useThemeScheme();

  return (
    <View className={["gap-xs", className].filter(Boolean).join(" ")}>
      <Text tone="muted" variant="caption">
        {label}
      </Text>

      <NativeDateTimePicker
        accentColor={colors.ring}
        display={display}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        mode={mode}
        onDismiss={onDismiss}
        onValueChange={(_event, date) => onChange(date)}
        themeVariant={scheme}
        value={value}
      />
    </View>
  );
}
