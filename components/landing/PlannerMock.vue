<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { paletteOf } from "~/lib/colors";
import { formatDuration, formatTime, gutterLabel } from "~/lib/time";
import MockBlock from "~/components/landing/MockBlock.vue";

/**
 * The hero's picture of the day planner: the activity library beside a morning on the timeline,
 * with one activity being dragged across and dropped into an open slot, on a loop.
 */

const START = 8 * 60;
const END = 13 * 60;
const SLOT = 44; // px per half hour
const NOW = 10 * 60 + 20;

const top = (minutes: number) => ((minutes - START) / 30) * SLOT;
const height = (duration: number) => (duration / 30) * SLOT - 4;
const rows = Array.from({ length: (END - START) / 30 }, (_, i) => START + i * 30);
const span = (start: number, duration: number) =>
  `${formatTime(start)} – ${formatTime(start + duration)} · ${formatDuration(duration)}`;

const blocks = [
  { emoji: "☀️", title: "Morning routine", color: "amber", start: 8 * 60, duration: 45, done: true },
  {
    emoji: "🛠️",
    title: "Working on projects",
    color: "indigo",
    start: 9 * 60,
    duration: 120,
    note: "Focused maker time on the current project.",
  },
  { emoji: "📬", title: "Emails & admin", color: "slate", start: 11 * 60, duration: 30 },
  { emoji: "🍽️", title: "Lunch", color: "orange", start: 12 * 60, duration: 45 },
];

const dropped = { emoji: "🚶", title: "Walk outside", color: "emerald", start: 11 * 60 + 30, duration: 30 };

const groups = [
  {
    name: "Daily routines",
    color: "amber",
    items: [
      { emoji: "☀️", title: "Morning routine", duration: 45 },
      { emoji: "🍽️", title: "Meals", duration: 45 },
      { emoji: "🌙", title: "Evening wind-down", duration: 30 },
    ],
  },
  {
    name: "Work",
    color: "indigo",
    items: [
      { emoji: "🛠️", title: "Working on projects", duration: 120 },
      { emoji: "📬", title: "Emails & admin", duration: 30 },
      { emoji: "👥", title: "Meeting", duration: 60 },
    ],
  },
  {
    name: "Health",
    color: "emerald",
    items: [
      { emoji: "🏋️", title: "Workout", duration: 60 },
      { emoji: "🚶", title: "Walk outside", duration: 30 },
    ],
  },
];
const collapsedGroups = [
  { name: "Home", color: "violet", count: 3 },
  { name: "Growth", color: "rose", count: 1 },
];

const routines = [
  { emoji: "💊", title: "Vitamins", done: true },
  { emoji: "💧", title: "Drink 2L water", done: false },
  { emoji: "🧘", title: "10 min stretch", done: true },
  { emoji: "🚿", title: "Morning shower", done: false },
];

const body = ref<HTMLElement | null>(null);
const source = ref<HTMLElement | null>(null);
const target = ref<HTMLElement | null>(null);
const flight = ref<Record<string, string> | null>(null);
const playing = ref(false);

const setSource = (el: unknown) => {
  if (el instanceof HTMLElement) source.value = el;
};

