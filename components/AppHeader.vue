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
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
    <div class="flex w-full items-center justify-between px-3 py-2 sm:px-6 lg:px-8">
      <!-- Logo & Main Nav -->
      <div class="flex items-center gap-2.5 sm:gap-6">
        <NuxtLink to="/" class="group flex items-center">
          <span class="text-lg font-bold tracking-tight text-slate-900 transition group-hover:text-slate-700 sm:text-xl">
            klndr.
          </span>
        </NuxtLink>

        <nav aria-label="Primary" class="flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5 sm:p-1">
          <NuxtLink
            to="/"
            class="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:text-slate-900 sm:px-3.5 sm:py-1.5 sm:text-sm"
            active-class="!bg-white !text-slate-900 !font-semibold shadow-2xs"
          >
            Calendar
          </NuxtLink>
          <NuxtLink
            :to="`/day/${today}`"
            class="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:text-slate-900 sm:px-3.5 sm:py-1.5 sm:text-sm"
            active-class="!bg-white !text-slate-900 !font-semibold shadow-2xs"
          >
            Today
          </NuxtLink>
        </nav>
      </div>

      <!-- User / Auth Actions -->
      <div class="flex items-center gap-1.5 sm:gap-2.5">
        <div v-if="loading" class="h-7 w-16 animate-pulse rounded-lg bg-slate-200 sm:h-8 sm:w-20" />

        <template v-else-if="user">
          <NuxtLink
            to="/profile"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            <div class="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white sm:h-6 sm:w-6 sm:text-xs">
              {{ initials }}
            </div>
            <span class="hidden sm:inline max-w-[130px] truncate">{{ displayName }}</span>
          </NuxtLink>

          <button
            type="button"
            @click="handleLogout"
            class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            Log Out
          </button>
        </template>

        <template v-else>
          <NuxtLink
            to="/login"
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-900 sm:px-3 sm:py-2 sm:text-sm"
          >
            Log In
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 sm:px-3.5 sm:py-2 sm:text-sm"
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
