<script setup lang="ts">
import MockBlock from "~/components/landing/MockBlock.vue";

defineProps<{
  start: { to: string; label: string };
  signedIn: boolean;
}>();

// A loose stack of tomorrow's blocks beside the closing pitch.
const stack = [
  { emoji: "☀️", title: "Morning routine", color: "amber", meta: "7:00 AM – 7:45 AM · 45m", style: "top: 0; left: 8%; rotate: -4deg" },
  { emoji: "🛠️", title: "Working on projects", color: "indigo", meta: "9:00 AM – 11:00 AM · 2h", style: "top: 26%; left: 22%; rotate: 2deg" },
  { emoji: "🏋️", title: "Workout", color: "emerald", meta: "6:00 PM – 7:00 PM · 1h", style: "top: 52%; left: 4%; rotate: -1.5deg" },
  { emoji: "🌙", title: "Evening wind-down", color: "violet", meta: "10:00 PM – 10:30 PM · 30m", style: "top: 76%; left: 18%; rotate: 3deg" },
];
</script>

<template>
  <section class="bg-background px-4 pb-6 pt-4 sm:px-8 sm:pb-8">
    <div
      data-reveal
      class="relative mx-auto grid max-w-6xl items-center gap-12 overflow-hidden rounded-3xl bg-zinc-900 px-6 py-16 text-white sm:px-12 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-16 dark:bg-[#1e1f22] dark:ring-1 dark:ring-border"
    >
      <div class="relative">
        <h2 class="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
          Tomorrow is a blank timeline.
        </h2>
        <p class="mt-5 max-w-md text-pretty text-base leading-relaxed text-white/65 sm:text-lg">
          Give it a shape tonight. Pick the date, drag in what matters, and start the day already knowing the plan.
        </p>
        <div class="mt-9 flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            :to="start.to"
            class="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-medium text-zinc-900 shadow-sm transition hover:bg-white/90 active:scale-[0.98]"
          >
            {{ start.label }}
            <svg viewBox="0 0 20 20" class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
          <NuxtLink
            v-if="!signedIn"
            to="/login"
            class="inline-flex h-12 items-center justify-center rounded-xl px-6 text-[15px] font-medium text-white/85 ring-1 ring-white/20 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            I have an account
          </NuxtLink>
        </div>
      </div>

      <div aria-hidden="true" class="relative hidden h-72 lg:block">
        <div
          v-for="(block, index) in stack"
          :key="block.title"
          class="cta-card absolute h-16 w-72"
          :style="`${block.style}; --i: ${index}`"
        >
          <div class="h-full rounded-lg bg-white shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)] dark:bg-card">
            <MockBlock :emoji="block.emoji" :title="block.title" :color="block.color" :meta="block.meta" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-card {
  animation: cta-bob 6s ease-in-out infinite;
  animation-delay: calc(var(--i) * -1.5s);
}
@keyframes cta-bob {
  50% {
    translate: 0 -6px;
  }
}
</style>
