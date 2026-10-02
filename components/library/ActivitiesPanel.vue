<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { paletteOf } from "~/lib/colors";
import { api } from "~/lib/api";
import { formatDuration } from "~/lib/time";
import { withImplicitCategories } from "~/composables/useCategories";
import type { ActivityTemplate } from "~/lib/types";
import ActivityForm from "~/components/activity/ActivityForm.vue";
import type { ActivityDraft } from "~/components/activity/ActivityForm.vue";

const props = defineProps<{
  /** False while the dialog is closed, so a half-filled form isn't kept around. */
  active: boolean;
  templates: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "saved", template: ActivityTemplate): void;
  (e: "deleted", id: string): void;
}>();

const { categories, load: loadCategories, colorOf } = useCategories();

// "list" is the library; "create" and "edit" swap it for the form.
const mode = ref<{ kind: "list" } | { kind: "create" } | { kind: "edit"; template: ActivityTemplate }>({ kind: "list" });
const search = ref("");
const busy = ref(false);
const error = ref<string | null>(null);
const deletingId = ref<string | null>(null);

watch(
  () => props.active,
  (active) => {
    if (active) return;
    mode.value = { kind: "list" };
    search.value = "";
    error.value = null;
    deletingId.value = null;
  },
);

const blankDraft = (): ActivityDraft => {
  const first = categories.value.find((c) => c.name === "General") ?? categories.value[0];
  return {
    name: "",
    emoji: "📌",
    category: first?.name ?? "General",
    defaultDuration: 60,
    notes: "",
  };
};

const draftOf = (t: ActivityTemplate): ActivityDraft => ({
  name: t.name,
  emoji: t.emoji,
  category: t.category,
  defaultDuration: t.defaultDuration,
  notes: t.notes ?? "",
});

const query = computed(() => search.value.trim().toLowerCase());

