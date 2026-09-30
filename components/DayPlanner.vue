<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { ActivityTemplate, ScheduledTask, ChecklistItem, DayChecklist } from "~/lib/types";
import { SLOT_HEIGHT, SLOT_MINUTES } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { api } from "~/lib/api";
import {
  addDaysISO,
  formatDuration,
  formatTime,
  gutterLabel,
  HOUR_OPTIONS,
  longDate,
  mediumDate,
  nowMinutes,
  parseISODate,
  snapMinutes,
  todayISO,
} from "~/lib/time";
import type { EditorRequest } from "~/components/TaskEditor.vue";

const props = defineProps<{
  day: string;
  initialTasks: ScheduledTask[];
  initialTemplates: ActivityTemplate[];
  initialChecklistItems?: ChecklistItem[];
  initialDayChecklist?: DayChecklist;
}>();

const tasks = ref<ScheduledTask[]>([...props.initialTasks]);
const templates = ref<ActivityTemplate[]>([...props.initialTemplates]);
const checklistItems = ref<ChecklistItem[]>([...(props.initialChecklistItems ?? [])]);
const completedChecklistIds = ref<string[]>([...(props.initialDayChecklist?.completedItemIds ?? [])]);
const activeSidebarTab = ref<"activities" | "checklist">("activities");
const mobileSheet = ref<"checklist" | "activities" | null>(null);
const editor = ref<EditorRequest | null>(null);
const managerOpen = ref(false);
const preview = ref<{ start: number; duration: number; color: string; label: string } | null>(null);
const resizing = ref<string | null>(null);
const flash = ref<string | null>(null);

const gridRef = ref<HTMLDivElement | null>(null);
const scrollRef = ref<HTMLDivElement | null>(null);

type DragSource =
  | { kind: "template"; template: ActivityTemplate }
  | { kind: "task"; task: ScheduledTask };

const dragSource = ref<DragSource | null>(null);
let resizedJustHappened = false;
let flashTimer: number | null = null;

const clock = ref(nowMinutes());
const today = computed(() => {
  clock.value; // re-evaluate after midnight as the clock ticks
  return todayISO();
});
const isToday = computed(() => props.day === today.value);
const nowMinute = computed(() => (isToday.value ? clock.value : null));
let clockTimer: number | null = null;
const GRID_HEIGHT = (24 * 60 / SLOT_MINUTES) * SLOT_HEIGHT;

watch(
  () => props.initialTasks,
  (val) => {
    tasks.value = [...val];
  },
  { deep: true },
);

watch(
  () => props.initialTemplates,
  (val) => {
    templates.value = [...val];
  },
  { deep: true },
);

watch(
  () => props.initialChecklistItems,
  (val) => {
    if (val) checklistItems.value = [...val];
  },
  { deep: true },
);

watch(
  () => props.initialDayChecklist,
  (val) => {
    if (val) completedChecklistIds.value = [...val.completedItemIds];
  },
  { deep: true },
);

const notify = (message: string) => {
  flash.value = message;
  if (flashTimer) window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => {
    flash.value = null;
  }, 2200);
};

const scrollToUsefulPosition = () => {
  const el = scrollRef.value;
  if (!el) return;
  const first = tasks.value.reduce<number | null>(
    (min, task) => (min === null ? task.startMinutes : Math.min(min, task.startMinutes)),
    null,
  );
  const target = first ?? 420;
  el.scrollTop = Math.max(0, (target / SLOT_MINUTES) * SLOT_HEIGHT - 96);
};

onMounted(() => {
  scrollToUsefulPosition();
  clockTimer = window.setInterval(() => {
    clock.value = nowMinutes();
  }, 30_000);
});

onUnmounted(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  if (flashTimer) window.clearTimeout(flashTimer);
});

watch(
  () => props.day,
  () => {
    scrollToUsefulPosition();
  },
);

