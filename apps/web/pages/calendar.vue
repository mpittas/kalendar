<script setup lang="ts">
import { computed } from "vue";
import { isValidISODate, monthRange, todayISO, type ScheduledTask } from "@klndr/core";
import { api } from "~/lib/api";

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

// Client-only: API calls need the signed-in user's token, which SSR doesn't have.
// Not awaited, so navigating here isn't held up until the month's tasks arrive.
const { data: tasks } = useAsyncData<ScheduledTask[]>(
  "month-tasks",
  () => api.getTasksBetween(range.value.from, range.value.to),
  { server: false, lazy: true, watch: [month], default: () => [] },
);

useHead({
  title: "klndr. · Daily Task Scheduler",
});
</script>

<template>
  <MonthView :month="month" :tasks="tasks" />
</template>
