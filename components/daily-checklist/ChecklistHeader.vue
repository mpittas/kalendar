<script setup lang="ts">
const props = defineProps<{
  completedCount: number;
  totalCount: number;
  percentage: number;
  allDone: boolean;
}>();
</script>

<template>
  <div class="px-4 pt-3 pb-3 border-b border-border">
    <div class="rounded-xl border border-border bg-card p-3 shadow-xs">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Progress</span>
        <span class="font-mono font-semibold text-foreground tabular-nums">
          {{ completedCount }} / {{ totalCount }}
          <span class="text-muted-foreground font-normal">({{ percentage }}%)</span>
        </span>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="allDone ? 'bg-emerald-500' : 'bg-primary'"
          :style="{ width: `${percentage}%` }"
        />
      </div>
      <p v-if="allDone" class="mt-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
        🎉 Everything on this list is done!
      </p>
    </div>
  </div>
</template>