const layout = computed(() => {
  const map = new Map<string, { left: number; width: number }>();
  const sorted = [...tasks.value].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes,
  );
  let cluster: ScheduledTask[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const columns: number[] = [];
    const placed: { task: ScheduledTask; column: number }[] = [];
    for (const task of cluster) {
      let column = columns.findIndex((end) => end <= task.startMinutes);
      if (column === -1) {
        column = columns.length;
        columns.push(0);
      }
      columns[column] = task.startMinutes + task.durationMinutes;
      placed.push({ task, column });
    }
    const total = columns.length;
    for (const item of placed) {
      map.set(item.task.id, {
        left: item.column / total,
        width: 1 / total,
      });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const task of sorted) {
    const end = task.startMinutes + task.durationMinutes;
    if (cluster.length && task.startMinutes >= clusterEnd) flush();
    cluster.push(task);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return map;
});

const stats = computed(() => {
  const scheduled = tasks.value.reduce((sum, task) => sum + task.durationMinutes, 0);
  const done = tasks.value.filter((task) => task.completed).length;
  const categories = new Map<string, number>();
  for (const task of tasks.value) {
    categories.set(task.category, (categories.get(task.category) ?? 0) + task.durationMinutes);
  }
  return {
    scheduled,
    done,
    count: tasks.value.length,
    categories: [...categories.entries()].sort((a, b) => b[1] - a[1]),
  };
});

const templateSearch = ref("");

const filteredTemplates = computed(() => {
  const query = templateSearch.value.trim().toLowerCase();
  if (!query) return templates.value;
  return templates.value.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query),
  );
});

