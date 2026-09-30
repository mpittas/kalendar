<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { ActivityTemplate, ScheduledTask } from "~/lib/types";
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
}>();

const tasks = ref<ScheduledTask[]>([...props.initialTasks]);
const templates = ref<ActivityTemplate[]>([...props.initialTemplates]);
const editor = ref<EditorRequest | null>(null);
const managerOpen = ref(false);
const preview = ref<{ start: number; duration: number; color: string; label: string } | null>(null);
const resizing = ref<number | null>(null);
const flash = ref<string | null>(null);

const gridRef = ref<HTMLDivElement | null>(null);
const scrollRef = ref<HTMLDivElement | null>(null);

type DragSource =
  | { kind: "template"; template: ActivityTemplate }
  | { kind: "task"; task: ScheduledTask };

const dragSource = ref<DragSource | null>(null);
let resizedJustHappened = false;
let flashTimer: number | null = null;

const today = todayISO();
const isToday = computed(() => props.day === today);
const nowMinute = computed(() => (isToday.value ? nowMinutes() : null));
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
});

watch(
  () => props.day,
  () => {
    scrollToUsefulPosition();
  },
);

const layout = computed(() => {
  const map = new Map<number, { left: number; width: number }>();
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

const deleteTask = async (id: number) => {
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

const onTaskDeleted = (id: number) => {
  tasks.value = tasks.value.filter((item) => item.id !== id);
};

const onTemplateSaved = (template: ActivityTemplate) => {
  const exists = templates.value.some((item) => item.id === template.id);
  const next = exists
    ? templates.value.map((item) => (item.id === template.id ? template : item))
    : [...templates.value, template];
  templates.value = next.sort((a, b) => a.category.localeCompare(b.category) || a.id - b.id);
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

const toneOf = (color: string) => paletteOf(color);
</script>

<template>
  <div class="flex h-[calc(100dvh-57px)] flex-col bg-slate-100 lg:flex-row">
    <!-- Activity palette sidebar -->
    <aside class="flex max-h-[38vh] w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r">
      <div class="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
        <div class="flex items-center gap-2">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-900">Activities</h2>
          <span class="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono font-medium text-slate-600">
            {{ filteredTemplates.length }}
          </span>
        </div>
        <NuxtLink
          to="/"
          class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
        >
          Calendar
        </NuxtLink>
      </div>

      <div class="px-3 pb-2 pt-1">
        <div class="relative">
          <svg class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5L18 18" stroke-linecap="round" />
          </svg>
          <input
            v-model="templateSearch"
            type="text"
            placeholder="Search activities…"
            class="w-full rounded-lg border border-slate-200/80 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-slate-900 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto px-4 pb-3">
        <p v-if="groupedTemplates.length === 0" class="py-8 text-center text-xs text-slate-400">
          No activities found
        </p>

        <div v-for="[category, items] in groupedTemplates" :key="category">
          <div class="mb-1.5 flex items-center justify-between">
            <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {{ category }}
            </p>
            <span class="text-[10px] font-mono text-slate-400">{{ items.length }}</span>
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
                'group relative flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left shadow-2xs transition hover:shadow-xs active:cursor-grabbing',
                toneOf(template.color).block
              ]"
            >
              <span
                class="absolute inset-y-1.5 left-1 w-0.5 rounded-full"
                :class="toneOf(template.color).accent"
              />
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/70 text-sm leading-none pl-0.5 shadow-2xs">
                {{ template.emoji }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-semibold leading-tight text-slate-900">
                  {{ template.name }}
                </span>
                <span class="block text-[10px] font-mono opacity-70 tabular-nums">
                  {{ formatDuration(template.defaultDuration) }}
                </span>
              </span>
              <span class="text-[11px] opacity-30 transition group-hover:opacity-75">
                ⠿
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-200/80 p-3">
        <button
          type="button"
          @click="managerOpen = true"
          class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
        >
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 4v12M4 10h12" stroke-linecap="round" />
          </svg>
          <span>Customize activities</span>
        </button>
      </div>
    </aside>

    <!-- Timeline section -->
    <section class="flex min-h-0 flex-1 flex-col">
      <header class="border-b border-slate-200/80 bg-white px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="`/day/${addDaysISO(day, -1)}`"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Previous day"
            >
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
            <NuxtLink
              v-if="!isToday"
              :to="`/day/${today}`"
              class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              Today
            </NuxtLink>
            <NuxtLink
              :to="`/day/${addDaysISO(day, 1)}`"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Next day"
            >
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
            <div class="ml-1 min-w-[12rem]">
              <h1 class="text-sm font-semibold text-slate-900 sm:text-base">
                {{ longDate(day) }}
              </h1>
              <p class="text-[11px] text-slate-500 tabular-nums">
                {{ formatDuration(stats.scheduled) }} planned · {{ stats.done }} of {{ stats.count }} completed
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="[category, minutes] in stats.categories.slice(0, 3)"
              :key="category"
              class="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums shadow-2xs"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="toneOf(categoryColor(category)).dot" />
              <span>{{ category }}</span>
              <span class="text-slate-400">·</span>
              <span class="font-mono text-slate-500">{{ formatDuration(minutes) }}</span>
            </span>
            <button
              type="button"
              @click="editor = {
                mode: 'create',
                day,
                startMinutes: snapMinutes(nowMinutes(), 30),
                template: null,
              }"
              class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:bg-slate-800"
            >
              + Time block
            </button>
          </div>
        </div>
        <p v-if="flash" class="mt-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
          {{ flash }}
        </p>
      </header>

      <div
        ref="scrollRef"
        class="relative min-h-0 flex-1 overflow-y-auto"
      >
        <div class="mx-auto flex min-w-[36rem] max-w-4xl">
          <!-- Hour gutter -->
          <div class="relative w-16 shrink-0 select-none border-r border-slate-200 bg-white pr-2">
            <div
              v-for="minute in HOUR_OPTIONS"
              :key="minute"
              :style="{ height: `${SLOT_HEIGHT}px` }"
              class="relative"
            >
              <span
                v-if="gutterLabel(minute)"
                class="absolute -top-2 right-2 text-[10px] font-mono font-medium text-slate-400 tracking-tight"
              >
                {{ gutterLabel(minute) }}
              </span>
            </div>

            <!-- Amie live time pill in gutter -->
            <div
              v-if="nowMinute !== null"
              class="pointer-events-none absolute right-1 z-30 -translate-y-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs"
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
            class="relative flex-1 bg-white"
          >
            <div
              v-for="minute in HOUR_OPTIONS"
              :key="minute"
              :style="{ height: `${SLOT_HEIGHT}px` }"
              :class="[
                'border-b',
                minute % 60 === 0 ? 'border-slate-200/90' : 'border-dashed border-slate-100'
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
              <span class="rounded-full bg-white/95 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-800 shadow-2xs">
                {{ preview.label }} · {{ formatTime(preview.start) }}
              </span>
            </div>

            <!-- Scheduled task blocks -->
            <div
              v-for="task in tasks"
              :key="task.id"
              :draggable="resizing !== task.id"
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
                'group absolute z-10 flex cursor-grab flex-col overflow-hidden rounded-lg border px-2 py-1 shadow-2xs transition-shadow hover:z-20 hover:shadow-xs active:cursor-grabbing',
                task.completed ? toneOf(task.color).blockDone : toneOf(task.color).block
              ]"
            >
              <!-- Amie 2px vertical accent line -->
              <span
                class="absolute inset-y-1.5 left-1 w-0.5 rounded-full transition-opacity"
                :class="[toneOf(task.color).accent, task.completed ? 'opacity-35' : 'opacity-100']"
              />

              <div class="flex items-start gap-1.5 pl-1.5">
                <button
                  type="button"
                  :aria-label="task.completed ? 'Mark as not done' : 'Mark as done'"
                  @click.stop="toggleComplete(task)"
                  :class="[
                    'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors',
                    task.completed
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-400/50 bg-white/70 text-transparent hover:border-slate-600 hover:bg-white'
                  ]"
                >
                  <svg viewBox="0 0 16 16" class="h-2 w-2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </button>
                <p
                  :class="[
                    'min-w-0 flex-1 truncate text-xs font-semibold leading-4',
                    task.completed ? 'line-through opacity-60 text-slate-500' : ''
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
                  class="mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded text-current opacity-0 transition hover:bg-black/10 hover:text-rose-600 group-hover:opacity-75 hover:opacity-100 focus-visible:opacity-100"
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
                class="mt-0.5 pl-6 text-[10px] font-mono leading-4 opacity-75 tabular-nums"
              >
                {{ formatTime(task.startMinutes) }} – {{ formatTime(task.startMinutes + task.durationMinutes) }}
                <span class="opacity-50">·</span>
                {{ formatDuration(task.durationMinutes) }}
              </p>

              <!-- Notes snippet for non-compact tasks -->
              <p
                v-if="((task.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 4) >= SLOT_HEIGHT * 2.2 && task.notes"
                class="mt-0.5 line-clamp-1 pl-6 text-[10px] leading-4 opacity-60"
              >
                {{ task.notes }}
              </p>

              <!-- Resize handle at bottom -->
              <div
                @pointerdown="(event) => startResize(task, event)"
                class="absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize items-center justify-center"
              >
                <span class="h-0.5 w-6 rounded-full bg-slate-900/25 opacity-0 transition group-hover:opacity-100" />
              </div>

              <!-- Active resizing duration badge -->
              <span
                v-if="resizing === task.id"
                class="absolute right-1 top-1 rounded bg-slate-900/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white shadow-2xs"
              >
                {{ formatDuration(task.durationMinutes) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer class="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-500">
        <span>
          Drag an activity into the grid · drag blocks to move · pull the bottom edge to
          resize · click a slot for details
        </span>
        <button
          type="button"
          @click="refreshDay"
          class="shrink-0 rounded-lg px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Refresh
        </button>
      </footer>
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
  </div>
</template>
