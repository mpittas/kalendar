<script setup lang="ts">
import type { DayChecklistItem } from "~/lib/types";

const props = defineProps<{
  item: DayChecklistItem;
  completed: boolean;
  /** Whether the row's action buttons are open. Owned by the parent so only one row is open at a time. */
  expanded: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", id: string): void;
  (e: "toggle-actions", id: string): void;
  (e: "edit", item: DayChecklistItem): void;
  (e: "skip", item: DayChecklistItem, hidden: boolean): void;
  (e: "remove", item: DayChecklistItem): void;
}>();

const run = (action: () => void) => {
  emit("toggle-actions", props.item.id);
  action();
};

const actionClass =
  "inline-flex h-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors touch:h-11 touch:flex-1 touch:px-2 touch:text-sm";
</script>

<template>
  <div
    class="group rounded-lg transition-colors"
    :class="expanded ? 'bg-accent/60' : 'hover:bg-accent/60'"
    @keydown.esc="expanded && emit('toggle-actions', item.id)"
  >
    <div class="flex min-h-11 items-center">
      <!-- The whole label is the toggle, so the hit area is the full row width -->
      <button
        type="button"
        class="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg py-3 pl-2 pr-1 text-left"
        :aria-pressed="completed"
        @click="emit('toggle', item.id)"
      >
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors touch:-mt-0.5 touch:h-6 touch:w-6"
          :class="completed
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-foreground/25 bg-background text-transparent group-hover:border-foreground/50'"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" class="h-3 w-3 touch:h-3.5 touch:w-3.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 10.5l3.5 3.5L15 6.5" />
          </svg>
        </span>

        <span class="shrink-0 select-none text-sm leading-snug transition-opacity" :class="completed ? 'opacity-50' : ''" aria-hidden="true">{{ item.emoji }}</span>

        <span class="min-w-0 flex-1">
          <span
            class="block break-words text-sm leading-snug transition-colors"
            :class="completed ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'"
          >{{ item.title }}</span>
          <span v-if="item.scope === 'day'" class="mt-0.5 block text-[11px] leading-tight text-muted-foreground">Only this day</span>
        </span>
      </button>

      <!-- Fades in on hover or focus where there is a real pointer (the slot stays reserved, so nothing shifts); always visible on touch -->
      <button
        type="button"
        class="mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground touch:mr-0 touch:h-11 touch:w-11"
        :class="expanded
          ? 'text-foreground'
          : '[@media(hover:hover)]:lg:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'"
        :aria-expanded="expanded"
        :aria-label="`Actions for ${item.title}`"
        @click="emit('toggle-actions', item.id)"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="4.5" cy="10" r="1.4" />
          <circle cx="10" cy="10" r="1.4" />
          <circle cx="15.5" cy="10" r="1.4" />
        </svg>
      </button>
    </div>

    <!-- Labeled actions, indented to line up with the title -->
    <div v-if="expanded" class="flex flex-wrap gap-1.5 pb-2 pl-10 pr-2 touch:pl-2">
      <button
        v-if="item.scope === 'default'"
        type="button"
        :class="[actionClass, 'border border-input bg-background text-foreground hover:bg-accent']"
        @click="run(() => emit('edit', item))"
      >
        Edit
      </button>
      <button
        v-if="item.scope === 'default'"
        type="button"
        :class="[actionClass, 'border border-input bg-background text-foreground hover:bg-accent']"
        @click="run(() => emit('skip', item, true))"
      >
        Skip this day
      </button>
      <button
        type="button"
        :class="[actionClass, 'text-destructive hover:bg-destructive/10']"
        @click="run(() => emit('remove', item))"
      >
        {{ item.scope === "day" ? "Remove" : "Delete" }}
      </button>
    </div>
  </div>
</template>
