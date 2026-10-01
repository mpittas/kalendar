<script setup lang="ts">
import { ref } from "vue";
import type { DayChecklistItem } from "~/lib/types";

const props = defineProps<{
  item: DayChecklistItem;
  completed: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", id: string): void;
  (e: "edit", item: DayChecklistItem): void;
  (e: "skip", item: DayChecklistItem, hidden: boolean): void;
  (e: "remove", item: DayChecklistItem): void;
}>();

// On touch there is no hover to reveal the row actions, so they live behind a "more" button.
const expanded = ref(false);

const run = (action: () => void) => {
  expanded.value = false;
  action();
};
</script>

<template>
  <div
    class="group relative rounded-lg border border-transparent transition hover:border-border hover:bg-accent/40"
    :class="[{ 'opacity-60': completed }, expanded ? 'border-border bg-accent/30' : '']"
  >
    <div class="flex min-h-12 items-center gap-2.5 p-2 touch:pr-1">
      <!-- Toggle checkbox (the hit area reaches past the box on touch) -->
      <button
        type="button"
        @click="emit('toggle', item.id)"
        class="relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-xs border shadow-2xs transition after:absolute after:-inset-2 touch:h-6 touch:w-6 touch:after:-inset-2.5"
        :class="completed
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-input bg-background text-transparent hover:border-foreground/50'"
        :aria-label="completed ? `Mark ${item.title} as pending` : `Mark ${item.title} as completed`"
        :aria-pressed="completed"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 touch:h-4 touch:w-4" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M5 10l3.5 3.5L15 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- Emoji -->
      <span
        class="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-md bg-muted/60 text-sm shadow-2xs"
        aria-hidden="true"
      >
        {{ item.emoji }}
      </span>

      <!-- Title -->
      <span
        @click="emit('toggle', item.id)"
        class="min-w-0 flex-1 cursor-pointer select-none break-words py-1 text-sm transition"
        :class="completed
          ? 'text-muted-foreground line-through'
          : 'font-medium text-foreground hover:text-foreground/90'"
      >
        {{ item.title }}
      </span>

      <span
        v-if="item.scope === 'day'"
        class="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
      >
        This day
      </span>

      <!-- Hover devices: icon actions revealed on hover or focus -->
      <div class="flex items-center gap-1 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100 touch:hidden">
        <button
          v-if="item.scope === 'default'"
          type="button"
          @click="emit('edit', item)"
          class="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit item (all days)"
          aria-label="Edit item (all days)"
        >
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          v-if="item.scope === 'default'"
          type="button"
          @click="emit('skip', item, true)"
          class="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Skip on this day only"
          aria-label="Skip on this day only"
        >
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
            <path d="M5 15L15 5" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          @click="emit('remove', item)"
          class="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          :title="item.scope === 'day' ? 'Remove from this day' : 'Delete from all days'"
          :aria-label="item.scope === 'day' ? 'Remove from this day' : 'Delete from all days'"
        >
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 7v9a2 2 0 002 2h4a2 2 0 002-2V7M4 7h12M9 4h2a1 1 0 011 1v1H8V5a1 1 0 011-1z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- Touch devices: one clear button that opens labeled actions -->
      <button
        type="button"
        class="hidden h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition active:bg-accent touch:flex"
        :aria-expanded="expanded"
        :aria-label="`More actions for ${item.title}`"
        @click="expanded = !expanded"
      >
        <svg viewBox="0 0 20 20" class="h-5 w-5" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="15.5" cy="10" r="1.5" />
        </svg>
      </button>
    </div>

    <div v-if="expanded" class="hidden gap-2 px-2 pb-2 touch:flex">
      <button
        v-if="item.scope === 'default'"
        type="button"
        class="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium text-foreground shadow-xs transition active:bg-accent"
        @click="run(() => emit('edit', item))"
      >
        Edit
      </button>
      <button
        v-if="item.scope === 'default'"
        type="button"
        class="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium text-foreground shadow-xs transition active:bg-accent"
        @click="run(() => emit('skip', item, true))"
      >
        Skip this day
      </button>
      <button
        type="button"
        class="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-sm font-medium text-destructive shadow-xs transition active:bg-destructive/20"
        @click="run(() => emit('remove', item))"
      >
        {{ item.scope === "day" ? "Remove" : "Delete" }}
      </button>
    </div>
  </div>
</template>
