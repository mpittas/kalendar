<script setup lang="ts">
import type { ScheduledTask } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { formatTime, parseISODate } from "~/lib/time";

const props = defineProps<{
  upcoming: ScheduledTask[];
}>();

const toneOf = (color: string) => paletteOf(color);
</script>

<template>
  <aside class="space-y-4">
    <section class="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div class="flex items-center justify-between pb-3 border-b border-border">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-foreground">Upcoming</h2>
        <span class="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
          Next 14 days
        </span>
      </div>
      <p v-if="upcoming.length === 0" class="mt-4 text-sm text-muted-foreground">
        Nothing scheduled yet. Open a date and drop activities onto the timeline.
      </p>
      <ul v-else class="mt-3 space-y-2">
        <li v-for="task in upcoming" :key="task.id">
          <NuxtLink
            :to="`/day/${task.day}`"
            class="group flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 transition hover:border-foreground/20 hover:bg-muted/40 shadow-2xs hover:shadow-xs"
          >
            <span
              :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', toneOf(task.color).dot]"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {{ task.emoji }} {{ task.title }}
              </span>
              <span class="block font-mono text-xs text-muted-foreground tabular-nums">
                {{
                  parseISODate(task.day).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }}
                · {{ formatTime(task.startMinutes) }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section class="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-foreground pb-2 border-b border-border">Tips & Shortcuts</h2>
      <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
        <li class="flex items-start gap-2.5">
          <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
          <span>Click any date cell to plan that day's schedule</span>
        </li>
        <li class="flex items-start gap-2.5">
          <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
          <span>Drag activities directly onto the timeline grid</span>
        </li>
        <li class="flex items-start gap-2.5">
          <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
          <span>Click a block to edit it or toggle its completion</span>
        </li>
      </ul>
    </section>
  </aside>
</template>
