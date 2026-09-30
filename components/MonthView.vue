<script setup lang="ts">
import { ref, computed } from "vue";
import type { ScheduledTask } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import {
  addDaysISO,
  addMonths,
  addYears,
  formatDuration,
  formatTime,
  generateYearOptions,
  getMonthIndex,
  getYear,
  isSameMonth,
  longDate,
  MONTH_LABELS,
  monthMatrix,
  monthTitle,
  parseISODate,
  setYearMonth,
  todayISO,
  WEEKDAY_LABELS,
} from "~/lib/time";

const props = defineProps<{
  month: string;
  tasks: ScheduledTask[];
}>();

const today = todayISO();
const MAX_VISIBLE = 3;

const isDateSelectorOpen = ref(false);

const activeYear = computed(() => getYear(props.month));
const activeMonthIndex = computed(() => getMonthIndex(props.month));
const isCurrentMonth = computed(() => isSameMonth(props.month, today));

const yearOptions = computed(() => {
  const years = generateYearOptions(activeYear.value, 8);
  const currentRealYear = getYear(today);
  if (!years.includes(currentRealYear)) {
    years.push(currentRealYear);
    years.sort((a, b) => a - b);
  }
  return years;
});

const onSelectMonth = (monthIso: string) => {
  navigateTo(`/?m=${monthIso}`);
};

const onSelectDate = (dateIso: string) => {
  navigateTo(`/?m=${dateIso}`);
};

const onOpenDay = (dateIso: string) => {
  navigateTo(`/day/${dateIso}`);
};

const onMonthDropdownChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newMonthIdx = Number.parseInt(target.value, 10);
  const nextIso = setYearMonth(props.month, activeYear.value, newMonthIdx);
  navigateTo(`/?m=${nextIso.slice(0, 7)}`);
};

const onYearDropdownChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newYear = Number.parseInt(target.value, 10);
  const nextIso = setYearMonth(props.month, newYear, activeMonthIndex.value);
  navigateTo(`/?m=${nextIso.slice(0, 7)}`);
};

const byDay = computed(() => {
  const map = new Map<string, ScheduledTask[]>();
  for (const task of props.tasks) {
    const list = map.get(task.day) ?? [];
    list.push(task);
    map.set(task.day, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startMinutes - b.startMinutes);
  }
  return map;
});

const days = computed(() =>
  monthMatrix(props.month).map((iso) => {
    const date = parseISODate(iso);
    const tasks = byDay.value.get(iso) ?? [];
    const isTargetDate = props.month === iso;
    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: isSameMonth(iso, props.month),
      isToday: iso === today,
      isSelected: isTargetDate,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      visible: tasks.slice(0, MAX_VISIBLE),
      hidden: Math.max(0, tasks.length - MAX_VISIBLE),
      total: tasks.length ? formatDuration(tasks.reduce((sum, t) => sum + t.durationMinutes, 0)) : "",
      label: `${longDate(iso)}, ${tasks.length} ${tasks.length === 1 ? "block" : "blocks"}`,
    };
  }),
);

const upcoming = computed(() => {
  const end = addDaysISO(today, 14);
  return props.tasks
    .filter((task) => task.day >= today && task.day <= end)
    .sort((a, b) => a.day.localeCompare(b.day) || a.startMinutes - b.startMinutes)
    .slice(0, 6);
});

const monthStats = computed(() => {
  const inMonth = props.tasks.filter((task) => isSameMonth(task.day, props.month));
  return {
    blocks: inMonth.length,
    hours: Math.round(inMonth.reduce((sum, t) => sum + t.durationMinutes, 0) / 60),
    done: inMonth.filter((t) => t.completed).length,
  };
});

