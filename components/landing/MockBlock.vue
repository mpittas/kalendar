<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { computed } from "vue";
import { paletteOf } from "~/lib/colors";
import TimeBlock from "~/components/day-planner/TimeBlock.vue";

/** A static timeline block for the landing page mockups, drawn by the same TimeBlock as the real one. */
const props = defineProps<{
  emoji: string;
  title: string;
  color: string;
  done?: boolean;
  /** Single-line layout for short blocks. */
  compact?: boolean;
  /** Shown under the title, e.g. "9:00 – 11:00 AM". */
  meta?: string;
}>();

const tone = computed(() => paletteOf(props.color));
</script>

<template>
  <TimeBlock :emoji="emoji" :title="title" :time="meta" :color="color" :done="done" :short="compact" class="relative h-full">
    <span
      :class="[
        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
        !compact && 'mt-px',
        done ? [tone.accent, 'border-transparent text-white'] : [tone.check, 'text-transparent'],
      ]"
    >
      <Check class="h-2.5 w-2.5" aria-hidden="true" :stroke-width="3" />
    </span>
    <slot />
  </TimeBlock>
</template>