/** Position of `el` inside `ancestor` in layout pixels, so the hero's entrance transform can't skew it. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

// The dragged chip flies from the library item to the open slot. Both move with the layout,
// so the path is measured rather than hard-coded. Phones hide the library and skip the flight.
const measure = () => {
  const root = body.value;
  const from = source.value;
  const to = target.value;
  if (!root || !from || !to || !from.offsetParent) {
    flight.value = null;
    return;
  }
  const a = offsetWithin(from, root);
  const b = offsetWithin(to, root);
  flight.value = {
    top: `${a.y}px`,
    left: `${a.x}px`,
    width: `${from.offsetWidth}px`,
    "--dx": `${b.x - a.x + 12}px`,
    "--dy": `${b.y - a.y + (to.offsetHeight - from.offsetHeight) / 2}px`,
  };
};

let resizeObserver: ResizeObserver | undefined;
let visibilityObserver: IntersectionObserver | undefined;

onMounted(() => {
  measure();
  resizeObserver = new ResizeObserver(measure);
  if (body.value) resizeObserver.observe(body.value);
  // Only loop while the mock is on screen.
  visibilityObserver = new IntersectionObserver(([entry]) => {
    playing.value = entry.isIntersecting;
  });
  if (body.value) visibilityObserver.observe(body.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
});
</script>

<template>
  <div
    role="img"
    aria-label="The klndr. day planner: an activity library beside an hour-by-hour timeline, with a walk being dragged into an open slot at 11:30 AM."
    class="overflow-hidden rounded-2xl border border-border bg-background text-left shadow-xs"
  >
    <!-- App bar -->
    <div class="flex h-11 items-center justify-between border-b border-border px-3 sm:px-4">
      <div class="flex items-center gap-3">
        <span class="text-[15px] font-bold tracking-tight text-foreground">klndr.</span>
        <span class="hidden h-7 items-center rounded-lg bg-muted p-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          <span class="px-2.5 py-1">Calendar</span>
          <span class="rounded-md bg-primary px-2.5 py-1 font-semibold text-primary-foreground shadow-xs">Day</span>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="flex h-7 w-7 items-center justify-center rounded-md border border-input text-foreground">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
        <span class="flex h-7 items-center gap-1.5 rounded-md border border-input px-1 text-[11px] font-medium text-foreground sm:pr-2">
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">AL</span>
          <span class="hidden sm:inline">Alex</span>
        </span>
      </div>
    </div>

    <div ref="body" class="relative grid md:grid-cols-[15rem_minmax(0,1fr)]" :class="{ 'is-playing': playing }">
      <!-- Activity library -->
      <aside class="hidden flex-col border-r border-border bg-background md:flex">
        <div class="flex items-center gap-0.5 whitespace-nowrap border-b border-border px-2 py-2 text-[11px] font-medium text-muted-foreground">
          <span class="rounded-md bg-muted px-2 py-1 font-semibold text-foreground">
            Activities <span class="ml-0.5 font-mono font-medium text-muted-foreground">12</span>
          </span>
          <span class="px-1.5 py-1">Checklist <span class="font-mono">2/4</span></span>
          <span class="px-1.5 py-1">Notes</span>
        </div>
        <div class="px-3 pb-2 pt-2.5">
          <div class="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground shadow-xs">
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="9" cy="9" r="5.5" />
              <path d="M13.5 13.5L17 17" stroke-linecap="round" />
            </svg>
            Search activities
          </div>
        </div>
        <div class="space-y-2 px-2 pb-3 pt-1">
          <section v-for="group in groups" :key="group.name" class="overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs">
            <div class="flex items-center justify-between gap-2 bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground">
              <span class="flex items-center gap-2">
                <svg viewBox="0 0 20 20" class="h-3 w-3 rotate-90 text-foreground" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7.5 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span :class="['h-2 w-2 rounded-full', paletteOf(group.color).dot]" />
                {{ group.name }}
              </span>
              <span class="rounded-full border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">{{ group.items.length }}</span>
            </div>
            <ul class="space-y-0.5 border-t border-border/40 p-1">
              <li
                v-for="item in group.items"
                :key="item.title"
                :ref="item.title === dropped.title ? setSource : undefined"
                :class="['flex items-center gap-2 rounded-md px-2 py-1', item.title === dropped.title ? 'mock-source' : '']"
              >
                <span :class="['flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs leading-none', paletteOf(group.color).icon]">
                  {{ item.emoji }}
                </span>
                <span class="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{{ item.title }}</span>
                <span class="font-mono text-[11px] tabular-nums text-muted-foreground">{{ formatDuration(item.duration) }}</span>
              </li>
            </ul>
          </section>
          <div
            v-for="group in collapsedGroups"
            :key="group.name"
            class="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
          >
            <span class="flex items-center gap-2">
              <svg viewBox="0 0 20 20" class="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7.5 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span :class="['h-2 w-2 rounded-full', paletteOf(group.color).dot]" />
              {{ group.name }}
            </span>
            <span class="rounded-full border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">{{ group.count }}</span>
          </div>
        </div>
      </aside>

      <div class="min-w-0">
        <!-- Day header -->
        <div class="flex h-12 items-center justify-between gap-2 border-b border-border pl-1.5 pr-3 sm:px-5">
          <div class="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <span class="flex text-muted-foreground">
              <svg viewBox="0 0 20 20" class="h-7 w-7 p-1.5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg viewBox="0 0 20 20" class="h-7 w-7 p-1.5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold leading-tight tracking-tight text-foreground">Thursday, October 1</p>
              <p class="relative font-mono text-[11px] leading-tight tabular-nums text-muted-foreground">
                <span class="mock-stat-before">4h planned · 1/4 done</span>
                <span class="mock-stat-after absolute inset-0 whitespace-nowrap">4h 30m planned · 1/5 done</span>
              </p>
            </div>
          </div>
          <span class="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 4v12M4 10h12" stroke-linecap="round" />
            </svg>
            Task
          </span>
        </div>

        <!-- Routines -->
        <div class="flex items-center gap-2 overflow-hidden border-b border-border/40 px-3 py-2.5 [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:px-5">
          <span class="flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <svg class="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Routines
          </span>
          <span
            v-for="routine in routines"
            :key="routine.title"
            :class="[
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-2xs',
              routine.done ? 'border-border/60 bg-muted/50 text-muted-foreground line-through opacity-70' : 'border-border bg-card text-foreground',
            ]"
          >
            <span
              :class="[
                'flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px]',
                routine.done ? 'border-emerald-600 bg-emerald-600 font-bold text-white' : 'border-muted-foreground/40 text-transparent',
              ]"
            >✓</span>
            {{ routine.emoji }} {{ routine.title }}
          </span>
        </div>

        <!-- Timeline -->
        <div class="flex pb-5 pr-3 pt-5 sm:pr-5">
          <div class="relative w-14 shrink-0 border-r border-border pr-1.5 sm:w-16 sm:pr-2.5">
            <div v-for="minute in rows" :key="minute" class="relative" :style="{ height: `${SLOT}px` }">
              <span
                v-if="gutterLabel(minute)"
                class="absolute -top-2.5 right-1.5 font-mono text-[11px] font-medium tracking-tight text-muted-foreground sm:right-2 sm:text-xs"
              >
                {{ gutterLabel(minute) }}
              </span>
            </div>
            <span
              class="absolute right-0.5 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-rose-500 px-1 py-0.5 font-mono text-[10px] font-bold leading-none text-white shadow-xs sm:right-1 sm:px-1.5"
              :style="{ top: `${top(NOW)}px` }"
            >
              {{ formatTime(NOW) }}
            </span>
          </div>

          <div class="relative flex-1 border-t border-border" :style="{ height: `${rows.length * SLOT}px` }">
            <div
              v-for="minute in rows"
              :key="minute"
              :style="{ height: `${SLOT}px` }"
              :class="['border-b', (minute + 30) % 60 === 0 ? 'border-border/70' : 'border-dashed border-border/30']"
            />

            <!-- Now line -->
            <div class="absolute inset-x-0 z-20 flex items-center" :style="{ top: `${top(NOW)}px` }">
              <span class="absolute -left-1 flex h-2 w-2 items-center justify-center">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <span class="h-[1.5px] w-full bg-rose-500/80" />
            </div>

            <div
              v-for="block in blocks"
              :key="block.title"
              class="absolute left-[1%] z-10 w-[98%]"
              :style="{ top: `${top(block.start) + 2}px`, height: `${height(block.duration)}px` }"
            >
              <MockBlock
                :emoji="block.emoji"
                :title="block.title"
                :color="block.color"
                :done="block.done"
                :meta="block.duration >= 90 ? span(block.start, block.duration) : undefined"
                :note="block.note"
              />
            </div>

            <!-- Where the dragged activity will land -->
            <div
              :class="['mock-ghost absolute left-[2%] z-30 flex w-[96%] items-center justify-center rounded-lg border border-dashed', paletteOf(dropped.color).ghost]"
              :style="{ top: `${top(dropped.start)}px`, height: `${(dropped.duration / 30) * SLOT}px` }"
            >
              <span class="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs">
                {{ dropped.title }} · {{ formatTime(dropped.start) }}
              </span>
            </div>

            <div
              ref="target"
              class="mock-drop absolute left-[1%] z-10 w-[98%]"
              :style="{ top: `${top(dropped.start) + 2}px`, height: `${height(dropped.duration)}px` }"
            >
              <MockBlock :emoji="dropped.emoji" :title="dropped.title" :color="dropped.color" />
            </div>
          </div>
        </div>
      </div>

      <!-- The activity being dragged, with the pointer carrying it -->
      <div v-if="flight" class="mock-flight pointer-events-none absolute z-40" :style="flight">
        <div class="mock-chip flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 shadow-lg">
          <span :class="['flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs leading-none', paletteOf(dropped.color).icon]">
            {{ dropped.emoji }}
          </span>
          <span class="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{{ dropped.title }}</span>
          <span class="font-mono text-[11px] tabular-nums text-muted-foreground">{{ formatDuration(dropped.duration) }}</span>
        </div>
        <svg class="mock-cursor absolute -bottom-3.5 left-1/2 h-6 w-6 drop-shadow-md" viewBox="0 0 24 24">
          <path
            d="M5.5 3.2v15.6c0 .5.6.7.9.4l3.6-3.7 2.4 5.4c.2.4.6.6 1 .4l1.9-.9c.4-.2.6-.6.4-1l-2.4-5.3h5.1c.5 0 .7-.6.4-.9L6.4 2.8c-.3-.3-.9-.1-.9.4z"
            fill="#0a0a0a"
            stroke="#fff"
            stroke-width="1.4"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.is-playing {
  --loop: 7.5s;
}

/* Resting state: before the loop starts (and without JS) the slot is still empty. */
.mock-flight,
.mock-chip,
.mock-cursor,
.mock-ghost,
.mock-drop,
.mock-stat-after {
  opacity: 0;
}

