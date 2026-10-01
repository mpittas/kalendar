<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { ActivityTemplate, ScheduledTask, ChecklistItem, DayChecklist, DayChecklistItem, DayExtraItem, DayNotes } from "~/lib/types";
import { SLOT_HEIGHT, SLOT_MINUTES, SNAP_MINUTES } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { api } from "~/lib/api";
import {
  floorMinutes,
  formatTime,
  longDate,
  nowMinutes,
  snapMinutes,
  todayISO,
} from "~/lib/time";
import type { EditorRequest } from "~/components/TaskEditor.vue";
import DayPlannerHeader from "~/components/day-planner/DayPlannerHeader.vue";
import DayRoutinesShelf from "~/components/day-planner/DayRoutinesShelf.vue";
import DayTimelineGrid from "~/components/day-planner/DayTimelineGrid.vue";
import DayMobileNav from "~/components/day-planner/DayMobileNav.vue";
import DayMobileActivitiesSheet from "~/components/day-planner/DayMobileActivitiesSheet.vue";

const props = defineProps<{
  day: string;
  initialTasks: ScheduledTask[];
  initialTemplates: ActivityTemplate[];
  initialChecklistItems?: ChecklistItem[];
  initialDayChecklist?: DayChecklist;
  initialNotesText?: string;
  notesState?: "loading" | "ready" | "error";
}>();

const emit = defineEmits<{
  (e: "retry-notes"): void;
}>();

const tasks = ref<ScheduledTask[]>([...props.initialTasks]);
const templates = ref<ActivityTemplate[]>([...props.initialTemplates]);
const checklistItems = ref<ChecklistItem[]>([...(props.initialChecklistItems ?? [])]);
const completedChecklistIds = ref<string[]>([...(props.initialDayChecklist?.completedItemIds ?? [])]);
const hiddenChecklistIds = ref<string[]>([...(props.initialDayChecklist?.hiddenItemIds ?? [])]);
const dayExtraItems = ref<DayExtraItem[]>([...(props.initialDayChecklist?.extraItems ?? [])]);
const notesText = ref(props.initialNotesText ?? "");
const activeSidebarTab = ref<"activities" | "checklist" | "notes">("activities");
const mobileSheet = ref<"checklist" | "activities" | "notes" | null>(null);
const editor = ref<EditorRequest | null>(null);
const { show: showLibrary } = useLibrary();
const preview = ref<{ start: number; duration: number; color: string; label: string } | null>(null);
const resizing = ref<string | null>(null);
const flash = ref<string | null>(null);

const scrollRef = ref<HTMLDivElement | null>(null);

type DragSource = { kind: "template"; template: ActivityTemplate };

const dragSource = ref<DragSource | null>(null);
let resizedJustHappened = false;
let flashTimer: number | null = null;

const clock = ref(nowMinutes());
const today = computed(() => {
  clock.value;
  return todayISO();
});
const isToday = computed(() => props.day === today.value);
const nowMinute = computed(() => (isToday.value ? clock.value : null));
let clockTimer: number | null = null;
const GRID_HEIGHT = (24 * 60 / SLOT_MINUTES) * SLOT_HEIGHT;

watch(
  () => props.initialTasks,
  (val) => { tasks.value = [...val]; },
  { deep: true },
);

watch(
  () => props.initialTemplates,
  (val) => { templates.value = [...val]; },
  { deep: true },
);

watch(
  () => props.initialChecklistItems,
  (val) => { if (val) checklistItems.value = [...val]; },
  { deep: true },
);

watch(
  () => props.initialNotesText,
  (val) => { notesText.value = val ?? ""; },
);

watch(
  () => props.initialDayChecklist,
  (val) => { if (val) applyDayChecklist(val); },
  { deep: true },
);

const onNotesSaved = (saved: DayNotes) => {
  if (saved.day === props.day) notesText.value = saved.text;
};

const applyDayChecklist = (val: DayChecklist) => {
  completedChecklistIds.value = [...val.completedItemIds];
  hiddenChecklistIds.value = [...val.hiddenItemIds];
  dayExtraItems.value = [...val.extraItems];
};

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

const { load: loadCategories } = useCategories();