const toneOf = (color: string) => paletteOf(color);
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <!-- Interactive Month & Year title button -->
          <button
            type="button"
            @click="isDateSelectorOpen = true"
            class="group inline-flex items-center gap-2.5 rounded-xl py-1 px-1.5 -ml-1.5 text-2xl font-bold tracking-tight text-foreground transition hover:bg-muted/70 cursor-pointer sm:text-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-haspopup="dialog"
            :aria-expanded="isDateSelectorOpen"
            title="Click to select month, year, or jump to exact date"
          >
            <span>{{ monthTitle(month) }}</span>
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs transition group-hover:border-slate-300 group-hover:text-foreground sm:h-8 sm:w-8"
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

      <!-- Navigation & Date Selection Controls -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Direct Month & Year Dropdown Selectors -->
        <div class="inline-flex items-center gap-1.5">
          <!-- Month Dropdown -->
          <select
            :value="activeMonthIndex"
            @change="onMonthDropdownChange"
            class="h-9 rounded-lg border border-border bg-card px-2.5 text-xs sm:text-sm font-medium text-foreground shadow-xs transition hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            aria-label="Select month"
          >
            <option v-for="(name, idx) in MONTH_LABELS" :key="name" :value="idx">
              {{ name }}
            </option>
          </select>

          <!-- Year Dropdown -->
          <select
            :value="activeYear"
            @change="onYearDropdownChange"
            class="h-9 rounded-lg border border-border bg-card px-2 text-xs sm:text-sm font-medium text-foreground shadow-xs transition hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-mono"
            aria-label="Select year"
          >
            <option v-for="yr in yearOptions" :key="yr" :value="yr">
              {{ yr }}
            </option>
          </select>
        </div>

        <!-- Stepper Group: Prev Year (<<), Prev Month (<), Today, Next Month (>), Next Year (>>) -->
        <div class="inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
          <!-- Previous Year (<<) -->
          <NuxtLink
            :to="`/?m=${addYears(month, -1).slice(0, 7)}`"
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Previous year (-1 year)"
            aria-label="Previous year"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 15l-5-5 5-5M16 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>

          <!-- Previous Month (<) -->
          <NuxtLink
            :to="`/?m=${addMonths(month, -1).slice(0, 7)}`"
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Previous month (-1 month)"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>

          <!-- Today Button -->
          <NuxtLink
            :to="`/?m=${today.slice(0, 7)}`"
            class="flex h-8 items-center px-2.5 rounded-md text-xs sm:text-sm font-medium transition"
            :class="isCurrentMonth
              ? 'bg-foreground text-background font-semibold shadow-2xs'
              : 'text-foreground hover:bg-muted'"
            title="Go to current month"
          >
            Today
          </NuxtLink>

          <!-- Next Month (>) -->
          <NuxtLink
            :to="`/?m=${addMonths(month, 1).slice(0, 7)}`"
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Next month (+1 month)"
            aria-label="Next month"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>

          <!-- Next Year (>>) -->
          <NuxtLink
            :to="`/?m=${addYears(month, 1).slice(0, 7)}`"
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Next year (+1 year)"
            aria-label="Next year"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 15l5-5-5-5M4 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
        </div>

        <!-- Jump to Date button -->
        <button
          type="button"
          @click="isDateSelectorOpen = true"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs sm:text-sm font-medium text-foreground shadow-xs transition hover:bg-muted cursor-pointer"
          title="Open Date Navigator"
          aria-label="Open Date Navigator"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 8h14M7 2v4M13 2v4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">Jump</span>
        </button>

        <!-- Open today -->
        <NuxtLink
          :to="`/day/${today}`"
          class="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-xs sm:text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
        >
          Open today
        </NuxtLink>
      </div>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <!-- Calendar Grid -->
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
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums transition sm:h-7 sm:w-7 sm:text-sm',
                  day.isToday
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : day.inMonth
                      ? 'text-foreground group-hover:text-foreground'
                      : 'text-muted-foreground/60',
                ]"
              >
                {{ day.dayNumber }}
              </span>
              <span v-if="day.total" class="hidden font-mono text-xs font-medium text-muted-foreground tabular-nums sm:inline">
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

      <!-- Right sidebar -->
      <aside class="space-y-4">
        <section class="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-foreground">Upcoming</h2>
            <span class="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              Next 14 days
            </span>
          </div>
          <p v-if="upcoming.length === 0" class="mt-4 text-sm text-muted-foreground">
            Nothing scheduled yet. Open a date and drop activities onto the timeline.
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li v-for="task in upcoming" :key="task.id">
              <NuxtLink
                :to="`/day/${task.day}`"
                class="group flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 transition hover:border-foreground/20 hover:bg-muted/40 shadow-2xs hover:shadow-xs"
              >
                <span
                  :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', toneOf(task.color).dot]"
                />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {{ task.emoji }} {{ task.title }}
                  </span>
                  <span class="block font-mono text-xs text-muted-foreground tabular-nums">
                    {{
                      parseISODate(task.day).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    · {{ formatTime(task.startMinutes) }}
                  </span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section class="rounded-xl border border-border bg-card p-4 shadow-xs">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-foreground pb-2 border-b border-border">Tips & Shortcuts</h2>
          <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2.5">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>Click any date cell to plan that day's schedule</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>Drag activities directly onto the timeline grid</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>Click a block to edit it or toggle its completion</span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>
