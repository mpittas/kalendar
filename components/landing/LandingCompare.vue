<script setup lang="ts">
import { formatDuration, formatTime, gutterLabel } from "~/lib/time";
import MockBlock from "~/components/landing/MockBlock.vue";

const START = 9 * 60;
const END = 19 * 60;
const SLOT = 22; // px per half hour
const rows = Array.from({ length: (END - START) / 30 }, (_, i) => START + i * 30);

// The same six tasks, first as a list and then given a time.
const tasks = [
  { emoji: "🛠️", title: "Finish the project draft", color: "indigo", start: 9 * 60, duration: 120 },
  { emoji: "📬", title: "Answer emails", color: "slate", start: 11 * 60, duration: 30 },
  { emoji: "🛒", title: "Groceries", color: "pink", start: 13 * 60, duration: 60 },
  { emoji: "🧽", title: "Clean the kitchen", color: "violet", start: 14 * 60 + 30, duration: 45 },
  { emoji: "🏋️", title: "Gym", color: "emerald", start: 17 * 60, duration: 60 },
  { emoji: "📖", title: "Read 20 pages", color: "rose", start: 18 * 60 + 30, duration: 30 },
];
const listOrder = [4, 1, 0, 5, 2, 3].map((i) => tasks[i]);
const planned = tasks.reduce((sum, task) => sum + task.duration, 0);
</script>

<template>
  <section id="why" class="scroll-mt-16 border-t border-border/60 bg-canvas py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-5 sm:px-8">
      <div data-reveal class="mx-auto max-w-2xl text-center">
        <h2 class="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">
          A to-do list says what. A timeline says when.
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Lists only grow, because nothing on them has a time. Give each task a slot and you'll see whether your day
          actually fits, before it starts.
        </p>
      </div>

      <div class="mx-auto mt-14 grid max-w-4xl items-center gap-4 sm:mt-16 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6">
        <!-- Before: a list -->
        <div data-reveal class="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-foreground">To-do</p>
            <span class="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{{ tasks.length }}</span>
          </div>
          <ul class="mt-4 flex-1 divide-y divide-border/70">
            <li v-for="task in listOrder" :key="task.title" class="flex items-center gap-3 py-3 text-[15px] text-muted-foreground">
              <span class="h-4.5 w-4.5 shrink-0 rounded-full border-[1.5px] border-muted-foreground/40" />
              {{ task.title }}
            </li>
          </ul>
          <p class="mt-4 flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-2.5 text-[13px] text-muted-foreground">
            <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <circle cx="10" cy="10" r="7" />
              <path d="M8 8a2 2 0 113 1.7c-.6.4-1 .8-1 1.5M10 14h.01" stroke-linecap="round" />
            </svg>
            No times, no order. Does it all fit?
          </p>
        </div>

        <!-- Arrow -->
        <div data-reveal class="flex justify-center [--reveal-delay:80ms]" aria-hidden="true">
          <span class="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs">
            <svg viewBox="0 0 20 20" class="h-4 w-4 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>

        <!-- After: the same tasks on a timeline -->
        <div data-reveal class="rounded-2xl border border-border bg-card p-5 shadow-sm [--reveal-delay:160ms] sm:p-6">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-foreground">Thursday</p>
            <span class="font-mono text-[11px] tabular-nums text-muted-foreground">{{ formatDuration(planned) }} planned · {{ formatDuration(END - START - planned) }} free</span>
          </div>
          <div class="mt-5 flex" role="img" :aria-label="`The same six tasks placed on a timeline from 9 AM to 7 PM, ${formatDuration(planned)} planned.`">
            <div class="w-12 shrink-0 border-r border-border pr-2 text-right" aria-hidden="true">
              <div v-for="minute in rows" :key="minute" class="relative" :style="{ height: `${SLOT}px` }">
                <span v-if="gutterLabel(minute)" class="absolute -top-2 right-0 font-mono text-[10px] text-muted-foreground">
                  {{ gutterLabel(minute) }}
                </span>
              </div>
            </div>
            <div class="relative flex-1 border-t border-border" aria-hidden="true">
              <div
                v-for="minute in rows"
                :key="minute"
                :style="{ height: `${SLOT}px` }"
                :class="['border-b', (minute + 30) % 60 === 0 ? 'border-border/70' : 'border-dashed border-border/30']"
              />
              <div
                v-for="task in tasks"
                :key="task.title"
                class="absolute left-[2%] w-[96%]"
                :style="{
                  top: `${((task.start - START) / 30) * SLOT + 2}px`,
                  height: `${(task.duration / 30) * SLOT - 4}px`,
                }"
              >
                <MockBlock
                  :emoji="task.emoji"
                  :title="task.title"
                  :color="task.color"
                  :compact="task.duration < 60"
                  :meta="task.duration >= 120 ? `${formatTime(task.start)} – ${formatTime(task.start + task.duration)}` : undefined"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
