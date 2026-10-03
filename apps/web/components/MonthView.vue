<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  addDaysISO,
  formatDuration,
  getMonthIndex,
  getYear,
  isSameMonth,
  longDate,
  monthMatrix,
  parseISODate,
  todayISO,
  type ScheduledTask,
} from "@klndr/core";
import MonthViewHeader from "~/components/month-view/MonthViewHeader.vue";
import MonthGrid from "~/components/month-view/MonthGrid.vue";
import MonthSidebar from "~/components/month-view/MonthSidebar.vue";
import DateNavigatorModal from "~/components/month-view/DateNavigatorModal.vue";

const props = defineProps<{
  month: string;
  tasks: ScheduledTask[];
}>();

const { load: loadCategories } = useCategories();
onMounted(() => loadCategories());

const today = todayISO();
const MAX_VISIBLE = 3;

const isDateSelectorOpen = ref(false);

const activeYear = computed(() => getYear(props.month));
const activeMonthIndex = computed(() => getMonthIndex(props.month));
const isCurrentMonth = computed(() => isSameMonth(props.month, today));

const onSelectMonth = (monthIso: string) => {
  navigateTo(`/calendar?m=${monthIso}`);
};

const onOpenDay = (dateIso: string) => {
  navigateTo(`/day/${dateIso}`);
};

const byDay = computed(() => {
  const map = new Map<string, ScheduledTask[]>();
  for (const task of props.tasks) {
    const list = map.get(task.day) ?? [];
    list.push(task);
    map.set(task.day, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startMinutes - b.startMinutes);
  }
  return map;
});

const days = computed(() =>
  monthMatrix(props.month).map((iso) => {
    const date = parseISODate(iso);
    const tasks = byDay.value.get(iso) ?? [];
    const isTargetDate = props.month === iso;
    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: isSameMonth(iso, props.month),
      isToday: iso === today,
      isSelected: isTargetDate,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      visible: tasks.slice(0, MAX_VISIBLE),
      hidden: Math.max(0, tasks.length - MAX_VISIBLE),
      total: tasks.length ? formatDuration(tasks.reduce((sum, t) => sum + t.durationMinutes, 0)) : "",
      label: `${longDate(iso)}, ${tasks.length} ${tasks.length === 1 ? "block" : "blocks"}`,
    };
  }),
);

const upcoming = computed(() => {
  const end = addDaysISO(today, 14);
  return props.tasks
    .filter((task) => task.day >= today && task.day <= end)
    .sort((a, b) => a.day.localeCompare(b.day) || a.startMinutes - b.startMinutes)
    .slice(0, 6);
});

const monthStats = computed(() => {
  const inMonth = props.tasks.filter((task) => isSameMonth(task.day, props.month));
  return {
    blocks: inMonth.length,
    hours: Math.round(inMonth.reduce((sum, t) => sum + t.durationMinutes, 0) / 60),
    done: inMonth.filter((t) => t.completed).length,
  };
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <MonthViewHeader
      :month="month"
      :today="today"
      :is-current-month="isCurrentMonth"
      :is-date-selector-open="isDateSelectorOpen"
      :month-stats="monthStats"
      @open-selector="isDateSelectorOpen = true"
    />

    <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <MonthGrid :days="days" />
      <MonthSidebar :upcoming="upcoming" />
    </div>

    <DateNavigatorModal
      :open="isDateSelectorOpen"
      :month="month"
      :active-year="activeYear"
      :active-month-index="activeMonthIndex"
      :today="today"
      @close="isDateSelectorOpen = false"
      @select-month="onSelectMonth"
      @open-day="onOpenDay"
    />
  </div>
</template>
