<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { DURATION_CHOICES, formatDuration, type ActivityTemplate } from "@klndr/core";

export type ActivityDraft = {
  name: string;
  emoji: string;
  category: string;
  defaultDuration: number;
  notes: string;
};

const props = defineProps<{
  initial: ActivityDraft;
  templates: ActivityTemplate[];
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: "submit", draft: ActivityDraft): void;
  (e: "cancel"): void;
}>();

const draft = ref<ActivityDraft>({ ...props.initial });
const nameRef = ref<HTMLInputElement | null>(null);
const nameError = ref(false);

const submit = async () => {
  if (!draft.value.name.trim()) {
    nameError.value = true;
    nameRef.value?.focus();
    return;
  }
  emit("submit", { ...draft.value });
};

onMounted(async () => {
  await nextTick();
  nameRef.value?.focus();
});
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit" @keydown.esc.stop.prevent="emit('cancel')">
    <!-- Name + emoji -->
    <div>
      <label for="activity-name" class="text-xs font-medium text-foreground">Name</label>
      <div
        class="mt-1 flex h-11 w-full items-center rounded-md border bg-background shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring sm:h-9"
        :class="nameError ? 'border-destructive' : 'border-input'"
      >
        <EmojiPicker v-model="draft.emoji" />
        <span class="h-5 w-px shrink-0 bg-border" />
        <input
          id="activity-name"
          ref="nameRef"
          v-model="draft.name"
          maxlength="80"
          autocomplete="off"
          placeholder="e.g. Deep work, Gym, Read"
          class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
          @input="nameError = false"
        />
      </div>
      <p v-if="nameError" class="mt-1 text-xs font-medium text-destructive" role="alert">Give your activity a name.</p>
    </div>

    <!-- Category -->
    <div>
      <span class="text-xs font-medium text-foreground">Category</span>
      <CategorySelect :model-value="draft.category" :templates="templates" class="mt-1" @update:model-value="(name: string) => (draft.category = name)" />
    </div>

    <!-- Duration -->
    <div>
      <span class="text-xs font-medium text-foreground">Default length</span>
      <div role="radiogroup" aria-label="Default length" class="mt-1 flex flex-wrap gap-2 sm:gap-1.5">
        <button
          v-for="minutes in DURATION_CHOICES"
          :key="minutes"
          type="button"
          role="radio"
          :aria-checked="draft.defaultDuration === minutes"
          class="h-10 min-w-14 cursor-pointer rounded-md border px-3 text-sm font-medium tabular-nums transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-7 sm:min-w-11 sm:px-2 sm:text-xs"
          :class="draft.defaultDuration === minutes
            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
            : 'border-input bg-background text-foreground hover:bg-accent'"
          @click="draft.defaultDuration = minutes"
        >
          {{ formatDuration(minutes) }}
        </button>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label for="activity-notes" class="text-xs font-medium text-foreground">
        Notes <span class="font-normal text-muted-foreground">(optional)</span>
      </label>
      <textarea
        id="activity-notes"
        v-model="draft.notes"
        rows="1"
        maxlength="500"
        placeholder="A short description or intention"
        class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:py-1.5"
      />
    </div>

    <p v-if="error" class="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive" role="alert">
      {{ error }}
    </p>

    <div class="sticky -bottom-[max(1rem,env(safe-area-inset-bottom))] -mx-4 -mb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:mb-0 sm:justify-end sm:border-t-0 sm:px-0 sm:pb-0 sm:pt-1">
      <button
        type="button"
        class="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent sm:h-8 sm:flex-none"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="busy"
        class="inline-flex h-11 flex-[1.6] cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:flex-none"
      >
        {{ busy ? "Saving…" : submitLabel }}
      </button>
    </div>
  </form>
</template>
