<script setup lang="ts">
import PlannerMock from "~/components/landing/PlannerMock.vue";

defineProps<{
  start: { to: string; label: string };
  signedIn: boolean;
}>();

const perks = ["Desktop and phone", "Light and dark", "Sign in with Google"];
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <!-- Faint timeline rules behind the hero -->
    <div aria-hidden="true" class="hero-rules pointer-events-none absolute inset-x-0 -top-16 bottom-0 -z-10" />

    <div class="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-24">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="hero-rise text-balance text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.75rem]">
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
            class="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            {{ start.label }}
            <svg viewBox="0 0 20 20" class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
          <NuxtLink
            v-if="!signedIn"
            to="/login"
            class="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 text-[15px] font-medium text-foreground shadow-2xs transition hover:bg-accent active:scale-[0.98]"
          >
            Log in
          </NuxtLink>
          <a
            v-else
            href="#how-it-works"
            class="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 text-[15px] font-medium text-foreground shadow-2xs transition hover:bg-accent active:scale-[0.98]"
          >
            See how it works
          </a>
        </div>

        <ul class="hero-rise mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground [--d:300ms]">
          <li v-for="perk in perks" :key="perk" class="flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
              <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ perk }}
          </li>
        </ul>
      </div>

      <div class="hero-rise relative mx-auto mt-14 max-w-5xl [--d:380ms] sm:mt-20">
        <PlannerMock />
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
}

.hero-rise {
  animation: hero-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: var(--d, 0ms);
}
.hero-drop {
  animation: hero-drop 0.8s cubic-bezier(0.3, 1.3, 0.5, 1) both;
  animation-delay: calc(350ms + var(--d, 0ms));
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
@keyframes hero-drop {
  from {
    opacity: 0;
    transform: translateY(-0.35em) rotate(-3deg);
  }
}
</style>
