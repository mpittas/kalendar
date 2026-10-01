<script setup lang="ts">
import { computed } from "vue";
import { paletteOf } from "~/lib/colors";

/** A static timeline block for the landing page mockups, styled like the real one in DayTimelineGrid. */
const props = defineProps<{
  emoji: string;
  title: string;
  color: string;
  done?: boolean;
  /** Single-line layout for short blocks. */
  compact?: boolean;
  /** Shown under the title, e.g. "9:00 AM – 11:00 AM · 2h". */
  meta?: string;
  note?: string;
}>();

const tone = computed(() => paletteOf(props.color));
</script>

<template>
  <div
    :class="[
      'relative flex h-full flex-col overflow-hidden rounded-lg border px-2.5 text-left',
      compact ? 'justify-center py-0' : 'py-1.5',
      done ? tone.blockDone : tone.block,
    ]"
  >
    <span :class="['absolute left-1 w-0.5 rounded-full', compact ? 'inset-y-1' : 'inset-y-1.5', tone.accent, done ? 'opacity-40' : '']" />
    <div :class="['flex gap-2 pl-1.5', compact ? 'items-center' : 'items-start']">
      <span
        :class="[
          'flex shrink-0 items-center justify-center rounded-xs border',
          compact ? 'h-3.5 w-3.5' : 'mt-0.5 h-4 w-4',
          done ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs' : 'border-input bg-background text-transparent',
        ]"
      >
        <svg viewBox="0 0 16 16" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-6" />
        </svg>
      </span>
      <p
        :class="[
          'min-w-0 flex-1 truncate leading-tight',
          compact ? 'text-xs' : 'text-sm',
          done ? 'font-normal text-muted-foreground line-through' : 'font-semibold text-foreground',
        ]"
      >
        {{ emoji }} {{ title }}
      </p>
    </div>
    <p v-if="meta" class="mt-1 truncate pl-7 text-[12px] font-medium leading-4 tabular-nums text-foreground/70">
      {{ meta }}
    </p>
    <p v-if="note" class="mt-1 line-clamp-1 pl-7 text-[12.5px] leading-5 text-foreground/60">
      {{ note }}
    </p>
    <slot />
  </div>
</template>
