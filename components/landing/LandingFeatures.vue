<script setup lang="ts">
import { COLOR_KEYS, paletteOf } from "~/lib/colors";
import MockBlock from "~/components/landing/MockBlock.vue";

type Chip = { time: string; title: string; color: string };

// Two weeks of the month view around "today" (Thursday, October 1).
const weeks: { n: number; inMonth: boolean; total?: string; chips: Chip[]; more?: number }[][] = [
  [
    { n: 27, inMonth: false, chips: [] },
    { n: 28, inMonth: false, chips: [] },
    { n: 29, inMonth: false, chips: [] },
    { n: 30, inMonth: false, chips: [] },
    {
      n: 1,
      inMonth: true,
      total: "5h",
      chips: [
        { time: "7:00", title: "Morning routine", color: "amber" },
        { time: "9:00", title: "Working on projects", color: "indigo" },
        { time: "11:30", title: "Emails & admin", color: "slate" },
      ],
      more: 2,
    },
    {
      n: 2,
      inMonth: true,
      total: "3h 45m",
      chips: [
        { time: "7:00", title: "Morning routine", color: "amber" },
        { time: "10:00", title: "Deep clean", color: "indigo" },
        { time: "3:00", title: "Study / learning", color: "rose" },
      ],
    },
    { n: 3, inMonth: true, total: "1h", chips: [{ time: "1:00", title: "Errands", color: "pink" }] },
  ],
  [
    { n: 4, inMonth: true, chips: [] },
    {
      n: 5,
      inMonth: true,
      total: "3h",
      chips: [
        { time: "9:00", title: "Working on projects", color: "indigo" },
        { time: "6:00", title: "Workout", color: "emerald" },
      ],
    },
    { n: 6, inMonth: true, total: "1h", chips: [{ time: "8:00", title: "Meeting", color: "violet" }] },
    {
      n: 7,
      inMonth: true,
      total: "1h 45m",
      chips: [
        { time: "7:00", title: "Morning routine", color: "amber" },
        { time: "6:00", title: "Workout", color: "emerald" },
      ],
    },
    {
      n: 8,
      inMonth: true,
      total: "2h 45m",
      chips: [
        { time: "9:00", title: "Working on projects", color: "indigo" },
        { time: "12:30", title: "Meals", color: "orange" },
      ],
    },
    { n: 9, inMonth: true, total: "1h", chips: [{ time: "4:00", title: "Study / learning", color: "rose" }] },
    { n: 10, inMonth: true, total: "30m", chips: [{ time: "10:00", title: "Walk outside", color: "emerald" }] },
  ],
];

const routines = [
  { emoji: "💊", title: "Take vitamins & pills", done: true },
  { emoji: "🥤", title: "Drink protein shake", done: false },
  { emoji: "🚿", title: "Morning shower", done: true },
  { emoji: "💧", title: "Drink 2L water", done: false },
  { emoji: "🧘", title: "10 min stretch / meditate", done: true },
];

const details = [
  {
    title: "Quarter-hour precision",
    text: "Blocks move and resize in 15-minute steps.",
    icon: "M10 5.5V10l3 2M17 10a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    title: "Overlaps side by side",
    text: "Two things at once sit next to each other.",
    icon: "M3.5 4.5h5v11h-5zM11.5 4.5h5v7h-5z",
  },
  {
    title: "Keyboard friendly",
    text: "Focus a block, nudge it with the arrow keys.",
    icon: "M10 4v12M6 8l4-4 4 4M6 12l4 4 4-4",
  },
  {
    title: "Light and dark",
    text: "Follows your system, or pick a side.",
    icon: "M10 3a7 7 0 100 14V3zM10 3a7 7 0 010 14",
  },
];
</script>

