<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { paletteOf } from "~/lib/colors";
import { api } from "~/lib/api";
import {
  DURATION_CHOICES,
  formatDuration,
  formatTime,
  fromTimeInput,
  timeInputValue,
} from "~/lib/time";
import type { ActivityTemplate, ScheduledTask } from "~/lib/types";

export type EditorRequest = {
  mode: "create" | "edit";
  day: string;
  startMinutes: number;
  task?: ScheduledTask;
  template?: ActivityTemplate | null;
};

const props = defineProps<{
  request: EditorRequest | null;
  templates: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved", task: ScheduledTask): void;
  (e: "deleted", id: string): void;
  (e: "template-deleted", id: string): void;
}>();

const title = ref("");
const emoji = ref("📌");
const category = ref("General");
const day = ref("");
const start = ref("09:00");
const duration = ref(30);
const notes = ref("");
const completed = ref(false);
const templateId = ref<string | null>(null);
const busy = ref(false);
const error = ref<string | null>(null);
const confirmingTemplateDelete = ref(false);

const isEdit = computed(() => props.request?.mode === "edit");
const { colorOf } = useCategories();
// Blocks take their category's color; there is no separate color to pick.
const color = computed(() => colorOf({ category: category.value.trim() || "General" }));
const tone = computed(() => paletteOf(color.value));

const durationOptions = computed(() => {
  return [...new Set([...DURATION_CHOICES, duration.value])].sort((a, b) => a - b);
});

const subtitle = computed(
  () => `${formatTime(fromTimeInput(start.value))} · ${formatDuration(duration.value)}`,
);

watch(
  () => props.request,
  (req) => {
    if (!req) return;
    if (req.mode === "edit" && req.task) {
      const task = req.task;
      title.value = task.title;
      emoji.value = task.emoji;
      category.value = task.category;
      day.value = task.day;
      start.value = timeInputValue(task.startMinutes);
      duration.value = task.durationMinutes;
      notes.value = task.notes ?? "";
      completed.value = task.completed;
      templateId.value = task.templateId;
    } else {
      const template = req.template ?? null;
      title.value = template?.name ?? "";
      emoji.value = template?.emoji ?? "📌";
      category.value = template?.category ?? "General";
      day.value = req.day;
      start.value = timeInputValue(req.startMinutes);
      duration.value = template?.defaultDuration ?? 30;
      notes.value = template?.notes ?? "";
      completed.value = false;
      templateId.value = template?.id ?? null;
    }
    error.value = null;
    confirmingTemplateDelete.value = false;
  },
  { immediate: true },
);

const applyTemplate = (idStr: string) => {
  const nextId = idStr || null;
  templateId.value = nextId;
  const template = props.templates.find((item) => item.id === nextId);
  if (!template) return;
  title.value = template.name;
  emoji.value = template.emoji;
  category.value = template.category;
  duration.value = template.defaultDuration;
  if (!notes.value) notes.value = template.notes ?? "";
};

const submit = async () => {
  if (!title.value.trim()) {
    error.value = "Give this block a name.";
    return;
  }
  busy.value = true;
  error.value = null;
  const payload = {
    title: title.value.trim(),
    emoji: emoji.value,
    color: color.value,
    category: category.value.trim() || "General",
    day: day.value,
    startMinutes: fromTimeInput(start.value),
    durationMinutes: duration.value,
    notes: notes.value.trim() || null,
    completed: completed.value,
    templateId: templateId.value,
  };
  try {
    if (isEdit.value && props.request?.task) {
      const updated = await api.updateTask(props.request.task.id, payload);
      emit("saved", updated);
    } else {
      const created = await api.createTask(payload);
      emit("saved", created);
    }
    emit("close");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Something went wrong";
  } finally {
    busy.value = false;
  }
};

// When the popup was opened from an activity in the library, that activity can be deleted here.
const sourceTemplate = computed(() => (!isEdit.value ? props.request?.template ?? null : null));

const removeTemplate = async () => {
  const template = sourceTemplate.value;
  if (!template) return;
  busy.value = true;
  error.value = null;
  try {
    await api.deleteTemplate(template.id);
    emit("template-deleted", template.id);
    emit("close");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not delete";
    confirmingTemplateDelete.value = false;
  } finally {
    busy.value = false;
  }
};

