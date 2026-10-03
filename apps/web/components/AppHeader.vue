<script setup lang="ts">
import { Calendar, Clock, Moon, Sun } from "lucide-vue-next";
import { computed } from "vue";
import { todayISO } from "~/lib/time";

const { user, profile, loading, isConfigured } = useAuth();
const { toggle: toggleTheme } = useTheme();
const route = useRoute();
const today = todayISO();

const isDayView = computed(() => route.path.startsWith("/day"));
const isCalendarView = computed(() => route.path === "/calendar");
const onLoginPage = computed(() => route.path === "/login");

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
  <header class="sticky top-0 z-30 shrink-0 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex h-14 w-full items-center justify-between gap-2 short:h-12 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 lg:px-8">
      <!-- Logo & Main Nav -->
      <div class="flex min-w-0 items-center gap-2.5 sm:gap-6">
        <NuxtLink :to="user ? '/calendar' : '/'" class="group -mx-1 flex items-center px-1 py-2" aria-label="klndr. home">
          <span class="text-lg font-bold tracking-tight text-foreground transition group-hover:opacity-80 sm:text-xl">
            klndr.
          </span>
        </NuxtLink>

        <!-- Compact shadcn segmented toggle with high-contrast active state & icons -->
        <nav
          v-if="user"
          aria-label="Primary"
          class="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-0.5 text-muted-foreground shadow-2xs sm:h-8"
        >
          <NuxtLink
            to="/calendar"
            class="relative inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-all after:absolute after:inset-x-0 after:-inset-y-0.5 active:scale-[0.98] max-[359px]:w-10 max-[359px]:px-0 sm:h-7 sm:after:hidden"
            :class="isCalendarView
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
          >
            <Calendar class="h-3.5 w-3.5 shrink-0 max-[400px]:hidden max-[359px]:block max-[359px]:h-4 max-[359px]:w-4" />
            <span class="max-[359px]:sr-only">Calendar</span>
          </NuxtLink>
          <NuxtLink
            :to="`/day/${today}`"
            class="relative inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-all after:absolute after:inset-x-0 after:-inset-y-0.5 active:scale-[0.98] max-[359px]:w-10 max-[359px]:px-0 sm:h-7 sm:after:hidden"
            :class="isDayView
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
          >
            <Clock class="h-3.5 w-3.5 shrink-0 max-[400px]:hidden max-[359px]:block max-[359px]:h-4 max-[359px]:w-4" />
            <span class="max-[359px]:sr-only">Today</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- User / Auth Actions - all standardized to h-8 -->
      <div class="flex shrink-0 items-center gap-2">
        <!-- Both icons render; CSS picks one so SSR and client markup always match. -->
        <button
          type="button"
          aria-label="Toggle light/dark theme"
          title="Toggle theme"
          class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer sm:h-8 sm:w-8"
          @click="toggleTheme"
        >
          <Moon class="h-4 w-4 dark:hidden" aria-hidden="true" />
          <Sun class="hidden h-4 w-4 dark:block" aria-hidden="true" />
        </button>
        <div v-if="loading" class="h-10 w-10 animate-pulse rounded-md bg-muted sm:h-8 sm:w-20" />

        <template v-else-if="user">
          <NuxtLink
            to="/profile"
            :aria-label="`Profile: ${displayName}`"
            class="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-md border border-input bg-background text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground sm:h-8 sm:w-auto sm:px-2.5"
          >
            <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground sm:h-5 sm:w-5">
              {{ initials }}
            </div>
            <span class="hidden sm:inline max-w-[130px] truncate">{{ displayName }}</span>
          </NuxtLink>
        </template>

        <template v-else>
          <!-- One compact action on phones; the login page links on to sign-up. -->
          <NuxtLink
            v-if="!onLoginPage"
            to="/login"
            class="inline-flex h-10 items-center whitespace-nowrap rounded-md bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:hidden"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            v-if="!onLoginPage"
            to="/login"
            class="hidden h-8 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            Log In
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="hidden h-8 items-center whitespace-nowrap rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            Sign Up
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Alert banner if Firebase is not yet connected -->
    <div
      v-if="!loading && !isConfigured"
      class="border-t border-amber-200/70 bg-amber-50/70 px-4 py-1 text-center text-[11px] text-amber-900 sm:text-xs dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        <span class="sm:hidden">Local database · no cloud sync</span>
        <span class="hidden sm:inline">Local database active · Set Firebase credentials in <code class="rounded bg-amber-100/70 dark:bg-amber-400/20 px-1 py-0.2 font-mono text-[11px]">.env</code> for cloud sync</span>
      </span>
    </div>
  </header>
</template>
