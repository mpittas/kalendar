<script setup lang="ts">
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { addMonths, monthTitle } from "~/lib/time";

const props = defineProps<{
  month: string;
  today: string;
  isCurrentMonth: boolean;
  isDateSelectorOpen: boolean;
  monthStats: {
    blocks: number;
    hours: number;
    done: number;
  };
}>();

const emit = defineEmits<{
  (e: "open-selector"): void;
}>();
</script>

<template>
  <header class="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center gap-2">
        <!-- Interactive Month & Year title button -->
        <button
          type="button"
          @click="emit('open-selector')"
          class="group inline-flex min-h-11 items-center gap-2 rounded-xl py-1 px-1.5 -ml-1.5 text-2xl font-bold tracking-tight text-foreground transition hover:bg-muted/70 cursor-pointer sm:text-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-haspopup="dialog"
          :aria-expanded="isDateSelectorOpen"
          title="Click to select month, year, or jump to exact date"
        >
          <span>{{ monthTitle(month) }}</span>
          <span
            class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-2xs transition group-hover:border-foreground/30 group-hover:text-foreground sm:h-8 sm:w-8"
          >
            <ChevronDown class="h-4 w-4 transition-transform duration-200" :class="isDateSelectorOpen ? 'rotate-180 text-foreground' : ''" />
          </span>
        </button>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground shadow-xs">
          <span class="h-2 w-2 rounded-full bg-foreground" />
          <span class="font-mono font-semibold">{{ monthStats.blocks }}</span>
          <span class="text-muted-foreground">blocks</span>
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground shadow-xs">
          <span class="h-2 w-2 rounded-full bg-indigo-500" />
          <span class="font-mono font-semibold">{{ monthStats.hours }}h</span>
          <span class="text-muted-foreground">planned</span>
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground shadow-xs">
          <span class="h-2 w-2 rounded-full bg-emerald-500" />
          <span class="font-mono font-semibold">{{ monthStats.done }}</span>
          <span class="text-muted-foreground">completed</span>
        </span>
      </div>
    </div>

    <!-- Compact Date Navigation Control -->
    <div class="flex items-center gap-2">
      <div class="inline-flex h-12 w-full items-center rounded-xl border border-border bg-card p-0.5 shadow-2xs sm:h-9 sm:w-auto">
        <!-- Previous Month (<) -->
        <NuxtLink
          :to="`/calendar?m=${addMonths(month, -1).slice(0, 7)}`"
          class="flex h-11 w-12 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground active:bg-muted sm:h-8 sm:w-8"
          title="Previous month"
          aria-label="Previous month"
        >
          <ChevronLeft class="h-5 w-5 sm:h-4 sm:w-4" />
        </NuxtLink>

        <!-- Today Button -->
        <NuxtLink
          :to="`/calendar?m=${today.slice(0, 7)}`"
          class="flex h-11 flex-1 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition sm:h-8 sm:flex-none sm:text-xs"
          :class="isCurrentMonth
            ? 'bg-muted text-muted-foreground cursor-default'
            : 'text-foreground hover:bg-muted'"
          title="Go to current month"
        >
          Today
        </NuxtLink>

        <!-- Next Month (>) -->
        <NuxtLink
          :to="`/calendar?m=${addMonths(month, 1).slice(0, 7)}`"
          class="flex h-11 w-12 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground active:bg-muted sm:h-8 sm:w-8"
          title="Next month"
          aria-label="Next month"
        >
          <ChevronRight class="h-5 w-5 sm:h-4 sm:w-4" />
        </NuxtLink>

        <div class="mx-0.5 h-5 w-px bg-border sm:h-4" />

        <!-- Date Picker Button (Opens Modal) -->
        <button
          type="button"
          @click="emit('open-selector')"
          class="flex h-11 w-12 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground active:bg-muted sm:h-8 sm:w-8"
          title="Jump to date"
          aria-label="Jump to date"
        >
          <Calendar class="h-5 w-5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  </header>
</template>
