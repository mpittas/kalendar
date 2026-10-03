<script setup lang="ts">
import { Check } from "lucide-vue-next";
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
      <Check v-if="canonicalColor(modelValue) === key" class="h-3 w-3 text-white touch:h-4 touch:w-4" aria-hidden="true" :stroke-width="3" />
    </button>
  </div>
</template>
