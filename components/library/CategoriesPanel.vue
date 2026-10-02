<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import { computed, nextTick, ref, watch } from "vue";
import { paletteOf } from "~/lib/colors";
import { withImplicitCategories } from "~/composables/useCategories";
import type { CategoryEntry } from "~/composables/useCategories";
import type { ActivityTemplate } from "~/lib/types";
import ColorSwatches from "~/components/category/ColorSwatches.vue";

const props = defineProps<{
  templates: ActivityTemplate[];
  /** True while this tab is the one on screen. */
  active: boolean;
}>();

// Renaming or deleting a category rewrites its activities and blocks on the server, so the
// parent needs to reload them.
const emit = defineEmits<{ (e: "changed"): void }>();

const { categories, loaded, loadError, load, create, update, remove, nextColor } = useCategories();

const entries = computed(() => withImplicitCategories(categories.value, props.templates));

const counts = computed(() => {
  const map = new Map<string, number>();
  for (const t of props.templates) map.set(t.category, (map.get(t.category) ?? 0) + 1);
  return map;
});
const countOf = (entry: CategoryEntry) => counts.value.get(entry.name) ?? 0;
const countLabel = (n: number) => (n === 0 ? "Empty" : n === 1 ? "1 activity" : `${n} activities`);

const keyOf = (entry: CategoryEntry) => entry.id ?? `unsaved:${entry.name}`;

// ----- add -----
const newName = ref("");
const newColor = ref("indigo");
const addError = ref<string | null>(null);
const adding = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);
const justAdded = ref<string | null>(null);
let justAddedTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.active,
  (open) => {
    if (!open) return;
    newColor.value = nextColor();
    load();
    nextTick(() => nameInput.value?.focus());
  },
  { immediate: true },
);

const add = async () => {
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
    newColor.value = nextColor();
    justAdded.value = created.id;
    clearTimeout(justAddedTimer);
    justAddedTimer = setTimeout(() => (justAdded.value = null), 1600);
    await nextTick();
    nameInput.value?.focus();
  } catch (err) {
    addError.value = err instanceof Error ? err.message : "Could not add category";
  } finally {
    adding.value = false;
  }
};

// ----- edit -----
const nameDrafts = ref<Record<string, string>>({});
const rowErrors = ref<Record<string, string | null>>({});
const colorOpen = ref<string | null>(null);

const setRowError = (key: string, message: string | null) => {
  rowErrors.value = { ...rowErrors.value, [key]: message };
};