const groupedTemplates = computed(() => {
  const map = new Map<string, ActivityTemplate[]>();
  for (const template of filteredTemplates.value) {
    const list = map.get(template.category) ?? [];
    list.push(template);
    map.set(template.category, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
});

const categoryColor = (catName: string): string => {
  const tpl = templates.value.find((t) => t.category.toLowerCase() === catName.toLowerCase());
  if (tpl) return tpl.color;
  const task = tasks.value.find((t) => t.category.toLowerCase() === catName.toLowerCase());
  return task?.color ?? "indigo";
};

function minutesFromEvent(grid: HTMLElement | null, clientY: number): number {
  if (!grid) return 540;
  const rect = grid.getBoundingClientRect();
  const offset = clientY - rect.top;
  return snapMinutes((offset / SLOT_HEIGHT) * SLOT_MINUTES, SLOT_MINUTES);
}

const updatePreview = (clientY: number) => {
  const source = dragSource.value;
  if (!source) return;
  const start = minutesFromEvent(gridRef.value, clientY);
  const duration =
    source.kind === "template"
      ? source.template.defaultDuration
      : source.task.durationMinutes;
  const color = source.kind === "template" ? source.template.color : source.task.color;
  const label =
    source.kind === "template" ? source.template.name : source.task.title;

  if (
    preview.value &&
    preview.value.start === start &&
    preview.value.duration === duration &&
    preview.value.label === label
  ) {
    return;
  }
  preview.value = { start, duration, color, label };
};

const autoScroll = (clientY: number) => {
  const el = scrollRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const edge = 64;
  if (clientY - rect.top < edge) el.scrollTop -= 14;
  else if (rect.bottom - clientY < edge) el.scrollTop += 14;
};

const handleDragOver = (event: DragEvent) => {
  if (!dragSource.value) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect =
      dragSource.value.kind === "template" ? "copy" : "move";
  }
  updatePreview(event.clientY);
  autoScroll(event.clientY);
};

const handleDrop = async (event: DragEvent) => {
  const source = dragSource.value;
  event.preventDefault();
  preview.value = null;
  dragSource.value = null;
  if (!source) return;
  const start = minutesFromEvent(gridRef.value, event.clientY);

  if (source.kind === "template") {
    const template = source.template;
    try {
      const created = await api.createTask({
        day: props.day,
        title: template.name,
        emoji: template.emoji,
        color: template.color,
        category: template.category,
        startMinutes: start,
        durationMinutes: template.defaultDuration,
        notes: template.notes,
        templateId: template.id,
      });
      tasks.value = [...tasks.value, created].sort((a, b) => a.startMinutes - b.startMinutes);
      notify(`${template.emoji} ${template.name} at ${formatTime(start)}`);
    } catch {
      notify("Could not add that block");
    }
    return;
  }

  const task = source.task;
  if (task.startMinutes === start) return;
  const previous = task.startMinutes;
  tasks.value = tasks.value.map((item) => (item.id === task.id ? { ...item, startMinutes: start } : item));
  try {
    await api.updateTask(task.id, { startMinutes: start });
    notify(`${task.title} → ${formatTime(start)}`);
  } catch {
    tasks.value = tasks.value.map((item) =>
      item.id === task.id ? { ...item, startMinutes: previous } : item,
    );
    notify("Could not move that block");
  }
};

const startResize = (task: ScheduledTask, event: PointerEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const startY = event.clientY;
  const startDuration = task.durationMinutes;
  resizedJustHappened = false;
  resizing.value = task.id;

  const onMove = (moveEvent: PointerEvent) => {
    resizedJustHappened = true;
    const delta = ((moveEvent.clientY - startY) / SLOT_HEIGHT) * SLOT_MINUTES;
    const next = Math.max(30, Math.min(24 * 60 - task.startMinutes, snapMinutes(startDuration + delta, 15)));
    tasks.value = tasks.value.map((item) =>
      item.id === task.id ? { ...item, durationMinutes: next } : item,
    );
  };

  const finish = async (moveEvent: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    resizing.value = null;
    const delta = ((moveEvent.clientY - startY) / SLOT_HEIGHT) * SLOT_MINUTES;
    const next = Math.max(30, Math.min(24 * 60 - task.startMinutes, snapMinutes(startDuration + delta, 15)));
    if (next === startDuration) {
      resizedJustHappened = false;
      return;
    }
    try {
      await api.updateTask(task.id, { durationMinutes: next });
    } catch {
      tasks.value = tasks.value.map((item) =>
        item.id === task.id ? { ...item, durationMinutes: startDuration } : item,
      );
    }
    window.setTimeout(() => {
      resizedJustHappened = false;
    }, 120);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", finish);
};

const toggleComplete = async (task: ScheduledTask) => {
  const next = !task.completed;
  tasks.value = tasks.value.map((item) => (item.id === task.id ? { ...item, completed: next } : item));
  try {
    await api.updateTask(task.id, { completed: next });
  } catch {
    tasks.value = tasks.value.map((item) => (item.id === task.id ? { ...item, completed: !next } : item));
  }
};

const deleteTask = async (id: string) => {
  const taskToDelete = tasks.value.find((item) => item.id === id);
  tasks.value = tasks.value.filter((item) => item.id !== id);
  try {
    await api.deleteTask(id);
    notify(taskToDelete ? `Removed ${taskToDelete.title}` : "Removed block");
  } catch {
    if (taskToDelete) {
      tasks.value = [...tasks.value, taskToDelete].sort((a, b) => a.startMinutes - b.startMinutes);
    }
    notify("Could not delete that block");
  }
};

const onTaskDeleted = (id: string) => {
  tasks.value = tasks.value.filter((item) => item.id !== id);
};

const onTemplateSaved = (template: ActivityTemplate) => {
  const exists = templates.value.some((item) => item.id === template.id);
  const next = exists
    ? templates.value.map((item) => (item.id === template.id ? template : item))
    : [...templates.value, template];
  templates.value = next.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
};

const onTaskSaved = (task: ScheduledTask) => {
  const exists = tasks.value.some((item) => item.id === task.id);
  if (exists && task.day !== props.day) {
    tasks.value = tasks.value.filter((item) => item.id !== task.id);
    return;
  }
  const next = exists
    ? tasks.value.map((item) => (item.id === task.id ? task : item))
    : [...tasks.value, task];
  tasks.value = next.sort((a, b) => a.startMinutes - b.startMinutes);
};

const refreshDay = async () => {
  try {
    tasks.value = await api.getTasksForDay(props.day);
    notify("Updated");
  } catch {
    notify("Could not refresh");
  }
};

const checklistStats = computed(() => {
  const total = checklistItems.value.length;
  const set = new Set(completedChecklistIds.value);
  const done = checklistItems.value.filter((item) => set.has(item.id)).length;
  return {
    total,
    done,
    percentage: total === 0 ? 0 : Math.round((done / total) * 100),
  };
});

const toggleChecklistItem = async (itemId: string, completed: boolean) => {
  if (completed) {
    if (!completedChecklistIds.value.includes(itemId)) {
      completedChecklistIds.value.push(itemId);
    }
  } else {
    completedChecklistIds.value = completedChecklistIds.value.filter((id) => id !== itemId);
  }

  try {
    const res = await api.toggleChecklistItem(props.day, itemId, completed);
    completedChecklistIds.value = res.completedItemIds;
  } catch {
    if (completed) {
      completedChecklistIds.value = completedChecklistIds.value.filter((id) => id !== itemId);
    } else {
      completedChecklistIds.value.push(itemId);
    }
    notify("Could not update checklist item");
  }
};

const onChecklistCreated = (item: ChecklistItem) => {
  checklistItems.value.push(item);
  notify(`Added "${item.title}"`);
};

const onChecklistUpdated = (item: ChecklistItem) => {
  const idx = checklistItems.value.findIndex((i) => i.id === item.id);
  if (idx !== -1) {
    checklistItems.value[idx] = item;
  }
  notify(`Updated "${item.title}"`);
};

const onChecklistDeleted = (id: string) => {
  checklistItems.value = checklistItems.value.filter((i) => i.id !== id);
  completedChecklistIds.value = completedChecklistIds.value.filter((itemId) => itemId !== id);
  notify("Removed checklist item");
};

const openActivityFromMobile = (template: ActivityTemplate) => {
  mobileSheet.value = null;
  editor.value = {
    mode: "create",
    day: props.day,
    startMinutes: snapMinutes(nowMinutes(), 30),
    template,
  };
};

const openChecklistManager = () => {
  activeSidebarTab.value = "checklist";
  mobileSheet.value = "checklist";
};

const toneOf = (color: string) => paletteOf(color);
</script>

<template>
  <div class="flex h-[calc(100dvh-56px)] flex-col bg-background lg:flex-row overflow-hidden">
    <!-- Desktop Activity palette and daily checklist sidebar (hidden on mobile, replaced by bottom bar and sheets) -->
    <aside class="hidden lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:border-r border-border bg-card">
      <!-- Tabs switcher (shadcn style) -->
      <div class="flex items-center justify-between gap-2 border-b border-border px-3 pb-2.5 pt-3 bg-card">
        <div class="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <button
            type="button"
            @click="activeSidebarTab = 'activities'"
            class="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer"
            :class="activeSidebarTab === 'activities' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'"
          >
            <span>Activities</span>
            <span class="rounded-full bg-muted-foreground/15 px-1.5 py-0.2 font-mono text-[10px]">
              {{ filteredTemplates.length }}
            </span>
          </button>

          <button
            type="button"
            @click="activeSidebarTab = 'checklist'"
            class="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer"
            :class="activeSidebarTab === 'checklist' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'"
          >
            <span>Checklist</span>
            <span
              class="rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold"
              :class="checklistStats.total > 0 && checklistStats.done === checklistStats.total
                ? 'bg-emerald-500/15 text-emerald-700'
                : 'bg-muted-foreground/15 text-foreground'"
            >
              {{ checklistStats.done }}/{{ checklistStats.total }}
            </span>
          </button>
        </div>
      </div>

      <!-- Checklist tab content -->
      <DailyChecklist
        v-if="activeSidebarTab === 'checklist'"
        :day="day"
        :items="checklistItems"
        :completed-ids="completedChecklistIds"
        @toggle="toggleChecklistItem"
        @created="onChecklistCreated"
        @updated="onChecklistUpdated"
        @deleted="onChecklistDeleted"
      />

      <!-- Activities tab content -->
      <template v-else>
        <div class="px-3.5 pb-2.5 pt-2">
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L18 18" stroke-linecap="round" />
            </svg>
            <input
              v-model="templateSearch"
              type="text"
              placeholder="Search activities…"
              class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto px-4 pb-3">
          <p v-if="groupedTemplates.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            No activities found
          </p>

          <div v-for="[category, items] in groupedTemplates" :key="category">
            <div class="mb-1.5 flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {{ category }}
              </p>
              <span class="text-xs font-mono text-muted-foreground">{{ items.length }}</span>
            </div>
            <ul class="space-y-1.5">
              <li
                v-for="template in items"
                :key="template.id"
                draggable="true"
                @dragstart="(event) => {
                  dragSource = { kind: 'template', template };
                  if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setData('application/x-dayforge-template', String(template.id));
                  }
                }"
                @dragend="() => {
                  dragSource = null;
                  preview = null;
                }"
                @click="editor = {
                  mode: 'create',
                  day,
                  startMinutes: snapMinutes(nowMinutes(), 30),
                  template,
                }"
                :title="`${template.name} · ${formatDuration(template.defaultDuration)}`"
                :class="[
                  'group relative flex cursor-grab items-center gap-2.5 rounded-lg border px-3 py-2 text-left shadow-2xs transition hover:shadow-xs active:cursor-grabbing',
                  toneOf(template.color).block
                ]"
              >
                <span
                  class="absolute inset-y-1.5 left-1 w-0.5 rounded-full"
                  :class="toneOf(template.color).accent"
                />
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 text-base leading-none shadow-2xs">
                  {{ template.emoji }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold leading-tight text-slate-900">
                    {{ template.name }}
                  </span>
                  <span class="block text-xs font-mono opacity-80 tabular-nums">
                    {{ formatDuration(template.defaultDuration) }}
                  </span>
                </span>
                <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 opacity-25 transition group-hover:opacity-75 text-foreground" fill="currentColor" aria-hidden="true">
                  <circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" />
                  <circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" />
                  <circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" />
                </svg>
              </li>
            </ul>
          </div>
        </div>
        <div class="border-t border-border p-3">
          <button
            type="button"
            @click="managerOpen = true"
            class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 4v12M4 10h12" stroke-linecap="round" />
            </svg>
            <span>Customize activities</span>
          </button>
        </div>
      </template>
    </aside>

    <!-- Timeline section -->
    <section class="flex min-h-0 flex-1 flex-col bg-background">
      <header class="border-b border-border bg-background px-3 py-2.5 sm:px-5 sm:py-3">
        <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div class="flex items-center gap-1.5 sm:gap-2">
            <NuxtLink
              :to="`/day/${addDaysISO(day, -1)}`"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground"
              aria-label="Previous day"
            >
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
            <NuxtLink
              v-if="!isToday"
              :to="`/day/${today}`"
              class="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground"
            >
              Today
            </NuxtLink>
            <NuxtLink
              :to="`/day/${addDaysISO(day, 1)}`"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground"
              aria-label="Next day"
            >
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
            <div class="ml-1">
              <h1 class="text-sm font-semibold text-foreground leading-tight sm:text-base tracking-tight">
                <span class="sm:hidden">{{ mediumDate(day) }}</span>
                <span class="hidden sm:inline">{{ longDate(day) }}</span>
              </h1>
              <p class="text-[11px] text-muted-foreground tabular-nums sm:text-xs">
                {{ formatDuration(stats.scheduled) }} planned · {{ stats.done }} of {{ stats.count }} completed
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2">
            <button
              v-if="checklistItems.length > 0"
              type="button"
              @click="activeSidebarTab = 'checklist'"
              class="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium shadow-xs transition cursor-pointer hover:bg-accent"
              :class="checklistStats.total > 0 && checklistStats.done === checklistStats.total
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'text-foreground'"
              title="Open Daily Checklist in sidebar"
            >
              <span class="text-emerald-600 font-bold">✓</span>
              <span>Checklist</span>
              <span class="text-muted-foreground">·</span>
              <span class="font-mono font-semibold">{{ checklistStats.done }}/{{ checklistStats.total }}</span>
            </button>

            <span
              v-for="[category, minutes] in stats.categories.slice(0, 3)"
              :key="category"
              class="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="toneOf(categoryColor(category)).dot" />
              <span>{{ category }}</span>
              <span class="opacity-50">·</span>
              <span class="font-mono text-foreground font-semibold">{{ formatDuration(minutes) }}</span>
            </span>
            <button
              type="button"
              @click="editor = {
                mode: 'create',
                day,
                startMinutes: snapMinutes(nowMinutes(), 30),
                template: null,
              }"
              class="inline-flex h-8 sm:h-9 items-center justify-center rounded-md bg-primary px-3 sm:px-4 text-xs sm:text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-95 cursor-pointer"
            >
              + <span class="hidden sm:inline">Time block</span><span class="sm:hidden">Block</span>
            </button>
          </div>
        </div>
        <p v-if="flash" role="status" aria-live="polite" class="mt-2 rounded-md border border-emerald-300/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
          {{ flash }}
        </p>
      </header>

      <!-- Interactive Quick Daily Checklist Bar -->
      <div
        class="border-b border-border bg-muted/25 px-3 py-2 sm:px-5 sm:py-2 transition"
      >
        <div class="mx-auto flex max-w-4xl items-center justify-between gap-2.5">
          <div class="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            <span>Routines</span>
            <span
              v-if="checklistItems.length > 0"
              class="rounded-full bg-muted-foreground/15 px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-foreground"
            >
              {{ checklistStats.done }}/{{ checklistStats.total }}
            </span>
          </div>

          <!-- Empty state when no items yet -->
          <div v-if="checklistItems.length === 0" class="flex flex-1 items-center justify-between gap-2">
            <span class="text-xs text-muted-foreground">Track daily micro-habits (pills, protein shake, shower, water)</span>
            <button
              type="button"
              @click="openChecklistManager"
              class="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 cursor-pointer"
            >
              + Add routine
            </button>
          </div>

          <!-- Horizontal habit chips -->
          <div v-else class="flex flex-1 items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              v-for="item in checklistItems"
              :key="item.id"
              type="button"
              @click="toggleChecklistItem(item.id, !completedChecklistIds.includes(item.id))"
              class="group inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-md border px-2 py-1 sm:px-2.5 sm:py-1 text-xs font-medium shadow-2xs transition cursor-pointer"
              :class="completedChecklistIds.includes(item.id)
                ? 'border-border/60 bg-muted/40 text-muted-foreground line-through'
                : 'border-border bg-card text-foreground hover:bg-accent hover:border-foreground/20'"
            >
              <span
                class="flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-xs border transition text-[9px]"
                :class="completedChecklistIds.includes(item.id)
                  ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                  : 'border-input bg-background group-hover:border-foreground/50 text-transparent'"
              >
                ✓
              </span>
              <span>{{ item.emoji }}</span>
              <span class="truncate max-w-[10rem] sm:max-w-[14rem]">{{ item.title }}</span>
            </button>

            <button
              type="button"
              @click="openChecklistManager"
              class="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-input bg-background px-2 py-1 sm:px-2.5 sm:py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              title="Add or customize daily habits"
            >
              <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 4v12M4 10h12" stroke-linecap="round" />
              </svg>
              <span>Manage</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref="scrollRef"
        class="relative min-h-0 flex-1 overflow-y-auto bg-background scroll-pt-6"
      >
        <div class="mx-auto flex max-w-4xl pt-4 pb-28 sm:pt-6 sm:pb-12">
          <!-- Hour gutter -->
          <div class="relative w-14 sm:w-16 shrink-0 select-none border-r border-border bg-background pr-1.5 sm:pr-2.5">
            <div
              v-for="minute in HOUR_OPTIONS"
              :key="minute"
              :style="{ height: `${SLOT_HEIGHT}px` }"
              class="relative"
            >
              <span
                v-if="gutterLabel(minute)"
                class="absolute -top-2.5 right-1.5 sm:right-2 text-[11px] sm:text-xs font-mono font-medium text-muted-foreground tracking-tight"
              >
                {{ gutterLabel(minute) }}
              </span>
            </div>

            <!-- Amie live time pill in gutter -->
            <div
              v-if="nowMinute !== null"
              class="pointer-events-none absolute right-0.5 sm:right-1 z-30 -translate-y-1/2 rounded-full bg-rose-500 px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-white shadow-xs"
              :style="{ top: `${(nowMinute / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
            >
              {{ formatTime(nowMinute) }}
            </div>
          </div>

          <!-- Drop grid -->
          <div
            ref="gridRef"
            @dragover="handleDragOver"
            @dragleave="(event) => {
              if (!gridRef?.contains(event.relatedTarget as Node | null)) {
                preview = null;
              }
            }"
            @drop="handleDrop"
            @click="(event) => {
              if (resizedJustHappened) return;
              editor = {
                mode: 'create',
                day,
                startMinutes: minutesFromEvent(gridRef, event.clientY),
                template: null,
              };
            }"
            :style="{ height: `${GRID_HEIGHT}px` }"
            class="relative flex-1 bg-background border-t border-border"
          >
            <div
              v-for="minute in HOUR_OPTIONS"
              :key="minute"
              :style="{ height: `${SLOT_HEIGHT}px` }"
              :class="[
                'border-b',
                (minute + 30) % 60 === 0 ? 'border-border/70' : 'border-dashed border-border/30'
              ]"
            />

            <!-- Amie Live Time Indicator Line -->
            <div
              v-if="nowMinute !== null"
              class="pointer-events-none absolute inset-x-0 z-20 flex items-center"
              :style="{ top: `${(nowMinute / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
            >
              <div class="relative flex items-center w-full">
                <span class="absolute -left-1 flex h-2 w-2 items-center justify-center">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60"></span>
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </span>
                <span class="h-[1.5px] w-full bg-rose-500/80"></span>
              </div>
            </div>

            <!-- Drag preview placeholder -->
            <div
              v-if="preview"
              :class="[
                'pointer-events-none absolute z-30 flex items-center justify-center rounded-lg border border-dashed shadow-2xs backdrop-blur-xs',
                toneOf(preview.color).ghost
              ]"
              :style="{
                top: `${(preview.start / SLOT_MINUTES) * SLOT_HEIGHT}px`,
                height: `${Math.max(
                  SLOT_HEIGHT,
                  ((Math.min(preview.start + preview.duration, 24 * 60) - preview.start) /
                    SLOT_MINUTES) *
                    SLOT_HEIGHT,
                )}px`,
                left: '2%',
                width: '96%',
              }"
            >
              <span class="rounded-full bg-background px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs border border-border">
                {{ preview.label }} · {{ formatTime(preview.start) }}
              </span>
            </div>

            <!-- Scheduled task blocks -->
            <div
              v-for="task in tasks"
              :key="task.id"
              :draggable="resizing !== task.id"
              role="button"
              tabindex="0"
              :aria-label="`${task.title}, ${formatTime(task.startMinutes)} to ${formatTime(task.startMinutes + task.durationMinutes)}. Press Enter to edit.`"
              @keydown.enter.self.prevent="editor = { mode: 'edit', day, startMinutes: task.startMinutes, task }"
              @dragstart="(event) => {
                dragSource = { kind: 'task', task };
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(task.id));
                }
              }"
              @dragend="() => {
                dragSource = null;
                preview = null;
              }"
              @click.stop="() => {
                if (resizedJustHappened) return;
                editor = {
                  mode: 'edit',
                  day,
                  startMinutes: task.startMinutes,
                  task,
                };
              }"
              :style="{
                top: `${(task.startMinutes / SLOT_MINUTES) * SLOT_HEIGHT + 2}px`,
                height: `${Math.max(
                  SLOT_HEIGHT - 4,
                  (task.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 4,
                )}px`,
                left: `${(layout.get(task.id)?.left ?? 0) * 100 + 1}%`,
                width: `${(layout.get(task.id)?.width ?? 1) * 100 - 2}%`,
              }"
              :class="[
                'group absolute z-10 flex cursor-grab flex-col overflow-hidden rounded-lg border px-2.5 py-1.5 shadow-2xs transition-shadow hover:z-20 hover:shadow-xs active:cursor-grabbing',
                task.completed ? toneOf(task.color).blockDone : toneOf(task.color).block
              ]"
            >
              <!-- Amie vertical accent line -->
              <span
                class="absolute inset-y-1.5 left-1 w-0.5 rounded-full transition-opacity"
                :class="[toneOf(task.color).accent, task.completed ? 'opacity-40' : 'opacity-100']"
              />

              <div class="flex items-start gap-2 pl-1.5">
                <button
                  type="button"
                  :aria-label="task.completed ? 'Mark as not done' : 'Mark as done'"
                  @click.stop="toggleComplete(task)"
                  :class="[
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors cursor-pointer',
                    task.completed
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                      : 'border-input bg-background text-transparent hover:border-foreground/60'
                  ]"
                >
                  <svg viewBox="0 0 16 16" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </button>
                <p
                  :class="[
                    'min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-foreground',
                    task.completed ? 'line-through text-muted-foreground font-normal' : ''
                  ]"
                >
                  {{ task.emoji }} {{ task.title }}
                </p>
                <button
                  v-if="resizing !== task.id"
                  type="button"
                  aria-label="Remove block"
                  title="Remove block"
                  @click.stop="deleteTask(task.id)"
                  @pointerdown.stop
                  @mousedown.stop
                  class="mt-0.5 flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-75 hover:opacity-100 focus-visible:opacity-100"
                >
                  <svg
                    viewBox="0 0 20 20"
                    class="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
                  </svg>
                </button>
              </div>

              <!-- Time display for non-compact tasks -->
              <p
                v-if="((task.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 4) >= SLOT_HEIGHT * 1.5"
                class="mt-0.5 pl-6 text-xs font-mono leading-4 opacity-85 tabular-nums font-medium text-foreground"
              >
                {{ formatTime(task.startMinutes) }} – {{ formatTime(task.startMinutes + task.durationMinutes) }}
                <span class="opacity-50">·</span>
                {{ formatDuration(task.durationMinutes) }}
              </p>

              <!-- Notes snippet for non-compact tasks -->
              <p
                v-if="((task.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 4) >= SLOT_HEIGHT * 2.2 && task.notes"
                class="mt-0.5 line-clamp-1 pl-6 text-xs leading-4 opacity-75 text-foreground"
              >
                {{ task.notes }}
              </p>

              <!-- Resize handle at bottom -->
              <div
                @pointerdown="(event) => startResize(task, event)"
                class="absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize items-center justify-center"
              >
                <span class="h-0.5 w-6 rounded-full bg-foreground/20 opacity-0 transition group-hover:opacity-100" />
              </div>

              <!-- Active resizing duration badge -->
              <span
                v-if="resizing === task.id"
                class="absolute right-1.5 top-1.5 rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground shadow-xs"
              >
                {{ formatDuration(task.durationMinutes) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer class="hidden lg:flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-2.5 text-xs text-muted-foreground">
        <span>
          Drag an activity into the grid · drag blocks to move · pull the bottom edge to
          resize · click a slot for details
        </span>
        <button
          type="button"
          @click="refreshDay"
          class="shrink-0 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs hover:bg-accent cursor-pointer"
        >
          Refresh
        </button>
      </footer>

      <!-- Mobile Bottom Navigation Bar (iOS / Android thumb friendly) -->
      <nav aria-label="Mobile navigation" class="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-4 py-2 backdrop-blur-md shadow-lg">
        <button
          type="button"
          @click="mobileSheet = 'activities'"
          class="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
            <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h12M4 10h12M4 14h8" stroke-linecap="round" />
            </svg>
          </div>
          <span class="text-[11px] font-medium">Activities</span>
        </button>

        <button
          type="button"
          @click="editor = {
            mode: 'create',
            day,
            startMinutes: snapMinutes(nowMinutes(), 30),
            template: null,
          }"
          class="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-95 hover:bg-primary/90 cursor-pointer"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M10 4v12M4 10h12" stroke-linecap="round" />
          </svg>
          <span>Schedule</span>
        </button>

        <button
          type="button"
          @click="mobileSheet = 'checklist'"
          class="relative flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
            <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="text-[11px] font-medium">Checklist</span>
          <span
            v-if="checklistStats.total > 0"
            class="absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs"
          >
            {{ checklistStats.done }}/{{ checklistStats.total }}
          </span>
        </button>
      </nav>
    </section>

    <!-- Modals -->
    <TaskEditor
      :request="editor"
      :templates="templates"
      @close="editor = null"
      @saved="onTaskSaved"
      @deleted="onTaskDeleted"
    />

    <TemplateManager
      :open="managerOpen"
      :templates="templates"
      @close="managerOpen = false"
      @saved="onTemplateSaved"
      @deleted="(id) => { templates = templates.filter((item) => item.id !== id) }"
    />

    <!-- Mobile Activities Bottom Sheet -->
    <Modal
      :open="mobileSheet === 'activities'"
      title="Add Activity"
      @close="mobileSheet = null"
    >
      <div class="space-y-4">
        <p class="text-xs text-muted-foreground">Tap an activity to schedule it on today's timeline.</p>
        <div class="relative">
          <input
            v-model="templateSearch"
            type="search"
            placeholder="Search activities..."
            class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <svg viewBox="0 0 20 20" class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 13l4 4" stroke-linecap="round" />
          </svg>
        </div>

        <div class="max-h-[50vh] overflow-y-auto space-y-1.5 pr-0.5">
          <button
            v-for="template in filteredTemplates"
            :key="template.id"
            type="button"
            @click="openActivityFromMobile(template)"
            class="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left shadow-2xs transition hover:border-foreground/20 hover:bg-accent/50 active:scale-[0.99] cursor-pointer"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base shadow-2xs" :class="toneOf(template.color).dot">
                {{ template.emoji }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-foreground">{{ template.name }}</p>
                <p class="text-xs text-muted-foreground">{{ template.category }} · {{ formatDuration(template.defaultDuration) }}</p>
              </div>
            </div>
            <span class="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
              Add +
            </span>
          </button>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-between">
          <button
            type="button"
            @click="mobileSheet = null; managerOpen = true"
            class="text-xs font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer"
          >
            Manage custom activities
          </button>
          <button
            type="button"
            @click="mobileSheet = null"
            class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>

    <!-- Mobile Checklist Bottom Sheet -->
    <Modal
      :open="mobileSheet === 'checklist'"
      title="Daily Habits & Checklist"
      @close="mobileSheet = null"
    >
      <div class="max-h-[60vh] overflow-y-auto">
        <DailyChecklist
          :day="day"
          :items="checklistItems"
          :completed-ids="completedChecklistIds"
          @toggle="toggleChecklistItem"
          @created="onChecklistCreated"
          @updated="onChecklistUpdated"
          @deleted="onChecklistDeleted"
        />
      </div>
    </Modal>
  </div>
</template>
