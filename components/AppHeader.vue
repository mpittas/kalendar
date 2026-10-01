<script setup lang="ts">
import { computed } from "vue";
import { todayISO } from "~/lib/time";

const { user, profile, loading, isConfigured } = useAuth();
const { toggle: toggleTheme } = useTheme();
const route = useRoute();
const today = todayISO();

const isDayView = computed(() => route.path.startsWith("/day"));
const isCalendarView = computed(() => !isDayView.value);

const displayName = computed(() => {
  return profile.value?.displayName || user.value?.displayName || user.value?.email?.split("@")[0] || "User";
});

const initials = computed(() => {
  const name = displayName.value.trim();
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex h-14 w-full items-center justify-between px-3 sm:px-6 lg:px-8">
      <!-- Logo & Main Nav -->
      <div class="flex items-center gap-3 sm:gap-6">
        <NuxtLink to="/" class="group flex items-center">
          <span class="text-lg font-bold tracking-tight text-foreground transition group-hover:opacity-80 sm:text-xl">
            klndr.
          </span>
        </NuxtLink>

        <!-- Compact shadcn segmented toggle with high-contrast active state & icons -->
        <nav aria-label="Primary" class="inline-flex h-8 items-center justify-center rounded-lg bg-muted p-0.5 text-muted-foreground shadow-2xs">
          <NuxtLink
            to="/"
            class="inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-all active:scale-[0.98]"
            :class="isCalendarView
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Calendar</span>
          </NuxtLink>
          <NuxtLink
            :to="`/day/${today}`"
            class="inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-all active:scale-[0.98]"
            :class="isDayView
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Today</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- User / Auth Actions - all standardized to h-8 -->
      <div class="flex items-center gap-2">
        <!-- Both icons render; CSS picks one so SSR and client markup always match. -->
        <button
          type="button"
          aria-label="Toggle light/dark theme"
          title="Toggle theme"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
        <div v-if="loading" class="h-8 w-20 animate-pulse rounded-md bg-muted" />

        <template v-else-if="user">
          <NuxtLink
            to="/profile"
            class="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {{ initials }}
            </div>
            <span class="hidden sm:inline max-w-[130px] truncate">{{ displayName }}</span>
          </NuxtLink>
        </template>

        <template v-else>
          <NuxtLink
            to="/login"
            class="inline-flex h-8 items-center rounded-md px-3 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Log In
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="inline-flex h-8 items-center rounded-md bg-primary px-3.5 text-xs sm:text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            Sign Up
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Alert banner if Firebase is not yet connected -->
    <div
      v-if="!loading && !isConfigured"
      class="border-t border-amber-200/70 bg-amber-50/70 px-4 py-1 text-center text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Local database active · Set Firebase credentials in <code class="rounded bg-amber-100/70 dark:bg-amber-400/20 px-1 py-0.2 font-mono text-[11px]">.env</code> for cloud sync
      </span>
    </div>
  </header>
</template>
