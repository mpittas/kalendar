<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
  subtitle?: string;
  wide?: boolean;
  lg?: boolean;
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
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-6"
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
        'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-xl border border-border bg-background shadow-lg',
        wide ? 'sm:max-w-2xl' : lg ? 'sm:max-w-xl' : 'sm:max-w-md'
      ]"
    >
      <div class="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" />
      <header class="flex items-start justify-between gap-4 border-b border-border px-6 py-4 bg-background">
        <div>
          <h2 class="text-base font-semibold leading-none tracking-tight text-foreground">{{ title }}</h2>
          <p v-if="subtitle" class="mt-1.5 text-xs text-muted-foreground tabular-nums">{{ subtitle }}</p>
        </div>
        <button
          type="button"
          class="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </header>
      <div class="overflow-y-auto px-6 py-5">
        <slot />
      </div>
    </div>
  </div>
</template>
