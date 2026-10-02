<script setup lang="ts">
import { AlignLeft, Check, FileText, Plus } from "lucide-vue-next";
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
  "relative flex min-h-11 flex-1 cursor-pointer flex-col items-center justify-center gap-px rounded-lg text-muted-foreground transition hover:text-foreground active:bg-muted/60 short:min-h-9 short:flex-row short:gap-2";
</script>

<template>
  <nav
    aria-label="Day tools"
    class="z-30 flex shrink-0 items-center justify-around gap-1 border-t border-border bg-background pb-[max(0.25rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-1 short:pt-0.5 lg:hidden"
  >
    <button type="button" :class="tab" @click="emit('open-sheet', 'activities')">
      <AlignLeft class="h-5 w-5 text-foreground short:h-4 short:w-4" aria-hidden="true" />
      <span class="text-[10px] font-medium">Activities</span>
    </button>

    <button
      type="button"
      class="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold short:h-8 text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
      @click="emit('create-block')"
    >
      <Plus class="h-3.5 w-3.5" aria-hidden="true" />
      <span>Schedule</span>
    </button>

    <button type="button" :class="tab" @click="emit('open-sheet', 'checklist')">
      <Check class="h-5 w-5 text-foreground short:h-4 short:w-4" aria-hidden="true" />
      <span class="text-[10px] font-medium">Checklist</span>
      <span
        v-if="checklistStats.total > 0"
        class="absolute right-1/2 top-0 flex h-3.5 min-w-3.5 translate-x-[calc(50%+14px)] items-center short:static short:translate-x-0 justify-center rounded-full px-1 font-mono text-[9px] font-bold tabular-nums shadow-xs"
        :class="checklistStats.done === checklistStats.total ? 'bg-emerald-600 text-white' : 'bg-foreground text-background'"
      >
        {{ checklistStats.done }}/{{ checklistStats.total }}
      </span>
    </button>

    <button type="button" :class="tab" @click="emit('open-sheet', 'notes')">
      <FileText class="h-5 w-5 text-foreground short:h-4 short:w-4" aria-hidden="true" />
      <span class="text-[10px] font-medium">Notes</span>
      <span
        v-if="hasNotes"
        class="absolute right-1/2 top-1 h-1.5 w-1.5 translate-x-[calc(50%+12px)] rounded-full bg-primary short:static short:translate-x-0"
        aria-label="Has notes"
      />
    </button>
  </nav>
</template>
