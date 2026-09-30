export type ActivityTemplate = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  category: string;
  defaultDuration: number;
  notes: string | null;
  archived: boolean;
};

export type ScheduledTask = {
  id: number;
  templateId: number | null;
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

export const DAY_START_MINUTES = 0;
export const DAY_END_MINUTES = 24 * 60;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 36; // px per half hour row
