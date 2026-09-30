<script setup lang="ts">
import { computed } from "vue";
import { isValidISODate, todayISO } from "~/lib/time";
import type { ActivityTemplate, ScheduledTask } from "~/lib/types";

const route = useRoute();
const rawDate = computed(() => route.params.date as string);
const day = computed(() => (isValidISODate(rawDate.value) ? rawDate.value : todayISO()));

const { data: tasksData } = await useFetch<{ tasks: ScheduledTask[] }>(
  () => `/api/tasks?day=${day.value}`,
  {
    watch: [day],
  },
);

const { data: templatesData } = await useFetch<{ templates: ActivityTemplate[] }>(
  "/api/templates",
);

const tasks = computed(() => tasksData.value?.tasks ?? []);
const templates = computed(() => templatesData.value?.templates ?? []);

useHead({
  title: computed(() => `Plan · ${day.value}`),
});
</script>

<template>
  <DayPlanner
    :day="day"
    :initial-tasks="tasks"
    :initial-templates="templates"
  />
</template>
