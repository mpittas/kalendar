<script setup lang="ts">
import { MONTH_LABELS, setYearMonth } from "~/lib/time";

const props = defineProps<{
  open: boolean;
  month: string;
  activeYear: number;
  activeMonthIndex: number;
  today: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select-month", monthIso: string): void;
  (e: "open-day", dateIso: string): void;
}>();
</script>

<template>
  <Modal
    :open="open"
    title="Date Navigator"
    subtitle="Jump directly to any month, year, or specific day"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <!-- Year Navigator Stepper -->
      <div class="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-2.5">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('select-month', setYearMonth(month, activeYear - 1, activeMonthIndex).slice(0, 7))"
            class="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted cursor-pointer"
            title="Previous year"
            aria-label="Previous year"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12.5 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="font-mono text-base font-bold text-foreground min-w-[4rem] text-center">
            {{ activeYear }}
          </span>
          <button
            type="button"
            @click="emit('select-month', setYearMonth(month, activeYear + 1, activeMonthIndex).slice(0, 7))"
            class="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted cursor-pointer"
            title="Next year"
            aria-label="Next year"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7.5 15l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Month Grid (12 Months) -->
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Month
        </label>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            v-for="(name, idx) in MONTH_LABELS"
            :key="name"
            type="button"
            @click="
              emit('select-month', setYearMonth(month, activeYear, idx).slice(0, 7));
              emit('close');
            "
            :class="[
              'flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition cursor-pointer',
              activeMonthIndex === idx
                ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-bold'
                : 'border-border bg-card text-foreground hover:bg-muted'
            ]"
          >
            {{ name.slice(0, 3) }}
          </button>
        </div>
      </div>

      <!-- Specific Day Picker -->
      <div class="pt-3 border-t border-border">
        <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Jump to Specific Day
        </label>
        <input
          type="date"
          :value="month.length === 10 ? month : `${month.slice(0, 7)}-01`"
          @change="(e) => {
            const val = (e.target as HTMLInputElement).value;
            if (val) {
              emit('open-day', val);
              emit('close');
            }
          }"
          class="flex h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        />
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <button
          type="button"
          @click="
            emit('select-month', today.slice(0, 7));
            emit('close');
          "
          class="inline-flex h-8 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted cursor-pointer"
        >
          Current Month
        </button>
        <button
          type="button"
          @click="
            emit('open-day', today);
            emit('close');
          "
          class="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 cursor-pointer"
        >
          Open Today
        </button>
      </div>
    </div>
  </Modal>
</template>
