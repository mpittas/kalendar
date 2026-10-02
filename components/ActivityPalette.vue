<script setup lang="ts">
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Folder, GripVertical, Plus, Search, X } from "lucide-vue-next";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import type { ActivityTemplate } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { DURATION_CHOICES, formatDuration } from "~/lib/time";
import { api } from "~/lib/api";
import { withImplicitCategories } from "~/composables/useCategories";

const props = defineProps<{
  templates: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "pick", template: ActivityTemplate): void;
  (e: "drag-start", template: ActivityTemplate): void;
  (e: "drag-end"): void;
  (e: "move", template: ActivityTemplate, category: string): void;
  (e: "manage"): void;
  (e: "saved", template: ActivityTemplate): void;
}>();

const { categories, colorOf, load: loadCategories } = useCategories();
const { show: showLibrary } = useLibrary();

const search = ref("");
const searchRef = ref<HTMLInputElement | null>(null);

const COLLAPSED_KEY = "dayforge:collapsed-categories";
const collapsed = ref<string[]>([]);

onMounted(() => {
  try {
    const stored = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? "[]");
    if (Array.isArray(stored)) collapsed.value = stored.filter((c): c is string => typeof c === "string");
  } catch {
    // Unreadable or unavailable storage: start with everything open.
  }
});

watch(collapsed, (value) => {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the preference just won't persist.
  }
});

const query = computed(() => search.value.trim().toLowerCase());

// One group per category, including empty ones, so a new category shows up right away.
// While searching, only groups with a match are listed.
const groups = computed(() => {
  const byCategory = new Map<string, ActivityTemplate[]>();
  for (const template of props.templates) {
    if (
      query.value &&
      !template.name.toLowerCase().includes(query.value) &&
      !template.category.toLowerCase().includes(query.value)
    ) {
      continue;
    }
    const list = byCategory.get(template.category) ?? [];
    list.push(template);
    byCategory.set(template.category, list);
  }
  return withImplicitCategories(categories.value, props.templates)
    .map((entry) => ({ category: entry.name, color: entry.color, items: byCategory.get(entry.name) ?? [] }))
    .filter((group) => !query.value || group.items.length > 0);
});

const matchCount = computed(() => groups.value.reduce((sum, g) => sum + g.items.length, 0));

// While searching, every group with a match is shown so nothing hides behind a collapsed header.
const isOpen = (category: string) => query.value !== "" || !collapsed.value.includes(category);

const toggleGroup = (category: string) => {
  collapsed.value = collapsed.value.includes(category)
    ? collapsed.value.filter((c) => c !== category)
    : [...collapsed.value, category];
};

const allCollapsed = computed(() => groups.value.length > 0 && groups.value.every((g) => collapsed.value.includes(g.category)));
const toggleAll = () => {
  collapsed.value = allCollapsed.value ? [] : groups.value.map((g) => g.category);
};

const clearSearch = () => {
  search.value = "";
  searchRef.value?.focus();
};

// Dropping an activity on a category group moves it there. The drop works on the whole group,
// so it also works on a collapsed one.
const dragging = ref<ActivityTemplate | null>(null);
const dropTarget = ref<string | null>(null);

