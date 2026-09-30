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
  (e: "deleted", id: string): void;
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
const editingId = ref<string | null>(null);
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

const remove = async (id: string) => {
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
    subtitle="These are the reusable draggable blocks in your library."
    wide
    @close="emit('close')"
  >
    <div class="space-y-5">
      <!-- Create new activity form -->
      <section class="rounded-xl border border-border bg-muted/40 p-4">
        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          New activity template
        </h3>
        <div class="space-y-3">
          <div class="flex gap-2">
            <input
              v-model="draft.name"
              placeholder="Activity name (e.g. Deep Work)"
              class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <select
              v-model.number="draft.defaultDuration"
              class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option v-for="val in DURATION_CHOICES" :key="val" :value="val">
                {{ val >= 60 ? `${Math.floor(val / 60)}h${val % 60 ? ` ${val % 60}m` : ''}` : `${val}m` }}
              </option>
            </select>
          </div>
          <div class="flex gap-2">
            <input
              v-model="draft.category"
              placeholder="Category (e.g. Work, Health, Personal)"
              class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <select
              v-model="draft.emoji"
              class="h-9 rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option v-for="choice in [...new Set([draft.emoji, ...EMOJI_CHOICES])]" :key="choice" :value="choice">
                {{ choice }}
              </option>
            </select>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              v-for="key in COLOR_KEYS"
              :key="key"
              type="button"
              :title="PALETTE[key].label"
              @click="draft.color = key"
              :class="[
                'h-6 w-6 rounded-full transition shadow-xs cursor-pointer',
                PALETTE[key].swatch,
                draft.color === key ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
              ]"
            />
          </div>
          <input
            v-model="draft.notes"
            placeholder="Short description or intention (optional)"
            class="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <p v-if="error" class="mt-2.5 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {{ error }}
        </p>

        <button
          type="button"
          :disabled="busy"
          @click="create"
          class="mt-3.5 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          Add activity template
        </button>
      </section>

      <!-- Existing activities grouped by category -->
      <section class="space-y-4">
        <div v-for="[category, items] in grouped" :key="category">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ category }}
          </h3>
          <ul class="space-y-2">
            <li
              v-for="template in items"
              :key="template.id"
              class="rounded-lg border border-border bg-card p-3 shadow-xs"
            >
              <div v-if="editingId === template.id" class="space-y-3">
                <div class="space-y-2.5">
                  <div class="flex gap-2">
                    <input
                      v-model="editDraft.name"
                      placeholder="Activity name"
                      class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <select
                      v-model.number="editDraft.defaultDuration"
                      class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                      class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <select
                      v-model="editDraft.emoji"
                      class="h-9 rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option v-for="choice in [...new Set([editDraft.emoji, ...EMOJI_CHOICES])]" :key="choice" :value="choice">
                        {{ choice }}
                      </option>
                    </select>
                  </div>
                  <div class="flex flex-wrap gap-2 pt-0.5">
                    <button
                      v-for="key in COLOR_KEYS"
                      :key="key"
                      type="button"
                      :title="PALETTE[key].label"
                      @click="editDraft.color = key"
                      :class="[
                        'h-6 w-6 rounded-full transition shadow-xs cursor-pointer',
                        PALETTE[key].swatch,
                        editDraft.color === key ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                      ]"
                    />
                  </div>
                  <input
                    v-model="editDraft.notes"
                    placeholder="Short description (optional)"
                    class="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div class="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    @click="editingId = null"
                    class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :disabled="busy"
                    @click="saveEdit"
                    class="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
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
                  <p class="truncate text-sm font-semibold text-foreground">
                    {{ template.name }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground tabular-nums">
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
                  class="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  :disabled="busy"
                  @click="remove(template.id)"
                  class="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive shadow-xs hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 cursor-pointer"
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
