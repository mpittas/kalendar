<script setup lang="ts">
import { computed } from "vue";
import { todayISO } from "~/lib/time";

const { user, profile, loading, isConfigured, logout } = useAuth();
const today = todayISO();

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

const handleLogout = async () => {
  await logout();
  navigateTo("/login");
};
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

        <!-- shadcn Tabs style navigation -->
        <nav aria-label="Primary" class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-all hover:text-foreground active:scale-[0.98]"
            active-class="!bg-background !text-foreground !shadow-xs font-semibold"
          >
            Calendar
          </NuxtLink>
          <NuxtLink
            :to="`/day/${today}`"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-all hover:text-foreground active:scale-[0.98]"
            active-class="!bg-background !text-foreground !shadow-xs font-semibold"
          >
            Today
          </NuxtLink>
        </nav>
      </div>

      <!-- User / Auth Actions -->
      <div class="flex items-center gap-2">
        <div v-if="loading" class="h-8 w-20 animate-pulse rounded-md bg-muted" />

        <template v-else-if="user">
          <NuxtLink
            to="/profile"
            class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div class="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground sm:h-6 sm:w-6 sm:text-xs">
              {{ initials }}
            </div>
            <span class="hidden sm:inline max-w-[130px] truncate">{{ displayName }}</span>
          </NuxtLink>

          <button
            type="button"
            @click="handleLogout"
            class="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            Log Out
          </button>
        </template>

        <template v-else>
          <NuxtLink
            to="/login"
            class="inline-flex items-center rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Log In
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="inline-flex items-center rounded-md bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            Sign Up
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Alert banner if Firebase is not yet connected -->
    <div
      v-if="!loading && !isConfigured"
      class="border-t border-amber-200/70 bg-amber-50/70 px-4 py-1 text-center text-xs text-amber-900"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Local database active · Set Firebase credentials in <code class="rounded bg-amber-100/70 px-1 py-0.2 font-mono text-[11px]">.env</code> for cloud sync
      </span>
    </div>
  </header>
</template>
