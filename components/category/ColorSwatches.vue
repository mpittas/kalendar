<script setup lang="ts">
import { canonicalColor, COLOR_KEYS, PALETTE } from "~/lib/colors";

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();
</script>

<template>
  <div role="radiogroup" aria-label="Color" class="flex flex-wrap gap-1.5 touch:gap-2.5">
    <button
      v-for="key in COLOR_KEYS"
      :key="key"
      type="button"
      role="radio"
      :aria-checked="canonicalColor(modelValue) === key"
      :aria-label="PALETTE[key].label"
      :title="PALETTE[key].label"
      class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch:h-10 touch:w-10"
      :class="[PALETTE[key].swatch, canonicalColor(modelValue) === key ? 'ring-2 ring-foreground' : '']"
      @click="emit('update:modelValue', key)"
    >
      <svg v-if="canonicalColor(modelValue) === key" viewBox="0 0 16 16" class="h-3 w-3 text-white touch:h-4 touch:w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-6" />
      </svg>
    </button>
  </div>
</template>
