<script setup lang="ts">
import { computed } from "vue";
import { isValidISODate, monthRange, todayISO } from "~/lib/time";
import type { ScheduledTask } from "~/lib/types";

const route = useRoute();
const today = todayISO();

const month = computed(() => {
  const m = route.query.m as string | undefined;
  if (!m) return today;
  if (isValidISODate(m)) return m;
  if (/^\d{4}-\d{2}$/.test(m)) return `${m}-01`;
  return today;
});

const range = computed(() => monthRange(month.value));

const { data } = await useFetch<{ tasks: ScheduledTask[] }>(
  () => `/api/tasks?from=${range.value.from}&to=${range.value.to}`,
  {
    watch: [month],
  },
);

const tasks = computed(() => data.value?.tasks ?? []);

useHead({
  title: "DayForge · Daily Task Scheduler",
});
</script>

<template>
  <MonthView :month="month" :tasks="tasks" />
</template>
