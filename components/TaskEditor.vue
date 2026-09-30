<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { COLOR_KEYS, PALETTE, paletteOf } from "~/lib/colors";
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
}>();

const EMOJI_CHOICES = [
  "🧹", "🛠️", "🏋️", "☀️", "🌙", "🍽️", "📚", "🛒", "👥", "📬",
  "🚶", "🧘", "💡", "🎯", "🧑‍🍳", "🐶", "🎸", "🧴", "🚗", "📌",
];

const title = ref("");
const emoji = ref("📌");
const color = ref("indigo");
const category = ref("General");
const day = ref("");
const start = ref("09:00");
const duration = ref(60);
const notes = ref("");
const completed = ref(false);
const templateId = ref<string | null>(null);
const busy = ref(false);
const error = ref<string | null>(null);

const isEdit = computed(() => props.request?.mode === "edit");
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
      color.value = task.color;
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
      color.value = template?.color ?? "indigo";
      category.value = template?.category ?? "General";
      day.value = req.day;
      start.value = timeInputValue(req.startMinutes);
      duration.value = template?.defaultDuration ?? 60;
      notes.value = template?.notes ?? "";
      completed.value = false;
      templateId.value = template?.id ?? null;
    }
    error.value = null;
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
  color.value = template.color;
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
    <div class="space-y-4">
      <label class="block">
        <span class="text-xs font-medium text-slate-700">
          Activity Name
        </span>
        <input
          v-model="title"
          autofocus
          placeholder="e.g. Deep focus, Team sync, Workout"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
        />
      </label>

      <label v-if="!isEdit && templates.length > 0" class="block">
        <span class="text-xs font-medium text-slate-700">
          Start from an activity
        </span>
        <select
          :value="templateId ?? ''"
          @change="applyTemplate(($event.target as HTMLSelectElement).value)"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
        >
          <option value="">Custom…</option>
          <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
            {{ tpl.emoji }} {{ tpl.name }}
          </option>
        </select>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-medium text-slate-700">
            Date
          </span>
          <input
            v-model="day"
            type="date"
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
          />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-700">
            Start Time
          </span>
          <input
            v-model="start"
            type="time"
            step="900"
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
          />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-700">
            Duration
          </span>
          <select
            v-model.number="duration"
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
          >
            <option v-for="val in durationOptions" :key="val" :value="val">
              {{ formatDuration(val) }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-700">
            Category
          </span>
          <input
            v-model="category"
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
          />
        </label>
      </div>

      <div>
        <span class="text-xs font-medium text-slate-700">
          Color
        </span>
        <div class="mt-1.5 flex flex-wrap gap-2">
          <button
            v-for="key in COLOR_KEYS"
            :key="key"
            type="button"
            :title="PALETTE[key].label"
            @click="color = key"
            :class="[
              'h-6 w-6 rounded-full transition shadow-2xs',
              PALETTE[key].swatch,
              color === key ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-70 hover:opacity-100'
            ]"
          />
        </div>
      </div>

      <div>
        <span class="text-xs font-medium text-slate-700">
          Icon
        </span>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <button
            v-for="choice in EMOJI_CHOICES"
            :key="choice"
            type="button"
            @click="emoji = choice"
            :class="[
              'flex h-7 w-7 items-center justify-center rounded-lg text-sm transition shadow-2xs',
              emoji === choice ? `${tone.chip} ring-1 ring-slate-900/30` : 'border border-slate-200/80 bg-white hover:bg-slate-50'
            ]"
          >
            {{ choice }}
          </button>
        </div>
      </div>

      <label class="block">
        <span class="text-xs font-medium text-slate-700">
          Notes
        </span>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Any details, reminders, or goals…"
          class="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
        />
      </label>

      <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
        <input
          v-model="completed"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
        />
        <span>Mark as completed</span>
      </label>

      <p v-if="error" class="rounded-lg border border-rose-200/80 bg-rose-50/80 p-2.5 text-xs text-rose-800">
        {{ error }}
      </p>

      <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <button
          v-if="isEdit"
          type="button"
          :disabled="busy"
          @click="remove"
          class="rounded-lg border border-rose-200/80 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-2xs transition hover:bg-rose-50 disabled:opacity-50"
        >
          Delete block
        </button>
        <span v-else />
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('close')"
            class="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="busy"
            @click="submit"
            class="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
          >
            {{ busy ? "Saving…" : isEdit ? "Save changes" : "Add to schedule" }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>
