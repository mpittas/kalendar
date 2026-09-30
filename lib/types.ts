export type ActivityTemplate = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
  defaultDuration: number;
  notes: string | null;
  archived: boolean;
};

export type ScheduledTask = {
  id: string;
  templateId: string | null;
  title: string;
  emoji: string;
  color: string;
  category: string;
  day: string;
  startMinutes: number;
  durationMinutes: number;
  notes: string | null;
  completed: boolean;
};

export type ChecklistItem = {
  id: string;
  title: string;
  emoji: string;
  order: number;
  archived: boolean;
};

export type DayChecklist = {
  day: string;
  completedItemIds: string[];
};

export const DAY_START_MINUTES = 0;
export const DAY_END_MINUTES = 24 * 60;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 42; // px per half hour row