.is-playing .mock-flight {
  animation: mock-flight var(--loop) infinite both;
}
.is-playing .mock-chip {
  animation: mock-chip var(--loop) infinite both;
}
.is-playing .mock-cursor {
  animation: mock-cursor var(--loop) infinite both;
}
.is-playing .mock-source {
  animation: mock-source var(--loop) infinite both;
}
.is-playing .mock-ghost {
  animation: mock-ghost var(--loop) infinite both;
}
.is-playing .mock-drop {
  animation: mock-drop var(--loop) infinite both;
}
.is-playing .mock-stat-before {
  animation: mock-stat-before var(--loop) infinite both;
}
.is-playing .mock-stat-after {
  animation: mock-stat-after var(--loop) infinite both;
}

@keyframes mock-flight {
  0%,
  13% {
    opacity: 1;
    transform: translate(0, 0);
    animation-timing-function: cubic-bezier(0.65, 0, 0.3, 1);
  }
  42%,
  100% {
    opacity: 1;
    transform: translate(var(--dx), var(--dy));
  }
}

@keyframes mock-chip {
  0%,
  9% {
    opacity: 0;
    scale: 1;
    rotate: 0deg;
  }
  13%,
  40% {
    opacity: 1;
    scale: 1.05;
    rotate: -2deg;
  }
  45% {
    opacity: 1;
    scale: 1;
    rotate: 0deg;
  }
  50%,
  100% {
    opacity: 0;
    scale: 0.98;
    rotate: 0deg;
  }
}

