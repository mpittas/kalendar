<script setup lang="ts">
import { Check } from "lucide-vue-next";
defineProps<{
  completedCount: number;
  totalCount: number;
  percentage: number;
  allDone: boolean;
}>();
</script>

<template>
  <div class="shrink-0 px-4 pb-2 pt-4">
    <p class="flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
      <template v-if="allDone">
        <Check class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        All done
      </template>
      <template v-else>
        {{ completedCount }}
        <span class="font-normal text-muted-foreground">of {{ totalCount }} done</span>
      </template>
    </p>
    <div
      class="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label="Checklist progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percentage"
    >
      <div
        class="h-full rounded-full transition-[width] duration-300"
        :class="allDone ? 'bg-emerald-500' : 'bg-foreground/80'"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
