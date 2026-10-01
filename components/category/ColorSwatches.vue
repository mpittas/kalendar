<script setup lang="ts">
import { COLOR_KEYS, PALETTE } from "~/lib/colors";

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();
</script>

<template>
  <div role="radiogroup" aria-label="Color" class="flex flex-wrap gap-1.5">
    <button
      v-for="key in COLOR_KEYS"
      :key="key"
      type="button"
      role="radio"
      :aria-checked="modelValue === key"
      :aria-label="PALETTE[key].label"
      :title="PALETTE[key].label"
      class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :class="[PALETTE[key].swatch, modelValue === key ? 'ring-2 ring-foreground' : '']"
      @click="emit('update:modelValue', key)"
    >
      <svg v-if="modelValue === key" viewBox="0 0 16 16" class="h-3 w-3 text-white" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-6" />
      </svg>
    </button>
  </div>
</template>