const remove = async () => {
  if (!props.request?.task) return;
  busy.value = true;
  try {
    await api.deleteTask(props.request.task.id);
    emit("deleted", props.request.task.id);
    emit("close");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not delete";
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <Modal
    :open="Boolean(request)"
    :title="isEdit ? 'Edit time block' : 'New time block'"
    :subtitle="subtitle"
    @close="emit('close')"
  >
    <form id="task-editor-form" class="space-y-4" @submit.prevent="submit">
      <div>
        <label for="task-title" class="text-xs font-medium text-foreground">
          Activity Name
        </label>
        <div class="mt-1.5 flex h-11 w-full items-center rounded-md border border-input bg-background shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring sm:h-10">
          <EmojiPicker v-model="emoji" />
          <span class="h-5 w-px shrink-0 bg-border" />
          <input
            id="task-title"
            v-model="title"
            autofocus
            autocomplete="off"
            enterkeyhint="done"
            placeholder="e.g. Deep focus, Workout"
            class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>
      </div>

      <label v-if="!isEdit && templates.length > 0" class="block">
        <span class="text-xs font-medium text-foreground">
          Start from an activity
        </span>
        <select
          :value="templateId ?? ''"
          @change="applyTemplate(($event.target as HTMLSelectElement).value)"
          class="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
        >
          <option value="">Custom…</option>
          <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
            {{ tpl.emoji }} {{ tpl.name }}
          </option>
        </select>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block min-w-0">
          <span class="text-xs font-medium text-foreground">
            Date
          </span>
          <input
            v-model="day"
            type="date"
            class="mt-1.5 flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
          />
        </label>
        <label class="block min-w-0">
          <span class="text-xs font-medium text-foreground">
            Start Time
          </span>
          <input
            v-model="start"
            type="time"
            step="900"
            class="mt-1.5 flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
          />
        </label>
        <label class="block min-w-0">
          <span class="text-xs font-medium text-foreground">
            Duration
          </span>
          <select
            v-model.number="duration"
            class="mt-1.5 flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
          >
            <option v-for="val in durationOptions" :key="val" :value="val">
              {{ formatDuration(val) }}
            </option>
          </select>
        </label>
        <label class="block min-w-0">
          <span class="text-xs font-medium text-foreground">
            Category
          </span>
          <CategorySelect
            v-model="category"
            :templates="templates"
            class="mt-1.5 w-full"
          />
        </label>
      </div>

      <label class="block">
        <span class="text-xs font-medium text-foreground">
          Notes
        </span>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Any details, reminders, or goals…"
          class="mt-1.5 flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </label>

      <label class="-my-1 flex min-h-11 cursor-pointer items-center gap-3 text-xs font-medium text-foreground sm:min-h-0 sm:gap-2">
        <input
          v-model="completed"
          type="checkbox"
          class="h-5 w-5 rounded-xs border-input accent-primary sm:h-4 sm:w-4"
        />
        <span class="text-sm sm:text-xs">Mark as completed</span>
      </label>
    </form>

    <!-- Pinned below the scrolling form, so the action and any error are always in view -->
    <template #footer>
      <div class="space-y-3">
        <p v-if="error" role="alert" class="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
          {{ error }}
        </p>

        <div
          v-if="confirmingTemplateDelete && sourceTemplate"
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5"
        >
          <p class="text-xs text-foreground">
            Delete the activity “{{ sourceTemplate.name }}”? Blocks already on your calendar stay.
          </p>
          <div class="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              class="h-10 flex-1 cursor-pointer rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:flex-none"
              @click="confirmingTemplateDelete = false"
            >
              Keep it
            </button>
            <button
              type="button"
              :disabled="busy"
              class="h-10 flex-1 cursor-pointer rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground shadow-xs transition hover:bg-destructive/90 disabled:opacity-50 sm:h-8 sm:flex-none"
              @click="removeTemplate"
            >
              {{ busy ? "Deleting…" : "Delete activity" }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Icon-only on phones to leave room for the two main actions -->
          <button
            v-if="sourceTemplate || isEdit"
            type="button"
            :disabled="busy"
            :aria-label="sourceTemplate ? 'Delete activity' : 'Delete block'"
            @click="sourceTemplate ? (confirmingTemplateDelete = !confirmingTemplateDelete) : remove()"
            class="mr-auto inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-xs font-medium text-destructive shadow-xs transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 sm:h-9 sm:w-auto sm:px-3"
          >
            <svg viewBox="0 0 20 20" class="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" />
            </svg>
            <span class="hidden sm:inline">{{ sourceTemplate ? "Delete activity" : "Delete block" }}</span>
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground sm:h-9 sm:flex-none sm:text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-editor-form"
            :disabled="busy"
            class="inline-flex h-11 flex-[1.6] cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50 sm:h-9 sm:flex-none sm:text-xs"
          >
            {{ busy ? "Saving…" : isEdit ? "Save changes" : "Add to schedule" }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>
