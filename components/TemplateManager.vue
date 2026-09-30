<script setup lang="ts">
import { ref, computed } from "vue";
import { COLOR_KEYS, PALETTE } from "~/lib/colors";
import { api } from "~/lib/api";
import { DURATION_CHOICES } from "~/lib/time";
import type { ActivityTemplate } from "~/lib/types";

const props = defineProps<{
  open: boolean;
  templates: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved", template: ActivityTemplate): void;
  (e: "deleted", id: number): void;
}>();

const EMOJI_CHOICES = [
  "🧹", "🧼", "🛠️", "💼", "🏋️", "🚶", "☀️", "🌙", "🍽️", "📚",
  "🛒", "👥", "📬", "🧘", "🎸", "🐶", "💡", "🎯", "🚗", "📌",
];

type Draft = {
  name: string;
  emoji: string;
  color: string;
  category: string;
  defaultDuration: number;
  notes: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  emoji: "📌",
  color: "indigo",
  category: "General",
  defaultDuration: 60,
  notes: "",
});

const draft = ref<Draft>(emptyDraft());
const editingId = ref<number | null>(null);
const editDraft = ref<Draft>(emptyDraft());
const busy = ref(false);
const error = ref<string | null>(null);

const grouped = computed(() => {
  const map = new Map<string, ActivityTemplate[]>();
  for (const template of props.templates) {
    const list = map.get(template.category) ?? [];
    list.push(template);
    map.set(template.category, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
});

const create = async () => {
  if (!draft.value.name.trim()) {
    error.value = "Name your activity first.";
    return;
  }
  busy.value = true;
  error.value = null;
  try {
    const created = await api.createTemplate({
      name: draft.value.name.trim(),
      emoji: draft.value.emoji,
      color: draft.value.color,
      category: draft.value.category.trim() || "General",
      defaultDuration: draft.value.defaultDuration,
      notes: draft.value.notes.trim() || null,
    });
    emit("saved", created);
    draft.value = emptyDraft();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not save";
  } finally {
    busy.value = false;
  }
};

const saveEdit = async () => {
  if (!editingId.value || !editDraft.value.name.trim()) return;
  busy.value = true;
  error.value = null;
  try {
    const updated = await api.updateTemplate(editingId.value, {
      name: editDraft.value.name.trim(),
      emoji: editDraft.value.emoji,
      color: editDraft.value.color,
      category: editDraft.value.category.trim() || "General",
      defaultDuration: editDraft.value.defaultDuration,
      notes: editDraft.value.notes.trim() || null,
    });
    emit("saved", updated);
    editingId.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not save";
  } finally {
    busy.value = false;
  }
};

const remove = async (id: number) => {
  busy.value = true;
  try {
    await api.deleteTemplate(id);
    emit("deleted", id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not delete";
  } finally {
    busy.value = false;
  }
};

const toneOf = (color: string) => {
  return PALETTE[color as keyof typeof PALETTE] ?? PALETTE.indigo;
};
</script>

<template>
  <Modal
    :open="open"
    title="Customize activities"
    subtitle="These are the draggable blocks in your sidebar."
    wide
    @close="emit('close')"
  >
    <div class="space-y-5">
      <!-- Create new activity form -->
      <section class="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5">
        <h3 class="mb-2 text-xs font-medium text-slate-700">
          New activity template
        </h3>
        <div class="space-y-2.5">
          <div class="flex gap-2">
            <input
              v-model="draft.name"
              placeholder="Activity name"
              class="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
            />
            <select
              v-model.number="draft.defaultDuration"
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
            >
              <option v-for="val in DURATION_CHOICES" :key="val" :value="val">
                {{ val >= 60 ? `${Math.floor(val / 60)}h${val % 60 ? ` ${val % 60}m` : ''}` : `${val}m` }}
              </option>
            </select>
          </div>
          <div class="flex gap-2">
            <input
              v-model="draft.category"
              placeholder="Category"
              class="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
            />
            <select
              v-model="draft.emoji"
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
            >
              <option v-for="choice in [...new Set([draft.emoji, ...EMOJI_CHOICES])]" :key="choice" :value="choice">
                {{ choice }}
              </option>
            </select>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="key in COLOR_KEYS"
              :key="key"
              type="button"
              :title="PALETTE[key].label"
              @click="draft.color = key"
              :class="[
                'h-5 w-5 rounded-full transition shadow-2xs',
                PALETTE[key].swatch,
                draft.color === key ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-70 hover:opacity-100'
              ]"
            />
          </div>
          <input
            v-model="draft.notes"
            placeholder="Short description (optional)"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
          />
        </div>

        <p v-if="error" class="mt-2 rounded-lg border border-rose-200/80 bg-rose-50/80 p-2 text-xs text-rose-800">
          {{ error }}
        </p>

        <button
          type="button"
          :disabled="busy"
          @click="create"
          class="mt-3 w-full rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
        >
          Add activity template
        </button>
      </section>

      <!-- Existing activities grouped by category -->
      <section class="space-y-4">
        <div v-for="[category, items] in grouped" :key="category">
          <h3 class="mb-1.5 text-xs font-medium text-slate-700">
            {{ category }}
          </h3>
          <ul class="space-y-1.5">
            <li
              v-for="template in items"
              :key="template.id"
              class="rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs"
            >
              <div v-if="editingId === template.id" class="space-y-2.5">
                <div class="space-y-2.5">
                  <div class="flex gap-2">
                    <input
                      v-model="editDraft.name"
                      placeholder="Activity name"
                      class="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
                    />
                    <select
                      v-model.number="editDraft.defaultDuration"
                      class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
                    >
                      <option v-for="val in DURATION_CHOICES" :key="val" :value="val">
                        {{ val >= 60 ? `${Math.floor(val / 60)}h${val % 60 ? ` ${val % 60}m` : ''}` : `${val}m` }}
                      </option>
                    </select>
                  </div>
                  <div class="flex gap-2">
                    <input
                      v-model="editDraft.category"
                      placeholder="Category"
                      class="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
                    />
                    <select
                      v-model="editDraft.emoji"
                      class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
                    >
                      <option v-for="choice in [...new Set([editDraft.emoji, ...EMOJI_CHOICES])]" :key="choice" :value="choice">
                        {{ choice }}
                      </option>
                    </select>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="key in COLOR_KEYS"
                      :key="key"
                      type="button"
                      :title="PALETTE[key].label"
                      @click="editDraft.color = key"
                      :class="[
                        'h-5 w-5 rounded-full transition shadow-2xs',
                        PALETTE[key].swatch,
                        editDraft.color === key ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-70 hover:opacity-100'
                      ]"
                    />
                  </div>
                  <input
                    v-model="editDraft.notes"
                    placeholder="Short description (optional)"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div class="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    @click="editingId = null"
                    class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :disabled="busy"
                    @click="saveEdit"
                    class="rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div v-else class="flex items-center gap-3">
                <span
                  :class="[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base border shadow-2xs',
                    toneOf(template.color).chip
                  ]"
                >
                  {{ template.emoji }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-semibold text-slate-800">
                    {{ template.name }}
                  </p>
                  <p class="truncate text-[11px] text-slate-500 tabular-nums">
                    {{ template.defaultDuration >= 60 ? `${Math.floor(template.defaultDuration / 60)}h${template.defaultDuration % 60 ? ` ${template.defaultDuration % 60}m` : ''}` : `${template.defaultDuration}m` }}
                    {{ template.notes ? ` · ${template.notes}` : '' }}
                  </p>
                </div>
                <button
                  type="button"
                  @click="
                    editingId = template.id;
                    editDraft = {
                      name: template.name,
                      emoji: template.emoji,
                      color: template.color,
                      category: template.category,
                      defaultDuration: template.defaultDuration,
                      notes: template.notes ?? '',
                    };
                  "
                  class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  :disabled="busy"
                  @click="remove(template.id)"
                  class="rounded-lg border border-rose-200/80 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 shadow-2xs transition hover:bg-rose-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </Modal>
</template>
