<script setup lang="ts">
import { paletteOf } from "~/lib/colors";
import MockBlock from "~/components/landing/MockBlock.vue";

// October 2026 starts on a Thursday, so the grid opens with the last days of September.
const DOTS: Record<number, string[]> = {
  1: ["amber", "indigo", "emerald"],
  2: ["amber", "rose"],
  5: ["indigo"],
  6: ["indigo", "emerald"],
  8: ["amber", "indigo", "violet"],
  9: ["emerald"],
  12: ["indigo", "slate"],
  13: ["emerald", "rose"],
  15: ["indigo"],
  16: ["amber", "emerald"],
  19: ["indigo", "violet"],
  20: ["emerald"],
  22: ["rose"],
  23: ["indigo", "emerald"],
  27: ["amber"],
  29: ["indigo"],
};
const cells = [
  ...[27, 28, 29, 30].map((n) => ({ n, inMonth: false, dots: [] as string[] })),
  ...Array.from({ length: 31 }, (_, i) => ({ n: i + 1, inMonth: true, dots: DOTS[i + 1] ?? [] })),
];
const TODAY = 1;
const PICKED = 8;

const steps = [
  {
    title: "Pick a day",
    text: "Open the month view and choose any date. Every day shows what's planned, so busy and open days stand out.",
  },
  {
    title: "Drag in activities",
    text: "Drop deep work, workouts or chores onto the timeline. Blocks snap to the quarter hour and stretch to fit.",
  },
  {
    title: "Tick them off",
    text: "Check blocks off as you go. A live now-line shows where you are, with your daily routines up top.",
  },
];
</script>

