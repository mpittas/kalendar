<script setup lang="ts">
import { Clock, FolderPlus, Palette, Pencil, Plus, Search, Trash2 } from "lucide-vue-next";
import { computed, nextTick, ref, watch } from "vue";
import { paletteOf } from "~/lib/colors";
import { api } from "~/lib/api";
import { formatDuration, withImplicitCategories, type ActivityTemplate, type CategoryEntry } from "@klndr/core";
import type { LibraryFocus } from "~/composables/useLibrary";
import ActivityForm from "~/components/activity/ActivityForm.vue";
import type { ActivityDraft } from "~/components/activity/ActivityForm.vue";
import ColorSwatches from "~/components/category/ColorSwatches.vue";

const props = defineProps<{
  /** False while the dialog is closed, so half-filled forms aren't kept around. */
  active: boolean;
  focus: LibraryFocus;
  templates: ActivityTemplate[];
  // Callbacks rather than emits (still bound with @saved etc.): closing the dialog unmounts this
  // panel, and Vue drops emits from an unmounted component. A save that finishes after the dialog
  // closed (e.g. a rename committed by clicking outside it) must still reach the planner.
  onSaved?: (template: ActivityTemplate) => void;
  onDeleted?: (id: string) => void;
  // Renaming or deleting a category rewrites its activities and blocks, so the parent reloads them.
  onCategoriesChanged?: () => void;
}>();

const { categories, loaded, loadError, load, create, update, remove, nextColor, colorOf } = useCategories();

const search = ref("");
const query = computed(() => search.value.trim().toLowerCase());
const busy = ref(false);
const error = ref<string | null>(null);

const entries = computed(() => withImplicitCategories(categories.value, props.templates));
const keyOf = (entry: CategoryEntry) => entry.id ?? `unsaved:${entry.name}`;

