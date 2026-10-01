<script setup lang="ts">
const props = defineProps<{
  checklistStats: {
    total: number;
    done: number;
  };
  hasNotes: boolean;
}>();

const emit = defineEmits<{
  (e: "open-sheet", sheet: "activities" | "checklist" | "notes"): void;
  (e: "create-block"): void;
}>();
</script>

<template>
  <nav aria-label="Mobile navigation" class="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-4 py-2 backdrop-blur-md shadow-lg">
    <button
      type="button"
      @click="emit('open-sheet', 'activities')"
      class="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
    >
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
        <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h12M4 10h12M4 14h8" stroke-linecap="round" />
        </svg>
      </div>
      <span class="text-[11px] font-medium">Activities</span>
    </button>

    <button
      type="button"
      @click="emit('create-block')"
      class="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-95 hover:bg-primary/90 cursor-pointer"
    >
      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M10 4v12M4 10h12" stroke-linecap="round" />
      </svg>
      <span>Schedule</span>
    </button>

    <button
      type="button"
      @click="emit('open-sheet', 'checklist')"
      class="relative flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
    >
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
        <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <span class="text-[11px] font-medium">Checklist</span>
      <span
        v-if="checklistStats.total > 0"
        class="absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs"
      >
        {{ checklistStats.done }}/{{ checklistStats.total }}
      </span>
    </button>

    <button
      type="button"
      @click="emit('open-sheet', 'notes')"
      class="relative flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
    >
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
        <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 3h8l3 3v11H5V3zM8 9h5M8 13h5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <span class="text-[11px] font-medium">Notes</span>
      <span v-if="hasNotes" class="absolute right-2 top-0 h-2 w-2 rounded-full bg-primary" aria-label="Has notes" />
    </button>
  </nav>
</template>
