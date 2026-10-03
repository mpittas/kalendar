<script setup lang="ts">
import { computed } from "vue";
import {
  isValidISODate,
  todayISO,
  type ActivityTemplate,
  type ScheduledTask,
  type ChecklistItem,
  type DayChecklist,
  type DayNotes,
} from "@klndr/core";
import { api } from "~/lib/api";

const route = useRoute();
const rawDate = computed(() => route.params.date as string);
const day = computed(() => (isValidISODate(rawDate.value) ? rawDate.value : todayISO()));

// Client-only: API calls need the signed-in user's token, which SSR doesn't have.
// Not awaited, so navigation isn't blocked and requests run in parallel.
const {
  data: tasks,
  error: tasksError,
  refresh: refreshTasks,
} = useAsyncData<ScheduledTask[]>(() => `day-tasks:${day.value}`, () => api.getTasksForDay(day.value), {
  server: false,
  lazy: true,
});

const {
  data: templates,
  error: templatesError,
  refresh: refreshTemplates,
} = useAsyncData<ActivityTemplate[]>("templates", () => api.getTemplates(), {
  server: false,
  lazy: true,
});

const {
  data: checklistItems,
  refresh: refreshChecklistItems,
} = useAsyncData<ChecklistItem[]>("checklist-items", () => api.getChecklistItems(), {
  server: false,
  lazy: true,
});

const {
  data: dayChecklist,
  refresh: refreshDayChecklist,
} = useAsyncData<DayChecklist>(() => `day-checklist:${day.value}`, () => api.getDayChecklist(day.value), {
  server: false,
  lazy: true,
});

const {
  data: dayNotes,
  error: notesError,
  refresh: refreshDayNotes,
} = useAsyncData<DayNotes>(() => `day-notes:${day.value}`, () => api.getDayNotes(day.value), {
  server: false,
  lazy: true,
});

const notesText = computed(() => (dayNotes.value?.day === day.value ? dayNotes.value.text : ""));
const notesState = computed<"loading" | "ready" | "error">(() =>
  dayNotes.value?.day === day.value ? "ready" : notesError.value ? "error" : "loading",
);

const failed = computed(() => Boolean(tasksError.value || templatesError.value));
const retry = () => {
  refreshTasks();
  refreshTemplates();
  refreshChecklistItems();
  refreshDayChecklist();
  refreshDayNotes();
};

useHead({
  title: computed(() => `Plan · ${day.value}`),
});
</script>

<template>
  <DayPlanner
    v-if="tasks && templates"
    :day="day"
    :initial-tasks="tasks"
    :initial-templates="templates"
    :initial-checklist-items="checklistItems ?? []"
    :initial-day-checklist="dayChecklist ?? { day, completedItemIds: [], hiddenItemIds: [], extraItems: [] }"
    :initial-notes-text="notesText"
    :notes-state="notesState"
    @retry-notes="refreshDayNotes"
  />
  <div v-else-if="failed" class="mx-auto mt-16 max-w-sm px-4 text-center">
    <p class="text-sm font-medium text-foreground">We couldn't load this day.</p>
    <p class="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
    <button
      type="button"
      class="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
      @click="retry"
    >
      Try again
    </button>
  </div>
  <div v-else class="mx-auto mt-10 w-full max-w-5xl space-y-3 px-4" aria-busy="true">
    <div class="h-10 animate-pulse rounded-xl bg-muted" />
    <div class="h-96 animate-pulse rounded-xl bg-muted" />
  </div>
</template>
