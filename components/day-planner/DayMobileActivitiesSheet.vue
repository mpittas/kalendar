<script setup lang="ts">
import { ref, computed } from "vue";
import type { ActivityTemplate } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { formatDuration } from "~/lib/time";

const props = defineProps<{
  open: boolean;
  templates: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "pick-template", template: ActivityTemplate): void;
  (e: "open-manager"): void;
}>();

const templateSearch = ref("");

const filteredTemplates = computed(() => {
  const q = templateSearch.value.trim().toLowerCase();
  if (!q) return props.templates;
  return props.templates.filter(
    (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
  );
});

const { colorOf } = useCategories();
const toneOf = (item: ActivityTemplate) => paletteOf(colorOf(item));
</script>

<template>
  <Modal
    :open="open"
    title="Add Activity"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">Tap an activity to schedule it on this day's timeline.</p>
      <div class="relative">
        <input
          v-model="templateSearch"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          aria-label="Search activities"
          placeholder="Search activities..."
          class="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <svg viewBox="0 0 20 20" class="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 13l4 4" stroke-linecap="round" />
        </svg>
      </div>

      <div class="max-h-[50dvh] space-y-1.5 overflow-y-auto overscroll-contain">
        <button
          v-for="template in filteredTemplates"
          :key="template.id"
          type="button"
          @click="
            emit('pick-template', template);
            emit('close');
          "
          class="group flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 text-left shadow-2xs transition hover:border-foreground/20 hover:bg-accent/50 active:bg-accent/60"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg shadow-2xs" :class="toneOf(template).dot">
              {{ template.emoji }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-foreground">{{ template.name }}</p>
              <p class="text-xs text-muted-foreground">{{ template.category }} · {{ formatDuration(template.defaultDuration) }}</p>
            </div>
          </div>
          <span class="shrink-0 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
            Add +
          </span>
        </button>
        <p v-if="filteredTemplates.length === 0" class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {{ templates.length === 0 ? "No activities yet. Create one below." : `No matches for “${templateSearch.trim()}”` }}
        </p>
      </div>

      <div class="pt-3 border-t border-border flex items-center justify-between">
        <button
          type="button"
          @click="
            emit('close');
            emit('open-manager');
          "
          class="-ml-1 min-h-11 cursor-pointer px-1 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Manage custom activities
        </button>
        <button
          type="button"
          @click="emit('close')"
          class="inline-flex h-11 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium text-foreground shadow-xs hover:bg-accent"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
</template>
