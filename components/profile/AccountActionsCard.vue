<script setup lang="ts">
import { LogOut } from "lucide-vue-next";
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
      class="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-destructive/30 sm:h-9 bg-destructive/5 px-4 text-xs sm:text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground cursor-pointer shrink-0"
    >
      <LogOut class="h-4 w-4" />
      <span>Log Out</span>
    </button>
  </div>
</template>
