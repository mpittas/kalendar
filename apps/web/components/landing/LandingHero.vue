<script setup lang="ts">
import { ArrowDown, ArrowRight, ArrowUp, Check } from "lucide-vue-next";
import PlannerMock from "~/components/landing/PlannerMock.vue";

defineProps<{
  start: { to: string; label: string };
  signedIn: boolean;
}>();

const perks = ["Desktop and phone", "Light and dark", "Sign in with Google"];

// Matches the routines strip in the planner mock: two of four ticked off.
const ROUTINES_DONE = 2;
const ROUTINES_TOTAL = 4;
const RING = 2 * Math.PI * 15;
</script>

<template>
  <!-- overflow-clip, not hidden: a hidden overflow is a scroll container and would pin the tilt's view timeline. -->
  <section class="relative isolate overflow-clip">
    <!-- Faint timeline rules behind the hero -->
    <div aria-hidden="true" class="hero-rules pointer-events-none absolute inset-x-0 -top-16 bottom-0 -z-10" />

    <div class="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-24">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="hero-rise text-balance text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[5rem]">
          Plan your day,
          <span class="whitespace-nowrap">
            <span class="word-block hero-drop border-indigo-200 bg-indigo-50 dark:border-indigo-400/30 dark:bg-indigo-500/15">
              <span aria-hidden="true" class="absolute inset-y-[0.2em] left-[0.14em] w-[0.06em] min-w-[3px] rounded-full bg-indigo-500" />block</span>
            by
            <span class="word-block hero-drop border-emerald-200 bg-emerald-50 [--d:180ms] dark:border-emerald-400/30 dark:bg-emerald-500/15">
              <span aria-hidden="true" class="absolute inset-y-[0.2em] left-[0.14em] w-[0.06em] min-w-[3px] rounded-full bg-emerald-500" />block</span>
          </span>
        </h1>

        <p class="hero-rise mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground [--d:120ms] sm:text-lg">
          klndr. is a visual day planner. Pick a date, drag activities like deep work, workouts and chores onto an
          hour-by-hour timeline, and tick them off as your day unfolds.
        </p>

        <div class="hero-rise mt-9 flex flex-col items-stretch justify-center gap-3 [--d:220ms] sm:flex-row sm:items-center">
          <NuxtLink
            :to="start.to"
            class="btn-primary group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
          >
            {{ start.label }}
            <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink
            v-if="!signedIn"
            to="/login"
            class="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background/80 px-6 text-[15px] font-medium text-foreground shadow-2xs backdrop-blur transition hover:bg-accent active:scale-[0.98]"
          >
            Log in
          </NuxtLink>
          <a
            v-else
            href="#how-it-works"
            class="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background/80 px-6 text-[15px] font-medium text-foreground shadow-2xs backdrop-blur transition hover:bg-accent active:scale-[0.98]"
          >
            See how it works
          </a>
        </div>

        <ul class="hero-rise mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground [--d:300ms]">
          <li v-for="perk in perks" :key="perk" class="flex items-center gap-1.5">
            <Check class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" :stroke-width="3" />
            {{ perk }}
          </li>
        </ul>
      </div>

      <div class="hero-rise relative mx-auto mt-14 max-w-5xl [--d:380ms] sm:mt-20">
        <!-- A soft wash of the activity colors behind the product -->
        <div aria-hidden="true" class="pointer-events-none absolute -inset-x-16 -top-16 bottom-0 -z-10">
          <div class="absolute left-0 top-[8%] h-[55%] w-[42%] rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/15" />
          <div class="absolute right-0 top-[4%] h-1/2 w-[40%] rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
          <div class="absolute left-[30%] top-0 h-[38%] w-[40%] rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-400/[0.07]" />
          <div class="absolute bottom-0 left-[8%] h-[45%] w-[40%] rounded-full bg-sky-300/15 blur-3xl dark:bg-sky-500/[0.07]" />
          <div class="absolute bottom-[4%] right-[6%] h-[45%] w-[38%] rounded-full bg-rose-300/15 blur-3xl dark:bg-rose-500/[0.07]" />
        </div>

        <div class="hero-tilt">
          <div
            class="rounded-[1.375rem] bg-white/55 p-1.5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_40px_80px_-36px_rgb(15_23_42/0.4)] ring-1 ring-slate-900/[0.07] sm:p-2 dark:bg-white/[0.04] dark:shadow-[0_40px_80px_-36px_rgb(0_0_0/0.75)] dark:ring-white/10"
          >
            <PlannerMock />
          </div>
        </div>

        <!-- Floating details on wide screens -->
        <div
          aria-hidden="true"
          class="hero-float absolute -left-20 -bottom-8 z-10 hidden w-56 items-center gap-3 rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-[0_24px_48px_-20px_rgb(15_23_42/0.35)] backdrop-blur-md xl:flex dark:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]"
        >
          <svg viewBox="0 0 36 36" class="h-11 w-11 shrink-0 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" class="stroke-muted" stroke-width="4" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              class="stroke-emerald-500"
              stroke-width="4"
              stroke-linecap="round"
              :stroke-dasharray="`${(RING * ROUTINES_DONE) / ROUTINES_TOTAL} ${RING}`"
            />
          </svg>
          <div class="min-w-0">
            <p class="text-sm font-semibold tracking-tight text-foreground">Daily routines</p>
            <p class="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">{{ ROUTINES_DONE }} of {{ ROUTINES_TOTAL }} done today</p>
          </div>
        </div>

        <div
          aria-hidden="true"
          class="hero-float absolute -right-20 top-[46%] z-10 hidden w-60 rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-[0_24px_48px_-20px_rgb(15_23_42/0.35)] backdrop-blur-md [--float-delay:-3s] xl:block dark:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]"
        >
          <div class="flex items-center gap-1.5">
            <span v-for="icon in [ArrowUp, ArrowDown]" :key="icon.name" class="keycap">
              <component :is="icon" class="h-3.5 w-3.5" />
            </span>
            <span class="ml-1.5 text-sm font-semibold tracking-tight text-foreground">Nudge 15 minutes</span>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-muted-foreground">Focus a block and move it with the arrow keys.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-rules {
  background-image:
    repeating-linear-gradient(to bottom, transparent 0 95px, var(--border) 95px 96px),
    repeating-linear-gradient(to bottom, transparent 0 47px, color-mix(in oklab, var(--border) 45%, transparent) 47px 48px);
  mask-image: radial-gradient(ellipse 75% 55% at 50% 22%, black 25%, transparent 80%);
}

/* Words dressed as timeline blocks. */
.word-block {
  position: relative;
  display: inline-block;
  border-width: 1px;
  border-radius: 0.22em;
  padding: 0 0.16em 0.04em 0.3em;
  line-height: 1.02;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04), 0 8px 20px -12px rgb(15 23 42 / 0.25);
}

/* The product leans back at first and straightens as it scrolls into view. */
.hero-tilt {
  transform-origin: 50% 0;
}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) and (min-width: 768px) {
    .hero-tilt {
      animation: hero-tilt linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 100%;
    }
  }
}
@keyframes hero-tilt {
  from {
    transform: perspective(1600px) rotateX(14deg) scale(0.94);
  }
  to {
    transform: perspective(1600px) rotateX(0deg) scale(1);
  }
}

.hero-float {
  animation: hero-bob 7s ease-in-out var(--float-delay, 0s) infinite;
}
@keyframes hero-bob {
  50% {
    translate: 0 -8px;
  }
}

.keycap {
  display: inline-flex;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  box-shadow: inset 0 -2px 0 var(--border);
}
</style>
