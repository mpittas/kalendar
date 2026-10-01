<script setup lang="ts">
import type { DayChecklistItem } from "~/lib/types";

const props = defineProps<{
  items: DayChecklistItem[];
  completedIds: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", id: string, completed: boolean): void;
  (e: "open-manager"): void;
}>();
</script>

<template>
  <div class="mx-auto max-w-4xl px-3 sm:px-6 pt-3 pb-2 border-b border-border/40">
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
      <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
        <svg class="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Routines
      </span>
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          @click="emit('toggle', item.id, !completedIds.includes(item.id))"
          class="group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-2xs transition cursor-pointer"
          :class="completedIds.includes(item.id)
            ? 'border-border/60 bg-muted/50 text-muted-foreground line-through opacity-70'
            : 'border-border bg-card text-foreground hover:bg-accent hover:border-foreground/30'"
        >
          <span
            class="flex h-3.5 w-3.5 items-center justify-center rounded-full border transition text-[9px]"
            :class="completedIds.includes(item.id)
              ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
              : 'border-muted-foreground/40 group-hover:border-foreground text-transparent'"
          >
            ✓
          </span>
          <span>{{ item.emoji }}</span>
          <span class="truncate max-w-[12rem]">{{ item.title }}</span>
        </button>
      </div>
      <button
        type="button"
        @click="emit('open-manager')"
        class="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition cursor-pointer"
        title="Manage habits"
      >
        <svg viewBox="0 0 20 20" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 4v12M4 10h12" stroke-linecap="round" />
        </svg>
        <span>Manage</span>
      </button>
    </div>
  </div>
</template>
