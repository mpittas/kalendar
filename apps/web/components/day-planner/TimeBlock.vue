<script setup lang="ts">
import { computed } from "vue";
import { paletteOf } from "~/lib/colors";

/**
 * The face of a timeline block: emoji and title with the time under it, or beside it when the
 * block is too short for two lines. The time is dropped when the block is too narrow for it
 * (under 8rem, e.g. several blocks side by side). The planner, its drop preview and the landing
 * page mockups all draw blocks with this, so they look alike. Controls such as the completion
 * ring go in the slots: `leading` before the text, the default one after it.
 */
const props = defineProps<{
  emoji: string;
  title: string;
  /** e.g. "9:00 – 11:00 AM" */
  time?: string;
  color: string;
  done?: boolean;
  /** One line, title and time side by side: for blocks shorter than half an hour. */
  short?: boolean;
  /** Lines the title may wrap to on a two-line block. */
  lines?: 1 | 2;
}>();

const tone = computed(() => paletteOf(props.color));
</script>

<template>
  <div
    :class="[
      '@container flex gap-2 overflow-hidden rounded-md border pl-2.5 pr-2',
      short ? 'items-center' : 'items-start pt-1',
      done ? tone.blockDone : tone.block,
    ]"
  >
    <slot name="leading" />
    <div :class="['min-w-0 flex-1', short && 'flex items-baseline gap-2']">
      <p
        :class="[
          'text-[13px] font-medium leading-4',
          !short && lines === 2 ? 'line-clamp-2 break-words' : 'truncate',
        ]"
      >
        <template v-if="emoji"><span :class="done && 'opacity-50'">{{ emoji }}</span>&nbsp;</template>{{ title }}
      </p>
      <p
        v-if="time"
        :class="[
          'text-xs leading-4 tabular-nums',
          short ? 'hidden shrink-0 @[15rem]:block' : 'mt-px truncate @max-[8rem]:hidden',
          done ? 'opacity-80' : tone.meta,
        ]"
      >
        {{ time }}
      </p>
    </div>
    <slot />
  </div>
</template>
