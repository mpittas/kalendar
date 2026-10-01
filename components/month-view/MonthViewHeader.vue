<script setup lang="ts">
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
  <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center gap-2">
        <!-- Interactive Month & Year title button -->
        <button
          type="button"
          @click="emit('open-selector')"
          class="group inline-flex items-center gap-2 rounded-xl py-1 px-1.5 -ml-1.5 text-2xl font-bold tracking-tight text-foreground transition hover:bg-muted/70 cursor-pointer sm:text-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-haspopup="dialog"
          :aria-expanded="isDateSelectorOpen"
          title="Click to select month, year, or jump to exact date"
        >
          <span>{{ monthTitle(month) }}</span>
          <span
            class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-2xs transition group-hover:border-foreground/30 group-hover:text-foreground sm:h-8 sm:w-8"
          >
            <svg
              viewBox="0 0 20 20"
              class="h-4 w-4 transition-transform duration-200"
              :class="isDateSelectorOpen ? 'rotate-180 text-foreground' : ''"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 7.5l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
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
      <div class="inline-flex h-9 items-center rounded-xl border border-border bg-card p-0.5 shadow-2xs">
        <!-- Previous Month (<) -->
        <NuxtLink
          :to="`/?m=${addMonths(month, -1).slice(0, 7)}`"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          title="Previous month"
          aria-label="Previous month"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </NuxtLink>

        <!-- Today Button -->
        <NuxtLink
          :to="`/?m=${today.slice(0, 7)}`"
          class="flex h-8 items-center px-2.5 rounded-lg text-xs font-semibold transition"
          :class="isCurrentMonth
            ? 'bg-muted text-muted-foreground cursor-default'
            : 'text-foreground hover:bg-muted'"
          title="Go to current month"
        >
          Today
        </NuxtLink>

        <!-- Next Month (>) -->
        <NuxtLink
          :to="`/?m=${addMonths(month, 1).slice(0, 7)}`"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          title="Next month"
          aria-label="Next month"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </NuxtLink>

        <div class="h-4 w-px bg-border mx-0.5" />

        <!-- Date Picker Button (Opens Modal) -->
        <button
          type="button"
          @click="emit('open-selector')"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          title="Jump to date"
          aria-label="Jump to date"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 8h14M7 2v4M13 2v4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
