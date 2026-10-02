<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  adding: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: { title: string; emoji: string; scope: "default" | "day" }): void;
}>();

const HABIT_EMOJIS = [
  "💊", "🥤", "🚿", "💧", "🧘", "🏋️", "🏃", "🥗", "🍳",
  "📚", "🧹", "☀️", "🌙", "🦷", "🛌", "🚶", "☕", "✨",
];

const SCOPES = [
  { value: "default", label: "Every day" },
  { value: "day", label: "Only this day" },
] as const;

const newTitle = ref("");
const newEmoji = ref("💊");
const showEmojiPicker = ref(false);
const newScope = ref<"default" | "day">("default");

const handleSubmit = () => {
  const title = newTitle.value.trim();
  if (!title) return;
  emit("submit", { title, emoji: newEmoji.value, scope: newScope.value });
  newTitle.value = "";
  const currentIndex = HABIT_EMOJIS.indexOf(newEmoji.value);
  if (currentIndex >= 0 && currentIndex < HABIT_EMOJIS.length - 1) {
    newEmoji.value = HABIT_EMOJIS[currentIndex + 1];
  }
  showEmojiPicker.value = false;
};
</script>

<template>
  <div class="shrink-0 border-t border-border px-3 pb-3 pt-3">
    <form
      class="flex items-center gap-1 rounded-xl border border-input bg-background p-1 shadow-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
      @submit.prevent="handleSubmit"
    >
      <!-- Emoji picker button -->
      <div class="relative shrink-0">
        <button
          type="button"
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base transition-colors hover:bg-accent touch:h-11 touch:w-11 touch:text-lg"
          title="Pick emoji"
          aria-label="Pick emoji"
          :aria-expanded="showEmojiPicker"
          @click="showEmojiPicker = !showEmojiPicker"
        >
          {{ newEmoji }}
        </button>

        <div v-if="showEmojiPicker" class="fixed inset-0 z-30" @click="showEmojiPicker = false" />
        <div
          v-if="showEmojiPicker"
          class="absolute bottom-full left-0 z-40 mb-2 grid w-52 grid-cols-6 gap-1 rounded-xl border border-border bg-popover p-2 shadow-lg touch:w-72"
        >
          <button
            v-for="e in HABIT_EMOJIS"
            :key="e"
            type="button"
            class="flex h-8 w-full cursor-pointer items-center justify-center rounded-md text-base transition-colors hover:bg-accent touch:h-11 touch:text-xl"
            :class="newEmoji === e ? 'bg-accent' : ''"
            @click="newEmoji = e; showEmojiPicker = false"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <input
        v-model="newTitle"
        type="text"
        enterkeyhint="done"
        autocomplete="off"
        aria-label="New checklist item"
        :placeholder="newScope === 'day' ? 'Add for this day…' : 'Add a habit…'"
        maxlength="100"
        class="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none touch:h-11"
      />

      <button
        type="submit"
        :disabled="!newTitle.trim() || adding"
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-30 touch:h-11 touch:w-11"
        :aria-label="adding ? 'Adding…' : 'Add item'"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M10 4.5v11M4.5 10h11" />
        </svg>
      </button>
    </form>

    <!-- Scope: the default list applies to every day, a one-off only to this one -->
    <div class="mt-2 inline-flex items-center rounded-lg bg-muted p-0.5 text-xs text-muted-foreground touch:text-sm" role="group" aria-label="Where to add the item">
      <button
        v-for="scope in SCOPES"
        :key="scope.value"
        type="button"
        class="inline-flex h-7 cursor-pointer items-center justify-center rounded-md px-2.5 font-medium transition-colors touch:h-10 touch:px-4"
        :class="newScope === scope.value ? 'bg-background text-foreground shadow-xs' : 'hover:text-foreground'"
        :aria-pressed="newScope === scope.value"
        @click="newScope = scope.value"
      >
        {{ scope.label }}
      </button>
    </div>
  </div>
</template>
