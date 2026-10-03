<script setup lang="ts">
const props = defineProps<{
  initials: string;
  displayName: string;
  email: string;
  uid: string;
}>();
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-xs">
          {{ initials }}
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-foreground">
            {{ displayName || 'Your Profile' }}
          </h1>
          <p class="text-xs sm:text-sm text-muted-foreground">{{ email }}</p>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Firebase Connected
            </span>
            <span class="text-[11px] text-muted-foreground font-mono">UID: {{ uid.slice(0, 12) }}...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