const onGroupDragOver = (event: DragEvent, category: string) => {
  if (!dragging.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  dropTarget.value = category;
};

const onGroupDragLeave = (event: DragEvent, category: string) => {
  const next = event.relatedTarget as Node | null;
  if (dropTarget.value === category && !(event.currentTarget as HTMLElement).contains(next)) dropTarget.value = null;
};

const onGroupDrop = (category: string) => {
  const template = dragging.value;
  dragging.value = null;
  dropTarget.value = null;
  // The dragged row may be re-rendered into another group, in which case it never gets "dragend".
  emit("drag-end");
  if (template && template.category !== category) emit("move", template, category);
};

const onDragEnd = () => {
  dragging.value = null;
  dropTarget.value = null;
  emit("drag-end");
};

// Quick add: a short form at the bottom of a category. It stays open after each add, so several
// activities can be entered in a row. Name and length are all that is needed; the color is the
// category's.
const adding = ref<string | null>(null);
const addName = ref("");
const addEmoji = ref("📌");
const addDuration = ref(60);
// Saves in flight. Several can overlap when names are typed in quick succession.
const addPending = ref(0);
const addError = ref<string | null>(null);
const addInput = ref<HTMLInputElement | null>(null);

const startAdd = async (category: string) => {
  adding.value = category;
  addName.value = "";
  addError.value = null;
  collapsed.value = collapsed.value.filter((c) => c !== category);
  await nextTick();
  addInput.value?.focus();
  addInput.value?.scrollIntoView({ block: "nearest" });
};

const stopAdd = () => {
  adding.value = null;
  addError.value = null;
};

const submitAdd = async (category: string) => {
  const name = addName.value.trim();
  if (!name) {
    addInput.value?.focus();
    return;
  }
  addPending.value++;
  addError.value = null;
  // Cleared at once so the next name can be typed while this one saves; put back if saving fails.
  addName.value = "";
  try {
    const created = await api.createTemplate({
      name,
      emoji: addEmoji.value || "📌",
      color: colorOf({ category }),
      category,
      defaultDuration: addDuration.value,
      notes: null,
    });
    emit("saved", created);
    // The server may have created the category just now; pick it up for the lists.
    loadCategories(true);
  } catch (err) {
    if (!addName.value) addName.value = name;
    addError.value = err instanceof Error ? err.message : "Could not add that activity";
  } finally {
    addPending.value--;
    await nextTick();
    addInput.value?.focus();
  }
};

const onDragStart = (event: DragEvent, template: ActivityTemplate) => {
  dragging.value = template;
  emit("drag-start", template);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData("application/x-dayforge-template", String(template.id));
  }
};
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Search -->
    <div class="px-3 pb-2 pt-2.5">
      <div class="flex items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          ref="searchRef"
          v-model="search"
          type="text"
          placeholder="Search activities"
          aria-label="Search activities"
          class="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @keydown.esc="clearSearch"
        />
        <button
          v-if="search"
          type="button"
          class="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <X class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
        <button
          v-if="!query && groups.length > 1"
          type="button"
          class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-xs transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          :title="allCollapsed ? 'Expand all categories' : 'Collapse all categories'"
          :aria-label="allCollapsed ? 'Expand all categories' : 'Collapse all categories'"
          @click="toggleAll"
        >
          <ChevronsUpDown v-if="allCollapsed" class="h-4 w-4" aria-hidden="true" />
          <ChevronsDownUp v-else class="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-xs transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Manage categories"
          aria-label="Manage categories"
          @click="showLibrary('categories')"
        >
          <Folder class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Activities, grouped by category -->
    <div class="flex-1 overflow-y-auto px-2 pb-3 pt-1">
      <div v-if="groups.length === 0" class="px-3 py-10 text-center">
        <p class="text-sm font-medium text-foreground">
          {{ templates.length === 0 ? "No activities yet" : `No matches for "${search.trim()}"` }}
        </p>
        <button
          type="button"
          class="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-2 transition hover:text-foreground cursor-pointer"
          @click="templates.length === 0 ? emit('manage') : clearSearch()"
        >
          {{ templates.length === 0 ? "Create your first activity" : "Clear search" }}
        </button>
      </div>

      <section
        v-for="group in groups"
        :key="group.category"
        class="mb-2.5 overflow-hidden rounded-xl border bg-card shadow-2xs transition-all"
        :class="dropTarget === group.category && dragging?.category !== group.category
          ? 'border-ring bg-accent/60 ring-2 ring-ring/30'
          : 'border-border/70'"
        @dragover="onGroupDragOver($event, group.category)"
        @dragleave="onGroupDragLeave($event, group.category)"
        @drop.prevent="onGroupDrop(group.category)"
      >
        <div class="bg-muted/40">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-semibold text-foreground transition hover:bg-muted/70 cursor-pointer"
            :aria-expanded="isOpen(group.category)"
            @click="toggleGroup(group.category)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <ChevronRight class="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200" :class="isOpen(group.category) ? 'rotate-90 text-foreground' : ''" aria-hidden="true" />
              <span class="h-2.5 w-2.5 shrink-0 rounded-full shadow-2xs" :class="paletteOf(group.color).dot" />
              <span class="truncate font-semibold tracking-tight text-foreground">{{ group.category }}</span>
            </div>
            <span class="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground tabular-nums">
              {{ group.items.length }}
            </span>
          </button>
        </div>

        <ul v-show="isOpen(group.category)" class="p-1 space-y-0.5 border-t border-border/40">
          <li
            v-for="template in group.items"
            :key="template.id"
            draggable="true"
            role="button"
            tabindex="0"
            :title="`${template.name} · ${formatDuration(template.defaultDuration)}`"
            :class="dragging?.id === template.id ? 'opacity-40' : ''"
            class="group flex cursor-grab items-center gap-2 rounded-md border border-transparent px-2 py-1 outline-none transition hover:border-border hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing"
            @dragstart="onDragStart($event, template)"
            @dragend="onDragEnd"
            @click="emit('pick', template)"
            @keydown.enter.prevent="emit('pick', template)"
            @keydown.space.prevent="emit('pick', template)"
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs leading-none"
              :class="paletteOf(colorOf(template)).icon"
            >
              {{ template.emoji }}
            </span>
            <span class="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{{ template.name }}</span>
            <span class="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {{ formatDuration(template.defaultDuration) }}
            </span>
            <GripVertical class="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-60 group-focus-visible:opacity-60" aria-hidden="true" />
          </li>

          <!-- Quick add: a subtle row at the end of the category, which turns into the form -->
          <li v-if="adding === group.category" class="rounded-md border border-ring/60 bg-background p-1.5 shadow-2xs">
            <form class="space-y-1.5" @submit.prevent="submitAdd(group.category)" @keydown.esc.stop.prevent="stopAdd">
              <div class="flex h-8 items-center rounded-md border border-input bg-background transition-colors focus-within:ring-1 focus-within:ring-ring">
                <EmojiPicker v-model="addEmoji" />
                <span class="h-4 w-px shrink-0 bg-border" />
                <input
                  :ref="(el) => { if (adding === group.category) addInput = el as HTMLInputElement | null; }"
                  v-model="addName"
                  maxlength="80"
                  autocomplete="off"
                  enterkeyhint="done"
                  :aria-label="`New activity in ${group.category}`"
                  placeholder="New activity, press Enter"
                  class="h-full min-w-0 flex-1 bg-transparent px-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>
              <div class="flex items-center gap-1.5">
                <select
                  v-model.number="addDuration"
                  aria-label="Default length"
                  class="h-7 min-w-0 flex-1 cursor-pointer rounded-md border border-input bg-background px-2 text-xs tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option v-for="minutes in DURATION_CHOICES" :key="minutes" :value="minutes">{{ formatDuration(minutes) }}</option>
                </select>
                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  @click="stopAdd"
                >
                  Done
                </button>
                <button
                  type="submit"
                  :disabled="!addName.trim()"
                  class="h-7 cursor-pointer rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ addPending > 0 ? "Adding…" : "Add" }}
                </button>
              </div>
              <p v-if="addError" class="text-[11px] font-medium text-destructive" role="alert">{{ addError }}</p>
            </form>
          </li>
          <li v-else>
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground/80 transition hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              @click="startAdd(group.category)"
            >
              <Plus class="h-3 w-3" aria-hidden="true" />
              Add new activity
            </button>
          </li>
        </ul>
      </section>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
      <span v-if="query" class="text-[11px] text-muted-foreground tabular-nums">
        {{ matchCount }} of {{ templates.length }}
      </span>
      <span v-else class="text-[11px] text-muted-foreground tabular-nums">{{ templates.length }} activities</span>
      <button
        type="button"
        class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
        @click="emit('manage')"
      >
        <Plus class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        Customize
      </button>
    </div>
  </div>
</template>
