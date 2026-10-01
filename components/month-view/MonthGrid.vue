<script setup lang="ts">
import type { ScheduledTask } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { formatTime, WEEKDAY_LABELS } from "~/lib/time";

export type DayCell = {
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  visible: ScheduledTask[];
  hidden: number;
  total: string;
  label: string;
};

const props = defineProps<{
  days: DayCell[];
}>();

const toneOf = (color: string) => paletteOf(color);
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
    <div class="grid grid-cols-7 border-b border-border bg-muted/40">
      <div
        v-for="label in WEEKDAY_LABELS"
        :key="label"
        class="py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs"
      >
        {{ label }}
      </div>
    </div>
    <div class="grid grid-cols-7">
      <NuxtLink
        v-for="day in days"
        :key="day.iso"
        :to="`/day/${day.iso}`"
        :aria-label="day.label"
        :class="[
          'group relative flex min-h-[5rem] flex-col gap-1 border-b border-r border-border/60 p-1.5 transition hover:bg-muted/40 active:bg-muted/60 sm:min-h-[8rem] sm:gap-1.5 sm:p-2.5',
          !day.inMonth ? 'bg-muted/20 opacity-60' : day.isWeekend ? 'bg-muted/10' : 'bg-card',
        ]"
      >
        <span class="flex items-center justify-between">
          <span
            :class="[
              'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition sm:h-6 sm:w-6 sm:text-xs',
              day.isToday
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : day.inMonth
                  ? 'text-foreground group-hover:text-foreground'
                  : 'text-muted-foreground/60',
            ]"
          >
            {{ day.dayNumber }}
          </span>
          <span v-if="day.total" class="hidden font-mono text-[11px] font-medium text-muted-foreground tabular-nums sm:inline">
            {{ day.total }}
          </span>
        </span>

        <!-- Mobile task indicators: clean colored dots -->
        <div class="flex flex-wrap items-center gap-1 pt-0.5 sm:hidden">
          <span
            v-for="task in day.visible"
            :key="task.id"
            :class="['h-2 w-2 rounded-full', toneOf(task.color).dot]"
          />
          <span v-if="day.hidden" class="font-mono text-[10px] font-semibold text-muted-foreground leading-none">
            +{{ day.hidden }}
          </span>
        </div>

        <!-- Desktop task chips: full cards with time and title -->
        <span class="hidden min-h-0 flex-1 flex-col gap-1 overflow-hidden pt-0.5 sm:flex">
          <span
            v-for="task in day.visible"
            :key="task.id"
            :class="[
              'flex items-center gap-1.5 truncate rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums shadow-2xs transition',
              task.completed ? 'bg-muted/70 border-border text-muted-foreground line-through opacity-75' : toneOf(task.color).chip,
            ]"
          >
            <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', task.completed ? 'bg-muted-foreground' : toneOf(task.color).dot]" />
            <span class="font-mono text-[11px] opacity-75">{{ formatTime(task.startMinutes) }}</span>
            <span class="truncate">{{ task.title }}</span>
          </span>
          <span
            v-if="day.hidden"
            class="self-start rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground tabular-nums"
          >
            +{{ day.hidden }} more
          </span>
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
