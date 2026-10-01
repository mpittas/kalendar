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

const toneOf = (color: string) => paletteOf(color);
</script>

<template>
  <Modal
    :open="open"
    title="Add Activity"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="text-xs text-muted-foreground">Tap an activity to schedule it on today's timeline.</p>
      <div class="relative">
        <input
          v-model="templateSearch"
          type="search"
          placeholder="Search activities..."
          class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <svg viewBox="0 0 20 20" class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 13l4 4" stroke-linecap="round" />
        </svg>
      </div>

      <div class="max-h-[50vh] overflow-y-auto space-y-1.5 pr-0.5">
        <button
          v-for="template in filteredTemplates"
          :key="template.id"
          type="button"
          @click="
            emit('pick-template', template);
            emit('close');
          "
          class="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left shadow-2xs transition hover:border-foreground/20 hover:bg-accent/50 active:scale-[0.99] cursor-pointer"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base shadow-2xs" :class="toneOf(template.color).dot">
              {{ template.emoji }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-foreground">{{ template.name }}</p>
              <p class="text-xs text-muted-foreground">{{ template.category }} · {{ formatDuration(template.defaultDuration) }}</p>
            </div>
          </div>
          <span class="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
            Add +
          </span>
        </button>
      </div>

      <div class="pt-3 border-t border-border flex items-center justify-between">
        <button
          type="button"
          @click="
            emit('close');
            emit('open-manager');
          "
          class="text-xs font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer"
        >
          Manage custom activities
        </button>
        <button
          type="button"
          @click="emit('close')"
          class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
</template>
