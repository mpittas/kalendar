import { HOUR_OPTIONS, formatDuration, formatTime, fromTimeInput, timeInputValue } from "@klndr/core";
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, DateTimePicker, Picker, Text, formSheet } from "@/components/ui";

/**
 * The sheet pattern: Expo Router's form sheet, with detents, the system grabber and swipe-to-dismiss,
 * and the primary action in the footer where DESIGN.md asks for it.
 *
 * This route is the pattern's own demo (Phase 2 gives it real content: the task editor, the emoji
 * picker, the checklist). It also mounts the two native controls the app uses — a menu and a time
 * picker — because they are only real on a device.
 */
export default function SheetScreen() {
  const insets = useSafeAreaInsets();
  const [startMinutes, setStartMinutes] = useState(7 * 60);
  const [duration, setDuration] = useState(30);
  const [time, setTime] = useState(() => new Date());

  return (
    <>
      <Stack.Screen options={formSheet()} />

      <ScrollView contentContainerClassName="gap-md p-md" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <Text variant="title">A block</Text>
        <Text tone="muted">
          Presented as a form sheet. Drag the grabber down to dismiss, or pull it up for the full height.
        </Text>

        <Picker
          label="Starts at"
          onChange={setStartMinutes}
          options={HOUR_OPTIONS.map((minutes) => ({ label: timeInputValue(minutes), value: minutes }))}
          value={startMinutes}
        />

        <Picker
          label="Lasts"
          onChange={setDuration}
          options={[15, 30, 45, 60, 90, 120].map((minutes) => ({
            label: formatDuration(minutes),
            value: minutes,
          }))}
          value={duration}
        />

        <DateTimePicker label="Time" mode="time" onChange={setTime} value={time} />

        <View className="flex-row items-center justify-between">
          <Text numeric tone="muted" variant="caption">
            {formatTime(startMinutes)} · {formatDuration(duration)} · {formatTime(fromTimeInput(timeInputValue(startMinutes)) + duration)}
          </Text>
          <Button label="Save" onPress={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
