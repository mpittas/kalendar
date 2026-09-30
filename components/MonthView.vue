<script setup lang="ts">
import { computed } from "vue";
import type { ScheduledTask } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import {
  addDaysISO,
  addMonths,
  formatDuration,
  formatTime,
  isSameMonth,
  longDate,
  monthMatrix,
  monthTitle,
  parseISODate,
  todayISO,
  WEEKDAY_LABELS,
} from "~/lib/time";

const props = defineProps<{
  month: string;
  tasks: ScheduledTask[];
}>();

const today = todayISO();
const MAX_VISIBLE = 3;

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
    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: isSameMonth(iso, props.month),
      isToday: iso === today,
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
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {{ monthTitle(month) }}
        </h1>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-2xs">
            <span class="h-2 w-2 rounded-full bg-slate-900" />
            <span class="font-mono font-semibold">{{ monthStats.blocks }}</span> blocks
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-2xs">
            <span class="h-2 w-2 rounded-full bg-indigo-500" />
            <span class="font-mono font-semibold">{{ monthStats.hours }}h</span> planned
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-2xs">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            <span class="font-mono font-semibold">{{ monthStats.done }}</span> completed
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
          :to="`/?m=${addMonths(month, -1).slice(0, 7)}`"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Previous month"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </NuxtLink>
        <NuxtLink
          :to="`/?m=${today.slice(0, 7)}`"
          class="rounded-lg border border-slate-200/80 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
        >
          Today
        </NuxtLink>
        <NuxtLink
          :to="`/?m=${addMonths(month, 1).slice(0, 7)}`"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Next month"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </NuxtLink>
        <NuxtLink
          :to="`/day/${today}`"
          class="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-2xs transition hover:bg-slate-800"
        >
          Open today
        </NuxtLink>
      </div>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1fr_19rem]">
      <!-- Calendar Grid -->
      <div class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div class="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70">
          <div
            v-for="label in WEEKDAY_LABELS"
            :key="label"
            class="py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-slate-400"
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
              'group relative flex min-h-[6.5rem] flex-col gap-1 border-b border-r border-slate-100 p-2 transition hover:bg-slate-50/80 sm:min-h-[7.5rem]',
              !day.inMonth ? 'bg-slate-50/40 opacity-70' : day.isWeekend ? 'bg-slate-50/30' : 'bg-white',
            ]"
          >
            <span class="flex items-center justify-between">
              <span
                :class="[
                  'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums transition',
                  day.isToday
                    ? 'bg-slate-900 text-white shadow-xs'
                    : day.inMonth
                      ? 'text-slate-700 group-hover:text-slate-900'
                      : 'text-slate-400',
                ]"
              >
                {{ day.dayNumber }}
              </span>
              <span v-if="day.total" class="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                {{ day.total }}
              </span>
            </span>

            <span class="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden pt-1">
              <span
                v-for="task in day.visible"
                :key="task.id"
                :class="[
                  'flex items-center gap-1.5 truncate rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums shadow-2xs transition',
                  toneOf(task.color).chip,
                  task.completed ? 'line-through text-slate-600 opacity-80' : '',
                ]"
              >
                <span :class="['h-2 w-2 shrink-0 rounded-full', toneOf(task.color).dot]" />
                <span class="hidden font-mono text-xs opacity-75 sm:inline">{{ formatTime(task.startMinutes) }}</span>
                <span class="truncate">{{ task.title }}</span>
              </span>
              <span
                v-if="day.hidden"
                class="self-start rounded bg-slate-100/90 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-500 tabular-nums"
              >
                +{{ day.hidden }} more
              </span>
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Right sidebar -->
      <aside class="space-y-4">
        <section class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900">Upcoming</h2>
            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-600">
              Next 14 days
            </span>
          </div>
          <p v-if="upcoming.length === 0" class="mt-4 text-sm text-slate-400">
            Nothing scheduled yet. Open a date and drop activities onto the timeline.
          </p>
          <ul v-else class="mt-3 space-y-1.5">
            <li v-for="task in upcoming" :key="task.id">
              <NuxtLink
                :to="`/day/${task.day}`"
                class="group flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-2.5 transition hover:border-slate-300 hover:bg-slate-50 shadow-2xs hover:shadow-xs"
              >
                <span
                  :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', toneOf(task.color).dot]"
                />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                    {{ task.emoji }} {{ task.title }}
                  </span>
                  <span class="block font-mono text-xs text-slate-500 tabular-nums">
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

        <section class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900">Tips</h2>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li class="flex items-start gap-2">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>Click any date cell to plan that day's schedule</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>Drag activities directly onto the timeline grid</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <span>Click a block to edit it, or hover it to remove it</span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>