// With a search, only categories that still have a match; otherwise every category, empty ones too.
const groups = computed(() => {
  const byCategory = new Map<string, ActivityTemplate[]>();
  for (const t of props.templates) {
    if (query.value && !t.name.toLowerCase().includes(query.value)) continue;
    byCategory.set(t.category, [...(byCategory.get(t.category) ?? []), t]);
  }
  return entries.value
    .map((entry) => ({ entry, items: (byCategory.get(entry.name) ?? []).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((group) => !query.value || group.items.length > 0);
});

const countLabel = (n: number) => (n === 0 ? "Empty" : n === 1 ? "1 activity" : `${n} activities`);
const totalOf = (entry: CategoryEntry) => props.templates.filter((t) => t.category === entry.name).length;

// ----- activities: one form at a time, shown in place -----
type ActivityForm = { kind: "create"; category: string } | { kind: "edit"; id: string };
const activityForm = ref<ActivityForm | null>(null);
const deletingId = ref<string | null>(null);

const defaultCategory = () => (categories.value.find((c) => c.name === "General") ?? categories.value[0])?.name ?? "General";

const draftFor = (form: ActivityForm): ActivityDraft => {
  if (form.kind === "create") {
    return { name: "", emoji: "📌", category: form.category, defaultDuration: 60, notes: "" };
  }
  const t = props.templates.find((item) => item.id === form.id);
  return { name: t?.name ?? "", emoji: t?.emoji ?? "📌", category: t?.category ?? "General", defaultDuration: t?.defaultDuration ?? 60, notes: t?.notes ?? "" };
};

const scrollTo = async (selector: string) => {
  await nextTick();
  document.querySelector(selector)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
};

const startCreate = (category = defaultCategory()) => {
  error.value = null;
  deletingId.value = null;
  newCategoryOpen.value = false;
  activityForm.value = { kind: "create", category };
  scrollTo("[data-activity-form]");
};

const startEdit = (id: string) => {
  error.value = null;
  deletingId.value = null;
  newCategoryOpen.value = false;
  activityForm.value = { kind: "edit", id };
  scrollTo("[data-activity-form]");
};

const closeForm = () => {
  error.value = null;
  activityForm.value = null;
};

const submitActivity = async (d: ActivityDraft) => {
  const form = activityForm.value;
  if (!form) return;
  const category = d.category.trim() || "General";
  const body = {
    name: d.name.trim(),
    emoji: d.emoji,
    color: colorOf({ category }),
    category,
    defaultDuration: d.defaultDuration,
    notes: d.notes.trim() || null,
  };
  busy.value = true;
  error.value = null;
  try {
    const saved = form.kind === "edit" ? await api.updateTemplate(form.id, body) : await api.createTemplate(body);
    props.onSaved?.(saved);
    // The server may have created the category just now.
    load(true);
    activityForm.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not save";
  } finally {
    busy.value = false;
  }
};

const confirmDeleteActivity = async (id: string) => {
  busy.value = true;
  error.value = null;
  try {
    await api.deleteTemplate(id);
    props.onDeleted?.(id);
    deletingId.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not delete";
  } finally {
    busy.value = false;
  }
};

// ----- new category -----
const newCategoryOpen = ref(false);
const newName = ref("");
const newColor = ref("indigo");
const addError = ref<string | null>(null);
const adding = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);
const justAdded = ref<string | null>(null);
let justAddedTimer: ReturnType<typeof setTimeout> | undefined;

const startNewCategory = async () => {
  activityForm.value = null;
  newColor.value = nextColor();
  newCategoryOpen.value = true;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.scrollIntoView({ block: "nearest", behavior: "smooth" });
};

const addCategory = async () => {
  const name = newName.value.trim();
  if (!name) {
    addError.value = "Give your category a name.";
    nameInput.value?.focus();
    return;
  }
  adding.value = true;
  addError.value = null;
  try {
    const created = await create({ name, color: newColor.value });
    newName.value = "";
    newCategoryOpen.value = false;
    justAdded.value = created.id;
    clearTimeout(justAddedTimer);
    justAddedTimer = setTimeout(() => (justAdded.value = null), 1600);
  } catch (err) {
    addError.value = err instanceof Error ? err.message : "Could not add category";
  } finally {
    adding.value = false;
  }
};

// ----- existing categories: rename, recolor, delete -----
const nameDrafts = ref<Record<string, string>>({});
const rowErrors = ref<Record<string, string | null>>({});
const colorOpen = ref<string | null>(null);
const deleting = ref<string | null>(null);
const moveTo = ref("");
// What happens to the activities of a category that is being deleted.
const deleteMode = ref<"move" | "delete">("move");
const removing = ref(false);

const setRowError = (key: string, message: string | null) => {
  rowErrors.value = { ...rowErrors.value, [key]: message };
};

const patchCategory = async (entry: CategoryEntry, patch: { name?: string; color?: string }) => {
  if (!entry.id) return;
  const key = keyOf(entry);
  setRowError(key, null);
  try {
    const renamed = patch.name !== undefined && patch.name !== entry.name;
    const affected = renamed ? props.templates.filter((t) => t.category === entry.name) : [];
    // The server renamed these activities too; relabel them here as the list changes.
    await update(entry.id, patch, (updated) => {
      for (const t of affected) props.onSaved?.({ ...t, category: updated.name });
    });
    if (renamed) props.onCategoriesChanged?.();
  } catch (err) {
    setRowError(key, err instanceof Error ? err.message : "Could not save");
  }
};

const nameOf = (entry: CategoryEntry) => nameDrafts.value[keyOf(entry)] ?? entry.name;

const commitName = async (entry: CategoryEntry) => {
  const key = keyOf(entry);
  const draft = nameDrafts.value[key];
  if (draft === undefined) return;
  const name = draft.trim();
  const clearDraft = () => {
    const { [key]: _discard, ...rest } = nameDrafts.value;
    nameDrafts.value = rest;
  };
  if (!name || name === entry.name) return clearDraft();
  // Keep showing the typed name while it saves, so the field doesn't flip back to the old one.
  await patchCategory(entry, { name });
  clearDraft();
};

const revertName = (entry: CategoryEntry) => {
  const { [keyOf(entry)]: _discard, ...rest } = nameDrafts.value;
  nameDrafts.value = rest;
};

const saveUnsaved = async (entry: CategoryEntry) => {
  const key = keyOf(entry);
  setRowError(key, null);
  try {
    await create({ name: entry.name, color: entry.color });
  } catch (err) {
    setRowError(key, err instanceof Error ? err.message : "Could not save");
  }
};

const moveTargets = (entry: CategoryEntry) => entries.value.filter((e) => e.name !== entry.name);

const askDeleteCategory = (entry: CategoryEntry) => {
  colorOpen.value = null;
  if (deleting.value === keyOf(entry)) {
    deleting.value = null;
    return;
  }
  deleting.value = keyOf(entry);
  const targets = moveTargets(entry);
  moveTo.value = (targets.find((t) => t.name === "General") ?? targets[0])?.name ?? "";
  deleteMode.value = targets.length ? "move" : "delete";
};

const confirmDeleteCategory = async (entry: CategoryEntry) => {
  if (!entry.id) return;
  const key = keyOf(entry);
  const n = totalOf(entry);
  removing.value = true;
  setRowError(key, null);
  try {
    if (n === 0) {
      // The list here can be out of date (it isn't shared across days), so ask the server before treating the category as empty.
      const fresh = (await api.getTemplates()).filter((t) => t.category === entry.name).length;
      if (fresh > 0) {
        props.onCategoriesChanged?.();
        setRowError(key, "This category has activities now. Choose what should happen to them.");
        return;
      }
    }
    await remove(entry.id, n === 0 ? undefined : deleteMode.value === "delete" ? { deleteActivities: true } : { moveTo: moveTo.value });
    deleting.value = null;
    props.onCategoriesChanged?.();
  } catch (err) {
    setRowError(key, err instanceof Error ? err.message : "Could not delete");
  } finally {
    removing.value = false;
  }
};

const toggleColors = (entry: CategoryEntry) => {
  deleting.value = null;
  colorOpen.value = colorOpen.value === keyOf(entry) ? null : keyOf(entry);
};

// ----- opening and closing -----
watch(
  () => [props.active, props.focus] as const,
  ([active, focus]) => {
    if (!active) {
      search.value = "";
      error.value = null;
      activityForm.value = null;
      deletingId.value = null;
      deleting.value = null;
      colorOpen.value = null;
      newCategoryOpen.value = false;
      return;
    }
    load();
    if (focus?.kind === "edit") startEdit(focus.id);
    else if (focus?.kind === "new-activity") startCreate();
    else if (focus?.kind === "new-category") startNewCategory();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-5">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-full sm:w-auto sm:min-w-40 sm:flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
        class="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3.5 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-9 sm:flex-none"
        @click="startNewCategory"
      >
        <FolderPlus class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        Category
      </button>
      <button
        type="button"
        class="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 sm:h-9 sm:flex-none"
        @click="startCreate()"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        Activity
      </button>
    </div>

    <!-- New category -->
    <form v-if="newCategoryOpen" class="rounded-xl border border-border bg-muted/40 p-3" @submit.prevent="addCategory" @keydown.esc.stop.prevent="newCategoryOpen = false">
      <label for="new-category-name" class="text-xs font-medium text-foreground">New category</label>
      <div class="mt-2 flex items-stretch gap-2">
        <input
          id="new-category-name"
          ref="nameInput"
          v-model="newName"
          type="text"
          maxlength="40"
          autocomplete="off"
          placeholder="e.g. Fitness, Side project…"
          class="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
          @input="addError = null"
        />
        <button
          type="button"
          class="h-11 shrink-0 cursor-pointer rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:h-9"
          @click="newCategoryOpen = false"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="adding || !newName.trim()"
          class="h-11 shrink-0 cursor-pointer rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
        >
          Add
        </button>
      </div>
      <div class="mt-3"><ColorSwatches v-model="newColor" /></div>
      <p v-if="addError" class="mt-2 text-xs font-medium text-destructive" role="alert">{{ addError }}</p>
    </form>

    <!-- New activity -->
    <div v-if="activityForm?.kind === 'create'" data-activity-form class="rounded-xl border border-border bg-card p-4 shadow-2xs">
      <h3 class="mb-4 text-sm font-semibold tracking-tight text-foreground">New activity</h3>
      <ActivityForm
        :key="`new-${activityForm.category}`"
        :initial="draftFor(activityForm)"
        :templates="templates"
        submit-label="Add activity"
        :busy="busy"
        :error="error"
        @submit="submitActivity"
        @cancel="closeForm"
      />
    </div>

    <p v-else-if="error" class="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive" role="alert">{{ error }}</p>

    <p v-if="loadError" class="rounded-lg border border-rose-200/80 bg-rose-50/80 p-3 text-xs font-medium text-rose-800 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200" role="alert">
      Couldn't load your saved categories: {{ loadError }}. Showing the ones your activities use.
    </p>

    <p v-if="!loaded && !entries.length" class="py-6 text-center text-sm text-muted-foreground">Loading…</p>
    <div v-else-if="groups.length === 0" class="rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <p class="text-sm font-medium text-foreground">
        {{ templates.length === 0 && !query ? "Nothing here yet" : `No matches for “${search.trim()}”` }}
      </p>
      <button
        v-if="templates.length === 0 && !query"
        type="button"
        class="mt-3 inline-flex h-11 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 sm:h-9"
        @click="startCreate()"
      >
        Create your first activity
      </button>
    </div>

    <!-- Categories, each a card with its activities -->
    <div class="space-y-4">
      <section
        v-for="{ entry, items } in groups"
        :key="keyOf(entry)"
        class="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-shadow duration-500"
        :class="justAdded !== null && justAdded === entry.id ? 'ring-2 ring-ring/40' : ''"
      >
        <span class="absolute inset-y-0 left-0 w-1" :class="paletteOf(entry.color).accent" aria-hidden="true" />

        <!-- Category header: color, name, count, actions -->
        <div class="flex items-center gap-1.5 border-b border-border bg-muted/40 py-2 pl-3.5 pr-2">
          <span class="h-2 w-2 shrink-0 rounded-full" :class="paletteOf(entry.color).dot" aria-hidden="true" />

          <input
            v-if="entry.id"
            :value="nameOf(entry)"
            type="text"
            maxlength="40"
            :aria-label="`Rename ${entry.name}`"
            title="Click to rename"
            class="h-8 min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold tracking-tight text-foreground transition hover:bg-background/70 focus:border-input focus:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            @input="nameDrafts[keyOf(entry)] = ($event.target as HTMLInputElement).value"
            @blur="commitName(entry)"
            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            @keydown.esc.stop.prevent="(revertName(entry), ($event.target as HTMLInputElement).blur())"
          />
          <div v-else class="flex min-w-0 flex-1 items-center gap-2 px-1.5">
            <span class="truncate text-sm font-semibold tracking-tight text-foreground">{{ entry.name }}</span>
            <span class="shrink-0 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Not saved</span>
          </div>

          <span class="hidden shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground sm:inline">
            {{ countLabel(totalOf(entry)) }}
          </span>
          <span class="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground sm:hidden">
            {{ totalOf(entry) }}
          </span>

          <template v-if="entry.id">
            <button
              type="button"
              :aria-label="`Change color of ${entry.name}`"
              :aria-expanded="colorOpen === keyOf(entry)"
              title="Change color"
              class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring touch:h-9 touch:w-9"
              :class="colorOpen === keyOf(entry) ? 'bg-background text-foreground shadow-xs' : ''"
              @click="toggleColors(entry)"
            >
              <Palette class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              :aria-label="`Delete category ${entry.name}`"
              title="Delete category"
              class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring touch:h-9 touch:w-9"
              :class="deleting === keyOf(entry) ? 'bg-destructive/10 text-destructive' : ''"
              @click="askDeleteCategory(entry)"
            >
              <Trash2 class="h-4 w-4" aria-hidden="true" />
            </button>
          </template>
          <button
            v-else
            type="button"
            class="h-8 shrink-0 cursor-pointer rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-xs transition hover:bg-accent"
            @click="saveUnsaved(entry)"
          >
            Save
          </button>
        </div>

        <div v-if="colorOpen === keyOf(entry)" class="border-b border-border bg-muted/20 py-3 pl-4 pr-3">
          <ColorSwatches :model-value="entry.color" @update:model-value="(color: string) => patchCategory(entry, { color })" />
        </div>

        <div v-if="deleting === keyOf(entry)" class="space-y-3 border-b border-destructive/15 bg-destructive/5 py-3 pl-4 pr-3">
          <fieldset v-if="totalOf(entry) > 0" class="space-y-2.5">
            <legend class="mb-2 text-xs text-foreground">What should happen to its <span class="font-semibold">{{ countLabel(totalOf(entry)).toLowerCase() }}</span>?</legend>
            <label class="flex items-start gap-2.5" :class="moveTargets(entry).length ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'">
              <input v-model="deleteMode" type="radio" value="move" :name="`delete-mode-${keyOf(entry)}`" :disabled="!moveTargets(entry).length" class="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
              <span class="min-w-0 flex-1 space-y-2">
                <span class="block text-sm text-foreground">Move them to another category</span>
                <select
                  v-if="moveTargets(entry).length"
                  v-model="moveTo"
                  :disabled="deleteMode !== 'move'"
                  aria-label="Move activities to"
                  class="h-11 w-full cursor-pointer rounded-md border border-input bg-background px-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
                  @focus="deleteMode = 'move'"
                >
                  <option v-for="target in moveTargets(entry)" :key="target.name" :value="target.name">{{ target.name }}</option>
                </select>
                <span v-else class="block text-xs text-muted-foreground">Add another category first to move them.</span>
              </span>
            </label>
            <label class="flex cursor-pointer items-start gap-2.5">
              <input v-model="deleteMode" type="radio" value="delete" :name="`delete-mode-${keyOf(entry)}`" class="mt-0.5 h-4 w-4 shrink-0 accent-destructive" />
              <span class="min-w-0 flex-1">
                <span class="block text-sm text-foreground">Delete them too</span>
                <span class="block text-xs text-muted-foreground">Blocks already on your calendar stay.</span>
              </span>
            </label>
          </fieldset>
          <p v-else class="text-xs text-foreground">This category is empty. Delete it?</p>
          <div class="flex justify-end gap-2">
            <button type="button" class="h-11 flex-1 cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:flex-none sm:text-xs" @click="deleting = null">Cancel</button>
            <button
              type="button"
              :disabled="removing || (totalOf(entry) > 0 && deleteMode === 'move' && !moveTo)"
              class="h-11 flex-1 cursor-pointer rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground shadow-xs transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:flex-none sm:text-xs"
              @click="confirmDeleteCategory(entry)"
            >
              {{ removing ? "Deleting…" : totalOf(entry) > 0 && deleteMode === "delete" ? "Delete all" : "Delete category" }}
            </button>
          </div>
        </div>

        <p v-if="rowErrors[keyOf(entry)]" class="border-b border-border py-2 pl-4 pr-3 text-xs font-medium text-destructive" role="alert">{{ rowErrors[keyOf(entry)] }}</p>

        <!-- Activities -->
        <ul class="divide-y divide-border/70 py-1 pl-1">
          <li v-for="template in items" :key="template.id" :id="`library-activity-${template.id}`">
            <!-- Editing, in place -->
            <div v-if="activityForm?.kind === 'edit' && activityForm.id === template.id" data-activity-form class="m-2 rounded-lg border border-border bg-background p-4 shadow-xs sm:p-3">
              <h3 class="mb-3 text-sm font-semibold tracking-tight text-foreground">Edit activity</h3>
              <ActivityForm
                :key="template.id"
                :initial="draftFor(activityForm)"
                :templates="templates"
                submit-label="Save changes"
                :busy="busy"
                :error="error"
                @submit="submitActivity"
                @cancel="closeForm"
              />
            </div>

            <template v-else>
              <div class="flex items-center gap-2.5 py-2 pl-2.5 pr-1.5 transition-colors hover:bg-muted/50 sm:gap-3 sm:pr-2">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm leading-none sm:h-7 sm:w-7 sm:text-base"
                  :class="paletteOf(entry.color).icon"
                  aria-hidden="true"
                >
                  {{ template.emoji }}
                </span>
                <button type="button" class="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-none" :aria-label="`Edit ${template.name}`" @click="startEdit(template.id)">
                  <span class="block truncate text-sm font-medium text-foreground">{{ template.name }}</span>
                  <!-- On phones the duration moves under the name, so the name keeps its room. -->
                  <span class="block truncate text-xs text-muted-foreground" :class="template.notes ? '' : 'sm:hidden'">
                    <span class="font-mono tabular-nums sm:hidden">{{ formatDuration(template.defaultDuration) }}<template v-if="template.notes"> · </template></span>{{ template.notes }}
                  </span>
                </button>
                <span class="hidden shrink-0 sm:inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                  <Clock class="h-3 w-3" aria-hidden="true" />
                  {{ formatDuration(template.defaultDuration) }}
                </span>
                <div class="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    :aria-label="`Edit ${template.name}`"
                    title="Edit"
                    class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground hover:shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring touch:h-9 touch:w-9"
                    @click="startEdit(template.id)"
                  >
                    <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    :aria-label="`Delete ${template.name}`"
                    title="Delete"
                    class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring touch:h-9 touch:w-9"
                    :class="deletingId === template.id ? 'bg-destructive/10 text-destructive' : ''"
                    @click="deletingId = deletingId === template.id ? null : template.id"
                  >
                    <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div v-if="deletingId === template.id" class="flex flex-wrap items-center justify-between gap-2 bg-destructive/5 py-2.5 pl-3 pr-2">
                <p class="text-xs text-foreground">Delete “{{ template.name }}”? Blocks already on your calendar stay.</p>
                <div class="flex w-full gap-2 sm:w-auto">
                  <button type="button" class="h-11 flex-1 cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:flex-none sm:text-xs" @click="deletingId = null">Cancel</button>
                  <button
                    type="button"
                    :disabled="busy"
                    class="h-11 flex-1 cursor-pointer rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground shadow-xs transition hover:bg-destructive/90 disabled:opacity-50 sm:h-8 sm:flex-none sm:text-xs"
                    @click="confirmDeleteActivity(template.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </template>
          </li>

          <li v-if="!query">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-2.5 py-2 sm:gap-3 pl-2.5 pr-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
              @click="startCreate(entry.name)"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-border sm:h-9 sm:w-9">
                <Plus class="h-4 w-4" aria-hidden="true" />
              </span>
              Add activity{{ items.length === 0 ? ` to ${entry.name}` : "" }}
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
