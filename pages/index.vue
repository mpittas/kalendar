<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import LandingNav from "~/components/landing/LandingNav.vue";
import LandingHero from "~/components/landing/LandingHero.vue";
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
  transition:
    opacity 0.8s cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1);
  transition-delay: var(--reveal-delay, 0ms);
}
.reveal-ready [data-reveal]:not(.is-revealed) {
  opacity: 0;
  transform: translateY(18px);
}
</style>
