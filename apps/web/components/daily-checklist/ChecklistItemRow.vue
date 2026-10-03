<script setup lang="ts">
import { Check, Ellipsis } from "lucide-vue-next";
import type { DayChecklistItem } from "@klndr/core";

const props = defineProps<{
  item: DayChecklistItem;
  completed: boolean;
  /** Whether the row's menu is open. Owned by the parent so only one row's menu is open at a time. */
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

const menuItemClass =
  "flex min-h-9 w-full cursor-pointer items-center rounded-md px-2.5 text-left text-sm transition-colors touch:min-h-11";
</script>

<template>
  <div
    class="group relative flex items-center rounded-lg transition-colors hover:bg-accent/60"
    :class="expanded ? 'bg-accent/60' : ''"
    @keydown.esc="expanded && emit('toggle-actions', item.id)"
  >
    <button
      type="button"
      class="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg py-2 pl-2.5 pr-1 text-left touch:min-h-12"
      :aria-pressed="completed"
      @click="emit('toggle', item.id)"
    >
      <span
        class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors touch:h-5 touch:w-5"
        :class="completed
          ? 'border-foreground bg-foreground text-background'
          : 'border-foreground/30 text-transparent group-hover:border-foreground/60'"
        aria-hidden="true"
      >
        <Check class="h-2.5 w-2.5" :stroke-width="3" />
      </span>

      <span class="min-w-0 flex-1 text-sm leading-snug transition-colors" :class="completed ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground'">
        <span class="mr-1.5 select-none" :class="completed ? 'opacity-50' : ''" aria-hidden="true">{{ item.emoji }}</span>{{ item.title }}
        <span v-if="item.scope === 'day'" class="ml-1 text-[11px] text-muted-foreground">· this day only</span>
      </span>
    </button>

    <!-- Appears on hover or focus where there is a real pointer; always visible on touch -->
    <button
      type="button"
      class="mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground touch:h-11 touch:w-11"
      :class="expanded
        ? 'text-foreground'
        : '[@media(hover:hover)]:lg:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'"
      aria-haspopup="menu"
      :aria-expanded="expanded"
      :aria-label="`Actions for ${item.title}`"
      @click="emit('toggle-actions', item.id)"
    >
      <Ellipsis class="h-4 w-4" aria-hidden="true" />
    </button>

    <template v-if="expanded">
      <div class="fixed inset-0 z-30" aria-hidden="true" @click="emit('toggle-actions', item.id)" />
      <div
        role="menu"
        class="absolute right-1 top-full z-40 mt-1 w-40 rounded-lg border border-border bg-popover p-1 shadow-lg touch:w-48"
      >
        <button
          v-if="item.scope === 'default'"
          type="button"
          role="menuitem"
          :class="[menuItemClass, 'text-foreground hover:bg-accent']"
          @click="run(() => emit('edit', item))"
        >
          Edit
        </button>
        <button
          v-if="item.scope === 'default'"
          type="button"
          role="menuitem"
          :class="[menuItemClass, 'text-foreground hover:bg-accent']"
          @click="run(() => emit('skip', item, true))"
        >
          Skip this day
        </button>
        <button
          type="button"
          role="menuitem"
          :class="[menuItemClass, 'text-destructive hover:bg-destructive/10']"
          @click="run(() => emit('remove', item))"
        >
          {{ item.scope === "day" ? "Remove" : "Delete" }}
        </button>
      </div>
    </template>
  </div>
</template>
