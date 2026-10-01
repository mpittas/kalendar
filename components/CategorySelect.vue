<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { ActivityTemplate } from "~/lib/types";

const DEFAULT_CATEGORIES = [
  "General",
  "Work",
  "Health & Fitness",
  "Personal",
  "Home & Chores",
  "Education",
  "Finance",
  "Social",
];

const props = defineProps<{
  modelValue: string;
  templates?: ActivityTemplate[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const isCustom = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const categoryOptions = computed(() => {
  const set = new Set<string>(DEFAULT_CATEGORIES);
  if (props.templates) {
    for (const t of props.templates) {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    }
  }
  if (props.modelValue && props.modelValue.trim() && !isCustom.value) {
    set.add(props.modelValue.trim());
  }

  return Array.from(set).sort((a, b) => {
    if (a === "General") return -1;
    if (b === "General") return 1;
    return a.localeCompare(b);
  });
});

watch(
  () => props.modelValue,
  (val) => {
    if (!isCustom.value && val && !categoryOptions.value.includes(val.trim())) {
      // If initialized with a value not in defaults or templates, keep it selected in options
    }
  },
  { immediate: true }
);

const onSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const val = target.value;
  if (val === "__NEW__") {
    isCustom.value = true;
    emit("update:modelValue", "");
    nextTick(() => {
      inputRef.value?.focus();
    });
  } else {
    isCustom.value = false;
    emit("update:modelValue", val);
  }
};

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};

const switchToDropdown = () => {
  isCustom.value = false;
  const fallback = props.modelValue.trim() || categoryOptions.value[0] || "General";
  emit("update:modelValue", fallback);
};
</script>

<template>
  <div class="relative flex items-center">
    <!-- Custom text input mode -->
    <template v-if="isCustom">
      <div class="relative flex w-full items-center">
        <input
          ref="inputRef"
          :value="modelValue"
          type="text"
          :placeholder="placeholder || 'Enter new category…'"
          class="h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @input="onInput"
          @keydown.esc="switchToDropdown"
        />
        <button
          type="button"
          title="Pick from existing categories"
          aria-label="Pick from existing categories"
          class="absolute right-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
          @click="switchToDropdown"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M4 6h12M4 10h12M4 14h12" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </template>

    <!-- Dropdown select mode -->
    <template v-else>
      <select
        :value="modelValue"
        class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        @change="onSelectChange"
      >
        <option v-for="cat in categoryOptions" :key="cat" :value="cat">
          {{ cat }}
        </option>
        <option value="__NEW__" class="font-medium text-primary">
          + Add new category…
        </option>
      </select>
    </template>
  </div>
</template>
