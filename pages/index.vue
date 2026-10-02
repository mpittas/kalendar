<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import LandingNav from "~/components/landing/LandingNav.vue";
import LandingHero from "~/components/landing/LandingHero.vue";
import LandingMarquee from "~/components/landing/LandingMarquee.vue";
import LandingSteps from "~/components/landing/LandingSteps.vue";
import LandingCompare from "~/components/landing/LandingCompare.vue";
import LandingFeatures from "~/components/landing/LandingFeatures.vue";
import LandingCta from "~/components/landing/LandingCta.vue";
import LandingFooter from "~/components/landing/LandingFooter.vue";

const description =
  "klndr. is a visual day planner. Pick a date, drag activities onto an hour-by-hour timeline, and tick them off as your day unfolds.";

useSeoMeta({
  title: "klndr. · Plan your day, block by block",
  description,
  ogTitle: "klndr. · Plan your day, block by block",
  ogDescription: description,
  ogType: "website",
  twitterCard: "summary",
});

const { user, isConfigured } = useAuth();
const signedIn = computed(() => Boolean(user.value));

// Signed-in visitors go straight to their calendar. Without Firebase (local development) there are
// no accounts, so the calendar is the place to start as well.
const start = computed(() =>
  user.value || !isConfigured.value
    ? { to: "/calendar", label: "Open your calendar" }
    : { to: "/signup", label: "Start planning" },
);

// Sections fade up as they scroll into view. Nothing is hidden until this runs, so the page
// still reads fine without JavaScript.
const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | undefined;

onMounted(() => {
  const el = root.value;
  if (!el || !("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  el.querySelectorAll("[data-reveal]").forEach((node) => observer?.observe(node));
  el.classList.add("reveal-ready");
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="root" data-landing class="flex w-full flex-col bg-background">
    <LandingNav :start="start" />
    <LandingHero :start="start" :signed-in="signedIn" />
    <LandingMarquee />
    <LandingSteps />
    <LandingCompare />
    <LandingFeatures />
    <LandingCta :start="start" :signed-in="signedIn" />
    <LandingFooter :start="start" :signed-in="signedIn" />
  </div>
</template>

<style>
html:has([data-landing]) {
  scroll-behavior: smooth;
}

.reveal-ready [data-reveal] {
  --reveal-ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  transition:
    opacity 0.8s var(--reveal-ease) var(--reveal-delay, 0ms),
    transform 0.8s var(--reveal-ease) var(--reveal-delay, 0ms),
    filter 0.8s var(--reveal-ease) var(--reveal-delay, 0ms),
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
.reveal-ready [data-reveal]:not(.is-revealed) {
  opacity: 0;
  transform: translateY(18px);
  filter: blur(6px);
}

/* The primary button's raised edge: a hairline of light along the top. */
[data-landing] .btn-primary {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.16),
    0 1px 2px rgb(15 23 42 / 0.14),
    0 6px 16px -6px rgb(15 23 42 / 0.35);
}
.dark [data-landing] .btn-primary {
  box-shadow:
    inset 0 -1px 0 rgb(0 0 0 / 0.12),
    0 6px 16px -6px rgb(0 0 0 / 0.5);
}

/* Backdrop for the small product scenes: a faint dot grid with a glow in the scene's color (--tint). */
[data-landing] .stage {
  background-color: var(--canvas);
  background-image:
    radial-gradient(80% 70% at 50% 100%, color-mix(in oklab, var(--tint, var(--canvas)) 20%, transparent), transparent),
    radial-gradient(circle, color-mix(in oklab, var(--foreground) 11%, transparent) 0.8px, transparent 1.2px);
  background-size:
    100% 100%,
    14px 14px;
}

/* Cards whose scene comes forward a little on hover. */
[data-landing] .lift-card:hover {
  border-color: color-mix(in oklab, var(--foreground) 16%, var(--border));
  box-shadow: 0 18px 40px -22px rgb(15 23 42 / 0.3);
}
.dark [data-landing] .lift-card:hover {
  box-shadow: 0 18px 40px -22px rgb(0 0 0 / 0.7);
}
[data-landing] .lift-card .scene {
  transition: scale 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}
[data-landing] .lift-card:hover .scene {
  scale: 1.04;
}
</style>