const patchCategory = async (entry: CategoryEntry, patch: { name?: string; color?: string }) => {
  if (!entry.id) return;
  const key = keyOf(entry);
  setRowError(key, null);
  try {
    await update(entry.id, patch);
    if (patch.name !== undefined) emit("changed");
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
  const { [key]: _discard, ...rest } = nameDrafts.value;
  nameDrafts.value = rest;
  if (!name || name === entry.name) return;
  await patchCategory(entry, { name });
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

// ----- delete -----
const deleting = ref<string | null>(null);
const moveTo = ref("");
const removing = ref(false);

const moveTargets = (entry: CategoryEntry) => entries.value.filter((e) => e.name !== entry.name);

const askDelete = (entry: CategoryEntry) => {
  colorOpen.value = null;
  if (deleting.value === keyOf(entry)) {
    deleting.value = null;
    return;
  }
  deleting.value = keyOf(entry);
  const targets = moveTargets(entry);
  moveTo.value = (targets.find((t) => t.name === "General") ?? targets[0])?.name ?? "";
};

const confirmDelete = async (entry: CategoryEntry) => {
  if (!entry.id) return;
  const key = keyOf(entry);
  const n = countOf(entry);
  removing.value = true;
  setRowError(key, null);
  try {
    await remove(entry.id, n > 0 ? moveTo.value : undefined);
    deleting.value = null;
    emit("changed");
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
</script>

<template>
  <div class="space-y-5">
      <!-- Add -->
      <form class="rounded-xl border border-border bg-muted/40 p-3" @submit.prevent="add">
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
            type="submit"
            :disabled="adding || !newName.trim()"
            class="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:px-3.5"
          >
            <Plus class="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </button>
        </div>
        <div class="mt-3">
          <ColorSwatches v-model="newColor" />
        </div>
        <p v-if="addError" class="mt-2 text-xs font-medium text-destructive" role="alert">{{ addError }}</p>
      </form>

      <p v-if="loadError" class="rounded-lg border border-rose-200/80 bg-rose-50/80 p-3 text-xs font-medium text-rose-800 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200" role="alert">
        Couldn't load your saved categories: {{ loadError }}. Showing the ones your activities use.
      </p>

      <!-- List -->
      <div>
        <div class="mb-2 flex items-center justify-between px-0.5">
          <h3 class="text-xs font-medium text-foreground">Your categories</h3>
          <span class="text-[11px] tabular-nums text-muted-foreground">{{ entries.length }}</span>
        </div>

        <p v-if="!loaded && !entries.length" class="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        <p v-else-if="!entries.length" class="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No categories yet. Add your first one above.
        </p>

        <ul v-else class="space-y-2">
          <li
            v-for="entry in entries"
            :key="keyOf(entry)"
            class="overflow-hidden rounded-xl border bg-card shadow-2xs transition-shadow duration-500"
            :class="justAdded !== null && justAdded === entry.id ? 'border-ring/60 bg-accent/40' : 'border-border'"
          >
            <div class="flex items-center gap-2 p-2">
              <!-- Color (click to change) -->
              <button
                v-if="entry.id"
                type="button"
                :aria-label="`Change color of ${entry.name}`"
                :aria-expanded="colorOpen === keyOf(entry)"
                title="Change color"
                class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9 sm:w-9"
                :class="paletteOf(entry.color).icon"
                @click="toggleColors(entry)"
              >
                <span class="h-3.5 w-3.5 rounded-full shadow-2xs" :class="paletteOf(entry.color).swatch" />
              </button>
              <span
                v-else
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9"
                :class="paletteOf(entry.color).icon"
              >
                <span class="h-3.5 w-3.5 rounded-full shadow-2xs" :class="paletteOf(entry.color).swatch" />
              </span>

              <!-- Name (click to rename) -->
              <input
                v-if="entry.id"
                :value="nameOf(entry)"
                type="text"
                maxlength="40"
                :aria-label="`Rename ${entry.name}`"
                class="h-11 min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-foreground transition hover:bg-muted focus:border-input focus:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
                @input="nameDrafts[keyOf(entry)] = ($event.target as HTMLInputElement).value"
                @blur="commitName(entry)"
                @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                @keydown.esc.stop.prevent="(revertName(entry), ($event.target as HTMLInputElement).blur())"
              />
              <div v-else class="flex min-w-0 flex-1 items-center gap-2 px-2">
                <span class="truncate text-sm font-medium text-foreground">{{ entry.name }}</span>
                <span class="shrink-0 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Not saved</span>
              </div>

              <span class="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{{ countLabel(countOf(entry)) }}</span>

              <template v-if="entry.id">
                <button
                  type="button"
                  :aria-label="`Delete ${entry.name}`"
                  title="Delete"
                  class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-8 sm:w-8"
                  :class="deleting === keyOf(entry) ? 'bg-destructive/10 text-destructive' : ''"
                  @click="askDelete(entry)"
                >
                  <Trash2 class="h-4 w-4" aria-hidden="true" />
                </button>
              </template>
              <button
                v-else
                type="button"
                class="h-11 shrink-0 cursor-pointer rounded-md border border-input bg-background px-3.5 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:px-2.5 sm:text-xs"
                @click="saveUnsaved(entry)"
              >
                Save
              </button>
            </div>

            <!-- Color picker -->
            <div v-if="colorOpen === keyOf(entry)" class="border-t border-border bg-muted/30 px-3 py-3">
              <ColorSwatches :model-value="entry.color" @update:model-value="(color: string) => patchCategory(entry, { color })" />
            </div>

            <!-- Delete confirmation -->
            <div v-if="deleting === keyOf(entry)" class="space-y-3 border-t border-destructive/20 bg-destructive/5 px-3 py-3">
              <template v-if="countOf(entry) > 0">
                <p class="text-xs text-foreground">
                  <span class="font-semibold">{{ countLabel(countOf(entry)) }}</span> will move to:
                </p>
                <select
                  v-if="moveTargets(entry).length"
                  v-model="moveTo"
                  aria-label="Move activities to"
                  class="h-11 w-full cursor-pointer rounded-md border border-input bg-background px-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
                >
                  <option v-for="target in moveTargets(entry)" :key="target.name" :value="target.name">
                    {{ target.name }}
                  </option>
                </select>
                <p v-else class="text-xs text-muted-foreground">Add another category first, so these activities have somewhere to go.</p>
              </template>
              <p v-else class="text-xs text-foreground">This category is empty. Delete it?</p>

              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="h-11 flex-1 cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:flex-none sm:text-xs"
                  @click="deleting = null"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  :disabled="removing || (countOf(entry) > 0 && !moveTo)"
                  class="h-11 flex-1 cursor-pointer rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground shadow-xs transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:flex-none sm:text-xs"
                  @click="confirmDelete(entry)"
                >
                  {{ removing ? "Deleting…" : "Delete category" }}
                </button>
              </div>
            </div>

            <p v-if="rowErrors[keyOf(entry)]" class="border-t border-border px-3 py-2 text-xs font-medium text-destructive" role="alert">
              {{ rowErrors[keyOf(entry)] }}
            </p>
          </li>
        </ul>
      </div>

      <p class="px-0.5 text-xs leading-relaxed text-muted-foreground">
        <span class="touch:hidden">Click</span><span class="hidden touch:inline">Tap</span> a dot to change its color, or a name to rename it. Deleting a category never deletes activities; they move to the category you choose.
      </p>
  </div>
</template>
