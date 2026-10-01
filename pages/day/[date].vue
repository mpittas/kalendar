<script setup lang="ts">
import { computed } from "vue";
import { isValidISODate, todayISO } from "~/lib/time";
import { api } from "~/lib/api";
import type { ActivityTemplate, ScheduledTask, ChecklistItem, DayChecklist } from "~/lib/types";

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

const failed = computed(() => Boolean(tasksError.value || templatesError.value));
const retry = () => {
  refreshTasks();
  refreshTemplates();
  refreshChecklistItems();
  refreshDayChecklist();
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
  />
  <div v-else-if="failed" class="mx-auto mt-16 max-w-sm px-4 text-center">
    <p class="text-sm font-medium text-slate-900">We couldn't load this day.</p>
    <p class="mt-1 text-xs text-slate-500">Check your connection and try again.</p>
    <button
      type="button"
      class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
      @click="retry"
    >
      Try again
    </button>
  </div>
  <div v-else class="mx-auto mt-10 w-full max-w-5xl space-y-3 px-4" aria-busy="true">
    <div class="h-10 animate-pulse rounded-xl bg-slate-200" />
    <div class="h-96 animate-pulse rounded-xl bg-slate-200" />
  </div>
</template>
