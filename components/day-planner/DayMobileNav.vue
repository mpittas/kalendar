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

const tab =
  "relative flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg text-muted-foreground transition hover:text-foreground active:bg-muted/60 short:min-h-11 short:flex-row short:gap-2";
</script>

<template>
  <nav
    aria-label="Day tools"
    class="z-30 flex shrink-0 items-center justify-around gap-1 border-t border-border bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-1.5 short:pt-1 lg:hidden"
  >
    <button type="button" :class="tab" @click="emit('open-sheet', 'activities')">
      <svg viewBox="0 0 20 20" class="h-6 w-6 text-foreground short:h-5 short:w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
        <path d="M4 6h12M4 10h12M4 14h8" stroke-linecap="round" />
      </svg>
      <span class="text-[11px] font-medium">Activities</span>
    </button>

    <button
      type="button"
      class="flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold short:h-10 text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
      @click="emit('create-block')"
    >
      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M10 4v12M4 10h12" stroke-linecap="round" />
      </svg>
      <span>Schedule</span>
    </button>

    <button type="button" :class="tab" @click="emit('open-sheet', 'checklist')">
      <svg viewBox="0 0 20 20" class="h-6 w-6 text-foreground short:h-5 short:w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
        <path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="text-[11px] font-medium">Checklist</span>
      <span
        v-if="checklistStats.total > 0"
        class="absolute right-1/2 top-0.5 flex h-4 min-w-4 translate-x-[calc(50%+18px)] items-center short:static short:translate-x-0 justify-center rounded-full px-1 font-mono text-[10px] font-bold tabular-nums shadow-xs"
        :class="checklistStats.done === checklistStats.total ? 'bg-emerald-600 text-white' : 'bg-foreground text-background'"
      >
        {{ checklistStats.done }}/{{ checklistStats.total }}
      </span>
    </button>

    <button type="button" :class="tab" @click="emit('open-sheet', 'notes')">
      <svg viewBox="0 0 20 20" class="h-6 w-6 text-foreground short:h-5 short:w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
        <path d="M5 3h8l3 3v11H5V3zM8 9h5M8 13h5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="text-[11px] font-medium">Notes</span>
      <span
        v-if="hasNotes"
        class="absolute right-1/2 top-1.5 h-2 w-2 translate-x-[calc(50%+14px)] rounded-full bg-primary short:static short:translate-x-0"
        aria-label="Has notes"
      />
    </button>
  </nav>
</template>
