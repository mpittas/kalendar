import {
  COLOR_KEYS,
  DURATION_CHOICES,
  SLOT_MINUTES,
  formatDuration,
  formatTime,
  mediumDate,
  nowMinutes,
  todayISO,
  type ColorKey,
} from "@klndr/core";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  Chip,
  ColorSwatch,
  EmptyState,
  IconButton,
  ListRow,
  Picker,
  SegmentedControl,
  Skeleton,
  Switch,
  Text,
  TextField,
  useToast,
} from "@/components/ui";
import { CalendarX, Plus, Trash } from "@/icons";
import { useThemePreference, type ThemePreference } from "@/theme/preference";
import { useThemeColors } from "@/theme/tokens";

/**
 * The design system, on screen.
 *
 * This is the temporary home screen: every primitive in one place, in whichever theme and text size
 * the device is set to, with the theme preference proving the MMKV round trip (change it, relaunch,
 * it is still there). Task 1.3 puts the auth gate in front of it and Phase 2 replaces it with the Day
 * tab.
 */

const THEME_OPTIONS = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const satisfies readonly { label: string; value: ThemePreference }[];

const DURATION_OPTIONS = DURATION_CHOICES.map((minutes) => ({
  label: formatDuration(minutes),
  value: minutes,
}));

export default function DesignSystemScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { preference, resolved, setPreference } = useThemePreference();
  const toast = useToast();

  const [title, setTitle] = useState("Morning run");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [duration, setDuration] = useState(30);
  const [reminders, setReminders] = useState(true);
  const [color, setColor] = useState<ColorKey>("indigo");
  const [blocks, setBlocks] = useState(4);

  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="gap-lg px-md"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }}
    >
      <View className="gap-xs">
        <Text numeric tone="muted" variant="caption">
          {mediumDate(todayISO())} · {formatTime(nowMinutes())}
        </Text>
        <Text variant="display">klndr</Text>
        <Text tone="muted">
          The design system, {SLOT_MINUTES}-minute slots and all. This screen stands in for the Day tab.
        </Text>
      </View>

      <Section title="Theme">
        <SegmentedControl label="Theme" onChange={setPreference} options={THEME_OPTIONS} value={preference} />
        <Text tone="muted" variant="caption">
          Showing the {resolved} theme, chosen from {preference}. The preference is stored on the device.
        </Text>
      </Section>

      <Section title="Type">
        <Text variant="display">Display</Text>
        <Text variant="title">Title</Text>
        <Text>Body — the default, 14 points with room to breathe.</Text>
        <Text variant="caption">Caption, for labels and helper text.</Text>
        <Text variant="micro">Micro, for the smallest chrome.</Text>
        <Text numeric variant="caption">
          Tabular numerals: 07:00 08:30 12:15
        </Text>
      </Section>

      <Section title="Buttons">
        <Button icon={<Plus color={colors["primary-foreground"]} size={18} />} label="New block" />
        <Button label="Secondary" variant="secondary" />
        <Button label="Ghost" variant="ghost" />
        <Button label="Delete" variant="destructive" />
        <Button label="Saving…" loading />
        <Button disabled label="Disabled" />
        <Button
          label={`Delete ${blocks} blocks`}
          onPress={() =>
            toast.show({
              actionLabel: "Undo",
              message: `${blocks} blocks deleted`,
              onAction: () => setBlocks((count) => count + 1),
            })
          }
          variant="secondary"
        />
      </Section>

      <Section title="Fields">
        <TextField
          error={titleError}
          helper="The name shown on the block and in the timeline."
          label="Title"
          onBlur={() => setTitleError(title.trim() ? undefined : "A block needs a title")}
          onChangeText={setTitle}
          placeholder="What is happening?"
          value={title}
        />
        <Picker
          label="Default length"
          onChange={setDuration}
          options={DURATION_OPTIONS}
          value={duration}
        />
        <Switch
          helper="Ask before a block starts (task 4.1)."
          label="Reminders"
          onValueChange={setReminders}
          value={reminders}
        />
      </Section>

      <Section title="Category">
        <View className="flex-row flex-wrap gap-xs">
          {COLOR_KEYS.map((key) => (
            <ColorSwatch color={key} key={key} onPress={() => setColor(key)} selected={color === key} />
          ))}
        </View>
        <View className="flex-row flex-wrap gap-xs">
          <Chip label="All" selected />
          <Chip label="Work" />
          <Chip label="Health" />
          <Chip label="+ New" />
        </View>
      </Section>
      <Section title="Lists">
        <View className="overflow-hidden rounded-md">
          <ListRow
            label="Morning run"
            onPress={() => toast.show({ message: "Blocks open the editor in Phase 2" })}
            value="07:00 – 07:30"
          />
          <ListRow description="12 activities, 5 categories" label="Library" onPress={() => {}} />
          <ListRow
            divider={false}
            label="Show completed"
            trailing={<Switch label="Show completed" onValueChange={setReminders} value={reminders} />}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text tone="muted" variant="caption">
            Icon buttons keep a 44-point target.
          </Text>
          <View className="flex-row gap-xs">
            <IconButton label="Delete block">
              <Trash color={colors.destructive} size={20} />
            </IconButton>
            <IconButton label="Add block" variant="secondary">
              <Plus color={colors.foreground} size={20} />
            </IconButton>
          </View>
        </View>
      </Section>

      <Section title="Loading and empty">
        <View className="gap-xs">
          <Skeleton height={20} width="60%" />
          <Skeleton height={14} />
          <Skeleton height={14} width="80%" />
        </View>
        <EmptyState
          action={<Button label="Open a sheet" onPress={() => router.push("/sheet")} variant="secondary" />}
          description="Nothing is planned for this day yet."
          icon={<CalendarX color={colors["muted-foreground"]} size={28} />}
          title="An empty day"
        />
      </Section>
    </ScrollView>
  );
}

/** A labelled block of the catalogue: the label is muted and quiet, never a decorative kicker. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-sm">
      <Text tone="muted" variant="caption">
        {title}
      </Text>
      {children}
    </View>
  );
}
