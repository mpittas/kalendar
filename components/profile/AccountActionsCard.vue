<script setup lang="ts">
const emit = defineEmits<{
  (e: "logout"): void;
}>();
</script>

<template>
  <div class="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h3 class="text-sm font-semibold text-foreground">Sign Out</h3>
      <p class="text-xs text-muted-foreground">Sign out of your account on this device.</p>
    </div>
    <button
      type="button"
      @click="emit('logout')"
      class="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-4 text-xs sm:text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground cursor-pointer shrink-0"
    >
      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 15l5-5-5-5M18 10H8M11 4H5a2 2 0 00-2 2v8a2 2 0 002 2h6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>Log Out</span>
    </button>
  </div>
</template>
