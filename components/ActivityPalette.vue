<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { ActivityTemplate } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { formatDuration } from "~/lib/time";

const props = defineProps<{
  templates: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "pick", template: ActivityTemplate): void;
  (e: "drag-start", template: ActivityTemplate): void;
  (e: "drag-end"): void;
  (e: "manage"): void;
}>();

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

const groups = computed(() => {
  const map = new Map<string, ActivityTemplate[]>();
  for (const template of props.templates) {
    if (
      query.value &&
      !template.name.toLowerCase().includes(query.value) &&
      !template.category.toLowerCase().includes(query.value)
    ) {
      continue;
    }
    const list = map.get(template.category) ?? [];
    list.push(template);
    map.set(template.category, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({ category, items, color: items[0].color }));
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
  collapsed.value = allCollapsed.value ? [] : [...new Set(props.templates.map((t) => t.category))];
};

const clearSearch = () => {
  search.value = "";
  searchRef.value?.focus();
};

const onDragStart = (event: DragEvent, template: ActivityTemplate) => {
  emit("drag-start", template);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-dayforge-template", String(template.id));
  }
};
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Search -->
    <div class="px-3 pb-1 pt-2.5">
      <div class="relative">
        <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.5 13.5L17 17" stroke-linecap="round" />
        </svg>
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
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="mt-2 flex items-center justify-between px-0.5 text-[11px] text-muted-foreground">
        <span>Drag onto the timeline, or click to add</span>
        <button
          v-if="!query && groups.length > 1"
          type="button"
          class="font-medium transition hover:text-foreground cursor-pointer"
          @click="toggleAll"
        >
          {{ allCollapsed ? "Expand all" : "Collapse all" }}
        </button>
      </div>
    </div>

    <!-- Activities, grouped by category -->
    <div class="flex-1 space-y-1 overflow-y-auto px-2 pb-3 pt-1">
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

      <section v-for="group in groups" :key="group.category">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground transition hover:text-foreground cursor-pointer"
          :aria-expanded="isOpen(group.category)"
          @click="toggleGroup(group.category)"
        >
          <svg
            viewBox="0 0 20 20"
            class="h-3.5 w-3.5 shrink-0 transition-transform"
            :class="isOpen(group.category) ? 'rotate-90' : ''"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M7.5 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="h-2 w-2 shrink-0 rounded-full" :class="paletteOf(group.color).dot" />
          <span class="truncate">{{ group.category }}</span>
          <span class="ml-auto font-mono text-[11px] font-normal tabular-nums">{{ group.items.length }}</span>
        </button>

        <ul v-show="isOpen(group.category)" class="space-y-0.5">
          <li
            v-for="template in group.items"
            :key="template.id"
            draggable="true"
            role="button"
            tabindex="0"
            :title="`${template.name} · ${formatDuration(template.defaultDuration)}`"
            class="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 outline-none transition hover:border-border hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing"
            @dragstart="onDragStart($event, template)"
            @dragend="emit('drag-end')"
            @click="emit('pick', template)"
            @keydown.enter.prevent="emit('pick', template)"
            @keydown.space.prevent="emit('pick', template)"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-base leading-none"
              :class="paletteOf(template.color).chip"
            >
              {{ template.emoji }}
            </span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{{ template.name }}</span>
            <span class="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {{ formatDuration(template.defaultDuration) }}
            </span>
            <svg
              viewBox="0 0 20 20"
              class="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-60 group-focus-visible:opacity-60"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" />
              <circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" />
              <circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" />
            </svg>
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
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M10 4v12M4 10h12" stroke-linecap="round" />
        </svg>
        Customize
      </button>
    </div>
  </div>
</template>