onMounted(() => {
  loadCategories();
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
  () => { scrollToUsefulPosition(); },
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
    const columns: ScheduledTask[][] = [];
    for (const task of cluster) {
      let placed = false;
      for (const col of columns) {
        const last = col[col.length - 1];
        if (last.startMinutes + last.durationMinutes <= task.startMinutes) {
          col.push(task);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([task]);
    }
    const width = 1 / columns.length;
    columns.forEach((col, colIdx) => {
      col.forEach((task) => {
        map.set(task.id, { left: colIdx * width, width });
      });
    });
    cluster = [];
    clusterEnd = -1;
  };

  for (const task of sorted) {
    if (cluster.length && task.startMinutes >= clusterEnd) flush();
    cluster.push(task);
    clusterEnd = Math.max(clusterEnd, task.startMinutes + task.durationMinutes);
  }
  flush();
  return map;
});

const stats = computed(() => {
  const scheduled = tasks.value.reduce((sum, task) => sum + task.durationMinutes, 0);
  const count = tasks.value.length;
  const done = tasks.value.filter((t) => t.completed).length;

  const catMap = new Map<string, number>();
  for (const t of tasks.value) {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.durationMinutes);
  }
  const categories = [...catMap.entries()].sort((a, b) => b[1] - a[1]);

  return { scheduled, count, done, categories };
});

const categoryColor = (cat: string) => {
  const map: Record<string, string> = {
    Work: "indigo",
    Personal: "emerald",
    Health: "rose",
    DeepWork: "violet",
    Study: "amber",
  };
  return map[cat] ?? "slate";
};

const minutesFromEvent = (container: HTMLDivElement | null, clientY: number) => {
  if (!container) return 0;
  const rect = container.getBoundingClientRect();
  const offsetY = Math.max(0, Math.min(rect.height, clientY - rect.top));
  const raw = (offsetY / SLOT_HEIGHT) * SLOT_MINUTES;
  return floorMinutes(raw, SNAP_MINUTES);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  const start = minutesFromEvent(event.currentTarget as HTMLDivElement, event.clientY);
  const template = dragSource.value?.template;
  preview.value = {
    start,
    duration: template?.defaultDuration ?? 60,
    color: template?.color ?? "indigo",
    label: template?.name ?? "New Block",
  };
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  const start = minutesFromEvent(event.currentTarget as HTMLDivElement, event.clientY);
  preview.value = null;

  const template = dragSource.value?.template;
  dragSource.value = null;
  if (template) await createFromTemplate(template, start);
};

// Shown at once under a temporary id, then swapped for the saved block (or removed if saving fails).
const createFromTemplate = async (template: ActivityTemplate, startMinutes: number) => {
  const draft = {
    day: props.day,
    templateId: template.id,
    title: template.name,
    category: template.category,
    color: template.color,
    emoji: template.emoji,
    startMinutes,
    durationMinutes: template.defaultDuration,
    notes: template.notes ?? "",
    completed: false,
  };
  const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const bySlot = (a: ScheduledTask, b: ScheduledTask) => a.startMinutes - b.startMinutes;
  tasks.value = [...tasks.value, { ...draft, id: tempId }].sort(bySlot);
  try {
    const created = await api.createTask(draft);
    tasks.value = tasks.value.map((item) => (item.id === tempId ? created : item)).sort(bySlot);
    notify(`Added ${template.name}`);
  } catch {
    tasks.value = tasks.value.filter((item) => item.id !== tempId);
    notify("Could not save that block");
  }
};

