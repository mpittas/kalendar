<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps<{
  start: { to: string; label: string };
}>();

const { user, loading, isConfigured } = useAuth();
const { toggle: toggleTheme } = useTheme();

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#why", label: "Why a timeline" },
  { href: "#features", label: "Features" },
];

// The bar is see-through over the hero and gains a surface once the page scrolls under it.
const scrolled = ref(false);
const onScroll = () => {
  scrolled.value = window.scrollY > 8;
};
onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-300"
    :class="scrolled ? 'border-border/70 bg-background/90 backdrop-blur-md' : 'border-transparent bg-transparent'"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-8">
      <NuxtLink to="/" class="-mx-1 px-1 py-2 text-xl font-bold tracking-tight text-foreground transition hover:opacity-80" aria-label="klndr. home">
        klndr.
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex" aria-label="Sections">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Both icons render; CSS picks one so SSR and client markup always match. -->
        <button
          type="button"
          aria-label="Toggle light/dark theme"
          title="Toggle theme"
          class="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
          @click="toggleTheme"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 dark:hidden" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg viewBox="0 0 24 24" class="hidden h-4 w-4 dark:block" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>

        <!-- Without Firebase nobody signs in, so there is nothing to wait for. -->
        <div v-if="loading && isConfigured" class="h-10 w-28 animate-pulse rounded-lg bg-muted sm:h-9" />
        <template v-else>
          <NuxtLink
            v-if="!user"
            to="/login"
            class="inline-flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:h-9"
          >
            Log in
          </NuxtLink>
          <NuxtLink
            :to="start.to"
            class="inline-flex h-10 items-center whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:h-9"
          >
            {{ user ? "Open calendar" : "Get started" }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