@keyframes mock-cursor {
  0% {
    opacity: 0;
    translate: 22px 26px;
    scale: 1;
  }
  6% {
    opacity: 1;
    translate: 0 0;
    scale: 1;
  }
  9% {
    scale: 0.82;
  }
  13%,
  44% {
    opacity: 1;
    translate: 0 0;
    scale: 0.9;
  }
  48% {
    scale: 1;
  }
  58% {
    opacity: 1;
    translate: 18px 20px;
  }
  64%,
  100% {
    opacity: 0;
    translate: 18px 20px;
    scale: 1;
  }
}

@keyframes mock-source {
  0%,
  4%,
  52%,
  100% {
    opacity: 1;
    background-color: transparent;
  }
  8% {
    opacity: 1;
    background-color: color-mix(in oklab, var(--accent) 80%, transparent);
  }
  13%,
  46% {
    opacity: 0.35;
    background-color: transparent;
  }
}

@keyframes mock-ghost {
  0%,
  20% {
    opacity: 0;
  }
  26%,
  44% {
    opacity: 1;
  }
  49%,
  100% {
    opacity: 0;
  }
}

@keyframes mock-drop {
  0%,
  44% {
    opacity: 0;
    scale: 0.96;
  }
  50% {
    opacity: 1;
    scale: 1.015;
  }
  55%,
  90% {
    opacity: 1;
    scale: 1;
  }
  97%,
  100% {
    opacity: 0;
    scale: 1;
  }
}

@keyframes mock-stat-before {
  0%,
  48%,
  96%,
  100% {
    opacity: 1;
  }
  50%,
  92% {
    opacity: 0;
  }
}

@keyframes mock-stat-after {
  0%,
  48%,
  96%,
  100% {
    opacity: 0;
  }
  50%,
  92% {
    opacity: 1;
  }
}

/* No loop for reduced motion: show the finished drop instead. */
@media (prefers-reduced-motion: reduce) {
  .is-playing .mock-flight,
  .is-playing .mock-chip,
  .is-playing .mock-cursor,
  .is-playing .mock-source,
  .is-playing .mock-ghost,
  .is-playing .mock-drop,
  .is-playing .mock-stat-before,
  .is-playing .mock-stat-after {
    animation: none;
  }
  .mock-flight {
    display: none;
  }
  .mock-drop,
  .mock-stat-after {
    opacity: 1;
  }
  .mock-stat-before {
    opacity: 0;
  }
}
</style>
