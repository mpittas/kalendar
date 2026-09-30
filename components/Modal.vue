<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
  subtitle?: string;
  wide?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.open) {
    emit("close");
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (import.meta.client) {
      if (isOpen) {
        window.addEventListener("keydown", handleKeydown);
      } else {
        window.removeEventListener("keydown", handleKeydown);
      }
    }
  },
);

onMounted(() => {
  if (props.open && typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
});
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
  >
    <div
      aria-hidden="true"
      class="absolute inset-0"
      @click="emit('close')"
    />
    <div
      role="dialog"
      aria-modal="true"
      :class="[
        'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl sm:rounded-xl border border-slate-200/80 bg-white shadow-xl',
        wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
      ]"
    >
      <header class="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-3.5">
        <div>
          <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
          <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500 tabular-nums">{{ subtitle }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </header>
      <div class="overflow-y-auto px-5 py-4">
        <slot />
      </div>
    </div>
  </div>
</template>