<template>
  <section id="features" class="scroll-mt-16 border-t border-border/60 bg-background py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-5 sm:px-8">
      <div data-reveal class="mx-auto max-w-2xl text-center">
        <h2 class="text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.04]">
          Everything a day needs. <span class="block text-muted-foreground">Nothing it doesn't.</span>
        </h2>
        <p class="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          A calendar, a timeline and the small daily things that keep you on track, together in one calm place.
        </p>
      </div>

      <div class="mt-14 grid gap-5 sm:mt-16 lg:grid-cols-3">
        <!-- Month view -->
        <article data-reveal class="lift-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs lg:col-span-2">
          <div class="px-6 pt-6 sm:px-7 sm:pt-7">
            <h3 class="text-lg font-semibold tracking-tight text-foreground">See the whole month</h3>
            <p class="mt-1.5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Every date lists its blocks with start times. Spot the packed days and the open ones, then jump into any of them.
            </p>
          </div>
          <div aria-hidden="true" class="relative mt-6 flex-1 overflow-hidden pl-6 sm:pl-7">
            <div class="scene w-[50rem] origin-top-left overflow-hidden rounded-tl-xl border-l border-t border-border bg-card shadow-xs [mask-image:linear-gradient(to_bottom,black_70%,transparent)] max-sm:-translate-x-[19rem]">
              <div class="grid grid-cols-7 border-b border-border bg-muted/40">
                <span
                  v-for="label in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
                  :key="label"
                  class="py-2 text-center font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >{{ label }}</span>
              </div>
              <div v-for="(week, w) in weeks" :key="w" class="grid grid-cols-7">
                <div
                  v-for="day in week"
                  :key="day.n"
                  :class="[
                    'flex h-32 flex-col gap-1.5 border-b border-r border-border/60 p-2',
                    !day.inMonth ? 'bg-muted/20 opacity-60' : 'bg-card',
                  ]"
                >
                  <span class="flex items-center justify-between">
                    <span
                      :class="[
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                        day.inMonth && day.n === 1 ? 'bg-primary font-bold text-primary-foreground shadow-xs' : day.inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                      ]"
                    >{{ day.n }}</span>
                    <span v-if="day.total" class="font-mono text-[10px] text-muted-foreground tabular-nums">{{ day.total }}</span>
                  </span>
                  <span
                    v-for="chip in day.chips"
                    :key="chip.title + chip.time"
                    :class="['flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium shadow-2xs', paletteOf(chip.color).chip]"
                  >
                    <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', paletteOf(chip.color).dot]" />
                    <span class="font-mono text-[10px] opacity-75">{{ chip.time }}</span>
                    <span class="truncate">{{ chip.title }}</span>
                  </span>
                  <span v-if="day.more" class="self-start rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    +{{ day.more }} more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- Activity library -->
        <article data-reveal class="lift-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs [--reveal-delay:80ms] [--tint:#8b5cf6]">
          <div class="px-6 pt-6 sm:px-7 sm:pt-7">
            <h3 class="text-lg font-semibold tracking-tight text-foreground">Activities you reuse</h3>
            <p class="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
              Save what you do with an emoji, a color and a usual length. Make it once, drag it in any day.
            </p>
          </div>
          <div aria-hidden="true" class="stage m-2 mt-6 flex flex-1 items-center justify-center rounded-xl p-5">
            <div class="scene w-full max-w-[18rem] space-y-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div class="flex items-center gap-2.5">
                <span :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base', paletteOf('violet').icon]">🎹</span>
                <span class="flex h-9 flex-1 items-center rounded-md border border-foreground/40 bg-background px-2.5 text-sm text-foreground ring-2 ring-foreground/5">
                  Piano practice<span class="feature-caret ml-px h-4 w-px bg-foreground" />
                </span>
              </div>
              <div>
                <p class="text-[11px] font-medium text-muted-foreground">Color</p>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    v-for="key in COLOR_KEYS"
                    :key="key"
                    :class="[
                      'h-5 w-5 rounded-full',
                      paletteOf(key).swatch,
                      key === 'violet' ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : '',
                    ]"
                  />
                </div>
              </div>
              <div>
                <p class="text-[11px] font-medium text-muted-foreground">Usual length</p>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    v-for="length in ['15m', '30m', '45m', '1h', '1h 30m']"
                    :key="length"
                    :class="[
                      'rounded-md border px-2 py-0.5 font-mono text-[11px]',
                      length === '45m' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                    ]"
                  >{{ length }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                <span class="text-muted-foreground">Category</span>
                <span class="flex items-center gap-1.5 font-medium text-foreground">
                  <span class="h-2 w-2 rounded-full bg-rose-500" /> Growth
                </span>
              </div>
            </div>
          </div>
        </article>

        <!-- Routines -->
        <article data-reveal class="lift-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs [--tint:#10b981]">
          <div aria-hidden="true" class="stage m-2 flex h-52 items-center justify-center rounded-xl px-4">
            <div class="scene flex max-w-[17rem] flex-wrap justify-center gap-1.5">
              <span
                v-for="routine in routines"
                :key="routine.title"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-2xs',
                  routine.done ? 'border-border/60 bg-muted/60 text-muted-foreground line-through' : 'border-border bg-card text-foreground',
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
              <span class="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                <svg viewBox="0 0 20 20" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 4v12M4 10h12" stroke-linecap="round" />
                </svg>
                Manage
              </span>
            </div>
          </div>
          <div class="px-5 pb-6 pt-4 sm:px-6">
            <h3 class="text-lg font-semibold tracking-tight text-foreground">Daily routines</h3>
            <p class="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
              Vitamins, water, a stretch. Tick off the small habits that repeat every day, right above your timeline.
            </p>
          </div>
        </article>

        <!-- Notes -->
        <article data-reveal class="lift-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs [--reveal-delay:80ms] [--tint:#f59e0b]">
          <div aria-hidden="true" class="stage m-2 flex h-52 items-center justify-center rounded-xl px-4">
            <div class="scene w-full max-w-[16rem] -rotate-1 rounded-xl border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground shadow-sm">
              <p class="text-[15px] font-semibold tracking-tight">Thursday</p>
              <ul class="mt-2 space-y-1">
                <li class="flex items-center gap-2 text-muted-foreground line-through">
                  <span class="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-foreground text-background">
                    <svg viewBox="0 0 16 16" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3.5 8.5l3 3 6-6" />
                    </svg>
                  </span>
                  Call the dentist
                </li>
                <li class="flex items-center gap-2">
                  <span class="h-3.5 w-3.5 rounded-[4px] border border-muted-foreground/50" />
                  Book train for Friday
                </li>
              </ul>
              <p class="mt-2.5"><strong class="font-semibold">Idea:</strong> batch all errands on Saturday.</p>
              <p class="mt-1 text-muted-foreground">Dinner: <span class="text-foreground underline underline-offset-2">pasta al limone</span></p>
            </div>
          </div>
          <div class="px-5 pb-6 pt-4 sm:px-6">
            <h3 class="text-lg font-semibold tracking-tight text-foreground">A note for every day</h3>
            <p class="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
              Thoughts, links and quick to-dos in a markdown note that lives on its date.
            </p>
          </div>
        </article>

        <!-- Phone -->
        <article data-reveal class="lift-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs [--reveal-delay:160ms] [--tint:#0ea5e9]">
          <div aria-hidden="true" class="stage m-2 flex h-52 justify-center overflow-hidden rounded-xl">
            <div class="scene mt-5 h-[19rem] w-44 shrink-0 origin-top rounded-[1.9rem] border-[5px] border-zinc-900 bg-background shadow-lg dark:border-zinc-950">
              <div class="relative h-full overflow-hidden rounded-[1.55rem]">
                <div class="flex items-center justify-between px-4 pt-2 font-mono text-[8px] font-semibold text-foreground">
                  <span>9:41</span>
                  <span class="h-1.5 w-3 rounded-[2px] border border-foreground/70" />
                </div>
                <div class="border-b border-border px-3 pb-1.5 pt-1.5">
                  <p class="text-[10px] font-semibold text-foreground">Thu, Oct 1</p>
                  <p class="font-mono text-[7px] text-muted-foreground">4h planned · 1/4 done</p>
                </div>
                <div class="space-y-1 px-2 pt-2">
                  <div class="h-7 [&_p]:text-[9px] [&>div]:rounded-md"><MockBlock compact done emoji="☀️" title="Morning routine" color="amber" /></div>
                  <div class="h-12 [&_p]:text-[9px] [&>div]:rounded-md"><MockBlock compact emoji="🛠️" title="Working on projects" color="indigo" /></div>
                </div>
                <!-- Bottom sheet -->
                <div class="absolute inset-0 top-[5.4rem] bg-zinc-950/25" />
                <div class="absolute inset-x-0 bottom-0 top-[6.6rem] rounded-t-2xl border-t border-border bg-card px-2.5 pt-1.5 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.35)]">
                  <span class="mx-auto block h-1 w-8 rounded-full bg-muted-foreground/30" />
                  <p class="mt-1.5 text-[10px] font-semibold text-foreground">Activities</p>
                  <div class="mt-1.5 space-y-1">
                    <div
                      v-for="item in [
                        { emoji: '🏋️', title: 'Workout', length: '1h', color: 'emerald' },
                        { emoji: '🚶', title: 'Walk outside', length: '30m', color: 'emerald' },
                        { emoji: '📚', title: 'Study / learning', length: '1h', color: 'rose' },
                      ]"
                      :key="item.title"
                      class="flex items-center gap-1.5 rounded-md border border-border/70 px-1.5 py-1"
                    >
                      <span :class="['flex h-4 w-4 items-center justify-center rounded text-[8px]', paletteOf(item.color).icon]">{{ item.emoji }}</span>
                      <span class="flex-1 truncate text-[9px] font-medium text-foreground">{{ item.title }}</span>
                      <span class="font-mono text-[8px] text-muted-foreground">{{ item.length }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="px-5 pb-6 pt-4 sm:px-6">
            <h3 class="text-lg font-semibold tracking-tight text-foreground">At home on your phone</h3>
            <p class="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
              Bottom sheets, big tap targets, press and hold to move a block. Planning on the go feels native.
            </p>
          </div>
        </article>
      </div>

      <!-- Smaller details -->
      <ul data-reveal class="mt-5 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="detail in details" :key="detail.title" class="bg-card p-5 sm:p-6">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-canvas text-foreground shadow-2xs">
            <svg viewBox="0 0 20 20" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path :d="detail.icon" />
            </svg>
          </span>
          <h3 class="mt-4 text-[15px] font-semibold tracking-tight text-foreground">{{ detail.title }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">{{ detail.text }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.feature-caret {
  display: inline-block;
  animation: feature-caret 1.1s steps(1) infinite;
}
@keyframes feature-caret {
  50% {
    opacity: 0;
  }
}
</style>