<template>
  <section id="how-it-works" class="scroll-mt-16 border-t border-border/60 bg-background py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-5 sm:px-8">
      <div data-reveal class="mx-auto max-w-2xl text-center">
        <h2 class="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">
          Three moves to a planned day.
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Your library starts stocked with everyday activities and routines, so you can plan tomorrow the moment you sign in.
        </p>
      </div>

      <ol class="mt-14 grid gap-5 sm:mt-16 md:grid-cols-3">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          data-reveal
          :style="{ '--reveal-delay': `${index * 90}ms` }"
          class="flex flex-col rounded-2xl border border-border bg-card p-2 shadow-2xs"
        >
          <div aria-hidden="true" class="relative flex h-60 items-center justify-center overflow-hidden rounded-xl bg-canvas">
            <!-- 1: month grid -->
            <div v-if="index === 0" class="w-[15.5rem] rounded-xl border border-border bg-card p-3 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold tracking-tight text-foreground">October 2026</span>
                <span class="flex gap-1 text-muted-foreground">
                  <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
              <div class="mt-2 grid grid-cols-7 text-center font-mono text-[9px] font-semibold uppercase text-muted-foreground">
                <span v-for="(d, i) in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="i">{{ d }}</span>
              </div>
              <div class="mt-1 grid grid-cols-7 gap-0.5">
                <span
                  v-for="cell in cells"
                  :key="`${cell.inMonth}-${cell.n}`"
                  :class="[
                    'relative flex h-[1.65rem] flex-col items-center rounded-md pt-0.5 text-[10px] font-medium tabular-nums',
                    !cell.inMonth ? 'text-muted-foreground/50' : 'text-foreground',
                    cell.inMonth && cell.n === PICKED ? 'bg-muted ring-1 ring-foreground/25' : '',
                  ]"
                >
                  <span
                    :class="[
                      'flex h-4 w-4 items-center justify-center rounded-full leading-none',
                      cell.inMonth && cell.n === TODAY ? 'bg-primary font-bold text-primary-foreground' : '',
                    ]"
                  >{{ cell.n }}</span>
                  <span class="mt-px flex gap-px">
                    <span v-for="(dot, i) in cell.dots" :key="i" :class="['h-1 w-1 rounded-full', paletteOf(dot).dot]" />
                  </span>
                  <svg
                    v-if="cell.inMonth && cell.n === PICKED"
                    class="step-tap absolute left-3 top-3 z-10 h-5 w-5 drop-shadow"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5.5 3.2v15.6c0 .5.6.7.9.4l3.6-3.7 2.4 5.4c.2.4.6.6 1 .4l1.9-.9c.4-.2.6-.6.4-1l-2.4-5.3h5.1c.5 0 .7-.6.4-.9L6.4 2.8c-.3-.3-.9-.1-.9.4z"
                      fill="#0a0a0a"
                      stroke="#fff"
                      stroke-width="1.4"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <!-- 2: dragging onto the timeline -->
            <div v-else-if="index === 1" class="relative w-[15.5rem] rounded-xl border border-border bg-card py-3 pr-3 shadow-xs">
              <div class="flex">
                <div class="w-11 shrink-0 border-r border-border pr-1.5 text-right font-mono text-[10px] text-muted-foreground">
                  <div v-for="(label, i) in ['9 AM', '', '10 AM', '', '11 AM', '']" :key="i" class="relative h-7">
                    <span v-if="label" class="absolute -top-2 right-1.5">{{ label }}</span>
                  </div>
                </div>
                <div class="relative flex-1 border-t border-border">
                  <div
                    v-for="i in 6"
                    :key="i"
                    :class="['h-7 border-b', i % 2 === 0 ? 'border-border/70' : 'border-dashed border-border/30']"
                  />
                  <div class="absolute inset-x-1 top-[2px] h-[80px]">
                    <MockBlock emoji="🛠️" title="Deep work" color="indigo" meta="9:00 – 10:30 AM" />
                    <span class="absolute inset-x-0 bottom-1 mx-auto h-0.5 w-6 rounded-full bg-foreground/25" />
                    <span class="absolute -right-1 bottom-0 translate-y-1/2 rounded-md bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground shadow-xs">
                      1h 30m
                    </span>
                  </div>
                  <div :class="['absolute inset-x-1.5 top-[86px] flex h-[52px] items-center justify-center rounded-lg border border-dashed', paletteOf('emerald').ghost]" />
                </div>
              </div>
              <div class="step-float absolute left-14 top-[6.6rem] flex w-40 items-center gap-2 rounded-md border border-border bg-card px-2 py-1 shadow-lg">
                <span :class="['flex h-5 w-5 items-center justify-center rounded text-[10px]', paletteOf('emerald').icon]">🏋️</span>
                <span class="flex-1 truncate text-[11px] font-medium text-foreground">Workout</span>
                <span class="font-mono text-[10px] text-muted-foreground">1h</span>
                <svg class="absolute -bottom-3 right-5 h-5 w-5 drop-shadow" viewBox="0 0 24 24">
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

            <!-- 3: ticking blocks off -->
            <div v-else class="w-[15.5rem] rounded-xl border border-border bg-card p-3 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold tracking-tight text-foreground">Today</span>
                <span class="font-mono text-[10px] tabular-nums text-muted-foreground">3/4 done</span>
              </div>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div class="h-full w-3/4 rounded-full bg-emerald-500" />
              </div>
              <div class="mt-3 space-y-1.5">
                <div class="h-8"><MockBlock compact done emoji="☀️" title="Morning routine" color="amber" /></div>
                <div class="h-8"><MockBlock compact done emoji="🛠️" title="Working on projects" color="indigo" /></div>
                <div class="h-8"><MockBlock compact done emoji="🏋️" title="Workout" color="emerald" /></div>
                <div class="relative flex items-center py-0.5">
                  <span class="absolute -left-1 h-2 w-2 rounded-full bg-rose-500" />
                  <span class="h-[1.5px] w-full bg-rose-500/80" />
                </div>
                <div class="h-8"><MockBlock compact emoji="📚" title="Study / learning" color="rose" /></div>
              </div>
            </div>
          </div>

          <div class="px-4 pb-5 pt-5 sm:px-5">
            <h3 class="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-semibold text-muted-foreground">
                {{ index + 1 }}
              </span>
              {{ step.title }}
            </h3>
            <p class="mt-2 text-[15px] leading-relaxed text-muted-foreground">{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.step-float {
  rotate: -2deg;
  animation: step-float 3.2s ease-in-out infinite;
}
@keyframes step-float {
  50% {
    translate: 0 -4px;
  }
}

.step-tap {
  animation: step-tap 2.4s ease-in-out infinite;
}
@keyframes step-tap {
  0%,
  100% {
    scale: 1;
  }
  45% {
    scale: 1;
  }
  52% {
    scale: 0.82;
  }
  60% {
    scale: 1;
  }
}
</style>
