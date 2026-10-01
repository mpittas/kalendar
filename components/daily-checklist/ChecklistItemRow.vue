<script setup lang="ts">
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
</script>

<template>
  <div
    class="group relative flex items-center gap-2.5 rounded-lg border border-transparent p-2 transition hover:border-border hover:bg-accent/40"
    :class="{ 'opacity-60': completed }"
  >
    <!-- Toggle checkbox -->
    <button
      type="button"
      @click="emit('toggle', item.id)"
      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border transition shadow-2xs cursor-pointer"
      :class="completed
        ? 'border-emerald-600 bg-emerald-600 text-white'
        : 'border-input bg-background hover:border-foreground/50 text-transparent'"
      :aria-label="completed ? `Mark ${item.title} as pending` : `Mark ${item.title} as completed`"
    >
      <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 10l3.5 3.5L15 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <!-- Emoji -->
    <span
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-sm shadow-2xs select-none"
    >
      {{ item.emoji }}
    </span>

    <!-- Title -->
    <span
      @click="emit('toggle', item.id)"
      class="min-w-0 flex-1 cursor-pointer select-none text-sm transition"
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

    <!-- Actions -->
    <div class="flex items-center gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
      <button
        v-if="item.scope === 'default'"
        type="button"
        @click="emit('edit', item)"
        class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
        title="Edit item (all days)"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
      <button
        v-if="item.scope === 'default'"
        type="button"
        @click="emit('skip', item, true)"
        class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
        title="Skip on this day only"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10" cy="10" r="7" />
          <path d="M5 15L15 5" stroke-linecap="round" />
        </svg>
      </button>
      <button
        type="button"
        @click="emit('remove', item)"
        class="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        :title="item.scope === 'day' ? 'Remove from this day' : 'Delete from all days'"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 7v9a2 2 0 002 2h4a2 2 0 002-2V7M4 7h12M9 4h2a1 1 0 011 1v1H8V5a1 1 0 011-1z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