const grouped = computed(() => {
  const byCategory = new Map<string, ActivityTemplate[]>();
  for (const t of props.templates) {
    if (query.value && !t.name.toLowerCase().includes(query.value)) continue;
    byCategory.set(t.category, [...(byCategory.get(t.category) ?? []), t]);
  }
  return withImplicitCategories(categories.value, props.templates)
    .map((c) => ({ ...c, items: (byCategory.get(c.name) ?? []).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.items.length > 0);
});

const startCreate = () => {
  error.value = null;
  deletingId.value = null;
  mode.value = { kind: "create" };
};

const startEdit = (template: ActivityTemplate) => {
  error.value = null;
  deletingId.value = null;
  mode.value = { kind: "edit", template };
};

const backToList = () => {
  error.value = null;
  mode.value = { kind: "list" };
};

const payload = (d: ActivityDraft) => ({
  name: d.name.trim(),
  emoji: d.emoji,
  color: colorOf({ category: d.category.trim() || "General" }),
  category: d.category.trim() || "General",
  defaultDuration: d.defaultDuration,
  notes: d.notes.trim() || null,
});

const submit = async (d: ActivityDraft) => {
  busy.value = true;
  error.value = null;
  try {
    const current = mode.value;
    const saved =
      current.kind === "edit"
        ? await api.updateTemplate(current.template.id, payload(d))
        : await api.createTemplate(payload(d));
    emit("saved", saved);
    // The server may have created the category just now; pick it up for the lists.
    loadCategories(true);
    mode.value = { kind: "list" };
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not save";
  } finally {
    busy.value = false;
  }
};

const confirmDelete = async (id: string) => {
  busy.value = true;
  error.value = null;
  try {
    await api.deleteTemplate(id);
    emit("deleted", id);
    deletingId.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not delete";
  } finally {
    busy.value = false;
  }
};

</script>

<template>
  <div>
    <!-- Add / edit -->
    <div v-if="mode.kind !== 'list'">
      <button
        type="button"
        class="-ml-2 mb-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:mb-4 sm:min-h-0 sm:text-xs"
        @click="backToList"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l-5 5 5 5" /></svg>
        All activities
      </button>
      <h3 class="mb-4 text-sm font-semibold tracking-tight text-foreground">
        {{ mode.kind === "edit" ? "Edit activity" : "New activity" }}
      </h3>
    <ActivityForm
      :key="mode.kind === 'edit' ? mode.template.id : 'new'"
      :initial="mode.kind === 'edit' ? draftOf(mode.template) : blankDraft()"
      :templates="templates"
      :submit-label="mode.kind === 'edit' ? 'Save changes' : 'Add activity'"
      :busy="busy"
      :error="error"
      @submit="submit"
      @cancel="backToList"
    />
    </div>

    <!-- Library -->
    <div v-else class="space-y-4">
      <div class="flex items-center gap-2">
        <div class="relative min-w-0 flex-1">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" stroke-linecap="round" />
          </svg>
          <input
            v-model="search"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            placeholder="Search activities"
            aria-label="Search activities"
            class="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
          />
        </div>
        <button
          type="button"
          class="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 sm:h-9 sm:px-3.5"
          @click="startCreate"
        >
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke-linecap="round" />
          </svg>
          New
        </button>
      </div>

      <p v-if="error" class="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive" role="alert">{{ error }}</p>

      <div v-if="grouped.length === 0" class="rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <p class="text-sm font-medium text-foreground">
          {{ templates.length === 0 ? "No activities yet" : `No matches for “${search.trim()}”` }}
        </p>
        <button
          v-if="templates.length === 0"
          type="button"
          class="mt-3 inline-flex h-11 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 sm:h-9"
          @click="startCreate"
        >
          Create your first activity
        </button>
      </div>

      <section v-for="group in grouped" :key="group.name">
        <h3 class="mb-2 flex items-center gap-2 px-0.5 text-xs font-semibold text-muted-foreground">
          <span class="h-2.5 w-2.5 rounded-full shadow-2xs" :class="paletteOf(group.color).dot" />
          {{ group.name }}
          <span class="font-mono text-[10px] tabular-nums">{{ group.items.length }}</span>
        </h3>
        <ul class="space-y-1.5">
          <li v-for="template in group.items" :key="template.id" class="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
            <div class="group flex items-center gap-2 p-2.5 sm:gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl" :class="paletteOf(colorOf(template)).icon">
                {{ template.emoji }}
              </span>
              <button type="button" class="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-none" :aria-label="`Edit ${template.name}`" @click="startEdit(template)">
                <p class="truncate text-sm font-semibold text-foreground">{{ template.name }}</p>
                <p class="truncate text-xs text-muted-foreground tabular-nums">
                  {{ formatDuration(template.defaultDuration) }}<template v-if="template.notes"> · {{ template.notes }}</template>
                </p>
              </button>
              <button
                type="button"
                :aria-label="`Edit ${template.name}`"
                title="Edit"
                class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-8 sm:w-8"
                @click="startEdit(template)"
              >
                <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                :aria-label="`Delete ${template.name}`"
                title="Delete"
                class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-8 sm:w-8"
                :class="deletingId === template.id ? 'bg-destructive/10 text-destructive' : ''"
                @click="deletingId = deletingId === template.id ? null : template.id"
              >
                <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" />
                </svg>
              </button>
            </div>
            <div v-if="deletingId === template.id" class="flex flex-wrap items-center justify-between gap-2 border-t border-destructive/20 bg-destructive/5 px-3 py-2.5">
              <p class="text-xs text-foreground">Delete “{{ template.name }}”? Blocks already on your calendar stay.</p>
              <div class="flex w-full gap-2 sm:w-auto">
                <button type="button" class="h-11 flex-1 cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:flex-none sm:text-xs" @click="deletingId = null">Cancel</button>
                <button
                  type="button"
                  :disabled="busy"
                  class="h-11 flex-1 cursor-pointer rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground shadow-xs transition hover:bg-destructive/90 disabled:opacity-50 sm:h-8 sm:flex-none sm:text-xs"
                  @click="confirmDelete(template.id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
