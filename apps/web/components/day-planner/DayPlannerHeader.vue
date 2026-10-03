<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from "lucide-vue-next";
import { addDaysISO, formatDuration, longDate, mediumDate } from "@klndr/core";

defineProps<{
  day: string;
  isToday: boolean;
  today: string;
  stats: { scheduled: number; count: number; done: number };
  flash: string | null;
}>();

const emit = defineEmits<{
  (e: "create-block"): void;
}>();
</script>

<template>
  <header class="relative flex h-14 shrink-0 items-center justify-between gap-2 short:h-11 border-b border-border bg-background pl-1.5 pr-3 sm:h-12 sm:gap-3 sm:px-5">
    <div class="flex min-w-0 items-center gap-1 sm:gap-2">
      <div class="flex shrink-0 items-center">
        <NuxtLink
          :to="`/day/${addDaysISO(day, -1)}`"
          class="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground active:bg-muted short:h-10 short:w-10 sm:h-7 sm:w-7"
          aria-label="Previous day"
        >
          <ChevronLeft class="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          :to="`/day/${addDaysISO(day, 1)}`"
          class="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground active:bg-muted short:h-10 short:w-10 sm:h-7 sm:w-7"
          aria-label="Next day"
        >
          <ChevronRight class="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
        </NuxtLink>
      </div>

      <div class="min-w-0">
        <h1 class="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground sm:text-sm">
          <span class="sm:hidden">{{ mediumDate(day) }}</span>
          <span class="hidden sm:inline">{{ longDate(day) }}</span>
        </h1>
        <p class="truncate font-mono text-[11px] leading-tight tabular-nums text-muted-foreground">
          {{ formatDuration(stats.scheduled) }} planned · {{ stats.done }}/{{ stats.count }} done
        </p>
      </div>

      <NuxtLink
        v-if="!isToday"
        :to="`/day/${today}`"
        class="flex h-9 shrink-0 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted active:bg-muted sm:h-auto sm:px-2 sm:py-1"
      >
        Today
      </NuxtLink>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <button
        type="button"
        @click="emit('create-block')"
        class="hidden h-7 cursor-pointer items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 lg:inline-flex"
      >
        <Plus class="h-3.5 w-3.5" />
        Task
      </button>
    </div>

    <!-- Floats over the timeline so feedback never makes the header taller -->
    <p
      v-if="flash"
      role="status"
      aria-live="polite"
      class="pointer-events-none absolute left-1/2 top-full z-30 mt-2 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 truncate rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background shadow-md"
    >
      {{ flash }}
    </p>
  </header>
</template>
