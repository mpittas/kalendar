<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  adding: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: { title: string; emoji: string; scope: "default" | "day" }): void;
}>();

const HABIT_EMOJIS = [
  "💊", "🥤", "🚿", "💧", "🧘", "🏋️", "🏃", "🥗", "🍳",
  "📚", "🧹", "☀️", "🌙", "🦷", "🛌", "🚶", "☕", "✨",
];

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
  <div class="border-t border-border bg-card p-3 space-y-2">
    <!-- Scope: the default list applies to every day, a one-off only to this one -->
    <div class="inline-flex h-8 w-full items-center rounded-lg bg-muted p-0.5 text-xs text-muted-foreground" role="group" aria-label="Where to add the item">
      <button
        type="button"
        @click="newScope = 'default'"
        class="inline-flex h-7 flex-1 items-center justify-center rounded-md px-2 font-medium transition cursor-pointer"
        :class="newScope === 'default' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'"
        :aria-pressed="newScope === 'default'"
      >
        Every day
      </button>
      <button
        type="button"
        @click="newScope = 'day'"
        class="inline-flex h-7 flex-1 items-center justify-center rounded-md px-2 font-medium transition cursor-pointer"
        :class="newScope === 'day' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'"
        :aria-pressed="newScope === 'day'"
      >
        Only this day
      </button>
    </div>
    <form @submit.prevent="handleSubmit" class="space-y-2">
      <div class="flex items-center gap-1.5">
        <!-- Emoji picker button -->
        <div class="relative">
          <button
            type="button"
            @click="showEmojiPicker = !showEmojiPicker"
            class="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-base shadow-xs hover:bg-accent cursor-pointer"
            title="Pick emoji"
          >
            {{ newEmoji }}
          </button>

          <!-- Emoji dropdown -->
          <div
            v-if="showEmojiPicker"
            class="fixed inset-0 z-30"
            @click="showEmojiPicker = false"
          />
          <div
            v-if="showEmojiPicker"
            class="absolute bottom-11 left-0 z-40 grid w-48 grid-cols-6 gap-1 rounded-xl border border-border bg-popover p-2 shadow-lg"
          >
            <button
              v-for="e in HABIT_EMOJIS"
              :key="e"
              type="button"
              @click="newEmoji = e; showEmojiPicker = false"
              class="flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-accent cursor-pointer"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <!-- Input -->
        <input
          v-model="newTitle"
          type="text"
          :placeholder="newScope === 'day' ? 'Add for this day only…' : 'Add habit (e.g. pills, shake)…'"
          maxlength="100"
          class="min-w-0 flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        <!-- Submit -->
        <button
          type="submit"
          :disabled="!newTitle.trim() || adding"
          class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
        >
          {{ adding ? "..." : "Add" }}
        </button>
      </div>
    </form>
  </div>
</template>