const moveTask = async (task: ScheduledTask, start: number) => {
  const previous = task.startMinutes;
  if (previous === start) return;
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
  const snapDuration = (minutes: number) => {
    const step = SNAP_MINUTES;
    const longest = Math.floor((24 * 60 - task.startMinutes) / step) * step;
    return Math.max(Math.min(step, longest) || step, Math.min(longest, snapMinutes(minutes, step)));
  };

  const onMove = (moveEvent: PointerEvent) => {
    resizedJustHappened = true;
    const delta = ((moveEvent.clientY - startY) / SLOT_HEIGHT) * SLOT_MINUTES;
    const next = snapDuration(startDuration + delta);
    tasks.value = tasks.value.map((item) =>
      item.id === task.id ? { ...item, durationMinutes: next } : item,
    );
  };

  const finish = async (moveEvent: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    resizing.value = null;
    const delta = ((moveEvent.clientY - startY) / SLOT_HEIGHT) * SLOT_MINUTES;
    const next = snapDuration(startDuration + delta);
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
  const prev = templates.value.find((item) => item.id === template.id);
  // The server recolors every block made from this activity; mirror it here so nothing lags behind.
  if (prev && prev.color !== template.color) {
    tasks.value = tasks.value.map((task) =>
      task.templateId === prev.id || (!task.templateId && task.title === prev.name && task.category === prev.category)
        ? { ...task, color: template.color }
        : task,
    );
  }
  const exists = templates.value.some((item) => item.id === template.id);
  const next = exists
    ? templates.value.map((item) => (item.id === template.id ? template : item))
    : [...templates.value, template];
  templates.value = next.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
};

// Dragging an activity onto another category in the sidebar. Shown at once, undone if saving fails.
const moveTemplate = async (template: ActivityTemplate, category: string) => {
  onTemplateSaved({ ...template, category });
  try {
    onTemplateSaved(await api.updateTemplate(template.id, { category }));
    notify(`Moved ${template.name} to ${category}`);
  } catch {
    onTemplateSaved(template);
    notify("Could not move that activity");
  }
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

// Renaming or deleting a category rewrites its activities and blocks on the server.
const onCategoriesChanged = async () => {
  try {
    const [nextTemplates, nextTasks] = await Promise.all([api.getTemplates(), api.getTasksForDay(props.day)]);
    templates.value = nextTemplates;
    tasks.value = nextTasks;
  } catch {
    notify("Could not refresh activities");
  }
};

const refreshDay = async () => {
  try {
    tasks.value = await api.getTasksForDay(props.day);
    notify("Updated");
  } catch {
    notify("Could not refresh");
  }
};

const dayChecklistItems = computed<DayChecklistItem[]>(() => {
  const hidden = new Set(hiddenChecklistIds.value);
  const defaults = checklistItems.value
    .filter((item) => !hidden.has(item.id))
    .map((item) => ({ ...item, scope: "default" as const }));
  const extras = dayExtraItems.value.map((item, index) => ({
    ...item,
    order: Number.MAX_SAFE_INTEGER - dayExtraItems.value.length + index,
    archived: false,
    scope: "day" as const,
  }));
  return [...defaults, ...extras];
});

const skippedChecklistItems = computed(() => {
  const hidden = new Set(hiddenChecklistIds.value);
  return checklistItems.value.filter((item) => hidden.has(item.id));
});

const hasChecklist = computed(() => checklistItems.value.length > 0 || dayExtraItems.value.length > 0);

const checklistStats = computed(() => {
  const total = dayChecklistItems.value.length;
  const set = new Set(completedChecklistIds.value);
  const done = dayChecklistItems.value.filter((item) => set.has(item.id)).length;
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
    await api.toggleChecklistItem(props.day, itemId, completed);
  } catch {
    notify("Could not update checklist item");
  }
};

const onChecklistCreated = (item: ChecklistItem) => {
  checklistItems.value = [...checklistItems.value, item].sort((a, b) => a.order - b.order);
};

const onChecklistUpdated = (item: ChecklistItem) => {
  checklistItems.value = checklistItems.value.map((t) => (t.id === item.id ? item : t));
};

const onChecklistDeleted = (id: string) => {
  checklistItems.value = checklistItems.value.filter((item) => item.id !== id);
  completedChecklistIds.value = completedChecklistIds.value.filter((item) => item !== id);
};

const onDayChecklistChanged = (updated: DayChecklist) => {
  applyDayChecklist(updated);
};

const openChecklistManager = () => {
  activeSidebarTab.value = "checklist";
  mobileSheet.value = "checklist";
};
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
    <!-- Desktop Sidebar (Activities & Checklist) -->
    <aside class="hidden lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:border-r border-border bg-card">
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
              {{ templates.length }}
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
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted-foreground/15 text-foreground'"
            >
              {{ checklistStats.done }}/{{ checklistStats.total }}
            </span>
          </button>

          <button
            type="button"
            @click="activeSidebarTab = 'notes'"
            class="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer"
            :class="activeSidebarTab === 'notes' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'"
          >
            <span>Notes</span>
            <span v-if="notesText.trim()" class="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Has notes" />
          </button>
        </div>
      </div>

      <DayNotes
        v-if="activeSidebarTab === 'notes'"
        :day="day"
        :text="notesText"
        :state="notesState ?? 'ready'"
        @saved="onNotesSaved"
        @retry="emit('retry-notes')"
      />

      <DailyChecklist
        v-else-if="activeSidebarTab === 'checklist'"
        :day="day"
        :items="dayChecklistItems"
        :skipped-items="skippedChecklistItems"
        :completed-ids="completedChecklistIds"
        @toggle="toggleChecklistItem"
        @created="onChecklistCreated"
        @updated="onChecklistUpdated"
        @deleted="onChecklistDeleted"
        @day-changed="onDayChecklistChanged"
      />

      <ActivityPalette
        v-else
        :templates="templates"
        @pick="(template) => {
          editor = { mode: 'create', day, startMinutes: snapMinutes(nowMinutes(), 30), template };
        }"
        @drag-start="(template) => { dragSource = { kind: 'template', template }; }"
        @drag-end="() => { dragSource = null; preview = null; }"
        @manage="showLibrary('activities')"
        @move="moveTemplate"
      />
    </aside>

    <!-- Timeline section -->
    <section class="flex min-h-0 flex-1 flex-col bg-background">
      <DayPlannerHeader
        :day="day"
        :is-today="isToday"
        :today="today"
        :stats="stats"
        :flash="flash"
        @create-block="editor = { mode: 'create', day, startMinutes: snapMinutes(nowMinutes(), 30), template: null }"
      />

      <div ref="scrollRef" class="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background scroll-pt-6">
        <DayRoutinesShelf
          v-if="hasChecklist"
          :items="dayChecklistItems"
          :completed-ids="completedChecklistIds"
          @toggle="toggleChecklistItem"
          @open-manager="openChecklistManager"
        />

        <DayTimelineGrid
          :day="day"
          :tasks="tasks"
          :now-minute="nowMinute"
          :resizing="resizing"
          :preview="preview"
          :layout="layout"
          :grid-height="GRID_HEIGHT"
          @task-click="(task) => { if (!resizedJustHappened) editor = { mode: 'edit', day, startMinutes: task.startMinutes, task }; }"
          @grid-click="(event) => {
            if (resizedJustHappened) return;
            editor = { mode: 'create', day, startMinutes: minutesFromEvent(event.currentTarget as HTMLDivElement, event.clientY), template: null };
          }"
          @toggle-complete="toggleComplete"
          @delete-task="deleteTask"
          @start-resize="startResize"
          @drag-over="handleDragOver"
          @drag-leave="(event) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) preview = null; }"
          @drop="handleDrop"
          @move-task="moveTask"
          @refresh="refreshDay"
        />
      </div>

      <DayMobileNav
        :checklist-stats="checklistStats"
        :has-notes="notesText.trim().length > 0"
        @open-sheet="(sheet) => { mobileSheet = sheet; }"
        @create-block="editor = { mode: 'create', day, startMinutes: snapMinutes(nowMinutes(), 30), template: null }"
      />
    </section>

    <!-- Modals & Sheets -->
    <TaskEditor
      :request="editor"
      :templates="templates"
      @close="editor = null"
      @saved="onTaskSaved"
      @deleted="onTaskDeleted"
      @template-deleted="(id) => { templates = templates.filter((item) => item.id !== id); notify('Activity deleted'); }"
    />

    <!-- After the editors so it opens on top of them (e.g. from a category picker). -->
    <LibraryModal
      :templates="templates"
      @saved="onTemplateSaved"
      @deleted="(id) => { templates = templates.filter((item) => item.id !== id) }"
      @categories-changed="onCategoriesChanged"
    />

    <DayMobileActivitiesSheet
      :open="mobileSheet === 'activities'"
      :templates="templates"
      @close="mobileSheet = null"
      @pick-template="(template) => { editor = { mode: 'create', day, startMinutes: snapMinutes(nowMinutes(), 30), template }; }"
      @open-manager="showLibrary('activities')"
    />

    <Modal
      :open="mobileSheet === 'notes'"
      title="Notes"
      :subtitle="longDate(day)"
      flush
      @close="mobileSheet = null"
    >
      <div class="flex h-[min(60dvh,32rem)] flex-col">
        <DayNotes
          :day="day"
          :text="notesText"
          :state="notesState ?? 'ready'"
          @saved="onNotesSaved"
          @retry="emit('retry-notes')"
        />
      </div>
    </Modal>

    <Modal
      :open="mobileSheet === 'checklist'"
      title="Daily Habits & Checklist"
      flush
      @close="mobileSheet = null"
    >
      <div class="flex h-[min(70dvh,36rem)] flex-col">
        <DailyChecklist
          :day="day"
          :items="dayChecklistItems"
          :skipped-items="skippedChecklistItems"
          :completed-ids="completedChecklistIds"
          @toggle="toggleChecklistItem"
          @created="onChecklistCreated"
          @updated="onChecklistUpdated"
          @deleted="onChecklistDeleted"
          @day-changed="onDayChecklistChanged"
        />
      </div>
    </Modal>
  </div>
</template>
