<script setup lang="ts">
import { ref } from "vue";
import Tooltip from "~/components/ui/tooltip/Tooltip.vue";
import TooltipContent from "~/components/ui/tooltip/TooltipContent.vue";
import TooltipProvider from "~/components/ui/tooltip/TooltipProvider.vue";
import TooltipTrigger from "~/components/ui/tooltip/TooltipTrigger.vue";

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
  { label: "Every day", everyDay: true, tip: "Shows up on every day's checklist." },
  { label: "This day only", everyDay: false, tip: "Only appears on the day you're viewing." },
];

const newTitle = ref("");
const newEmoji = ref("💊");
const showEmojiPicker = ref(false);
// The default list applies to every day; a one-off only to the day being viewed.
const everyDay = ref(true);

const handleSubmit = () => {
  const title = newTitle.value.trim();
  if (!title) return;
  emit("submit", { title, emoji: newEmoji.value, scope: everyDay.value ? "default" : "day" });
  newTitle.value = "";
  const currentIndex = HABIT_EMOJIS.indexOf(newEmoji.value);
  if (currentIndex >= 0 && currentIndex < HABIT_EMOJIS.length - 1) {
    newEmoji.value = HABIT_EMOJIS[currentIndex + 1];
  }
  showEmojiPicker.value = false;
};
</script>

<template>
  <div class="shrink-0 border-t border-border px-3 py-2.5">
    <form class="flex items-center gap-1" @submit.prevent="handleSubmit">
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
        placeholder="Add a habit…"
        maxlength="100"
        class="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none touch:h-11"
      />

      <!-- Shown once there is something to add -->
      <button
        v-if="newTitle.trim()"
        type="submit"
        :disabled="adding"
        class="flex h-9 shrink-0 cursor-pointer items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 touch:h-11 touch:px-4 touch:text-sm"
      >
        {{ adding ? "Adding…" : "Add" }}
      </button>
    </form>

    <TooltipProvider :delay-duration="150" :skip-delay-duration="300">
      <div class="mt-2 grid grid-cols-2 rounded-lg bg-muted p-0.5 text-xs touch:text-sm" role="radiogroup" aria-label="Where to add the item">
        <Tooltip v-for="option in SCOPES" :key="option.label">
          <TooltipTrigger as-child>
            <button
              type="button"
              role="radio"
              :aria-checked="everyDay === option.everyDay"
              class="inline-flex h-7 w-full cursor-pointer items-center justify-center rounded-md font-medium transition-colors touch:h-10"
              :class="everyDay === option.everyDay ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
              @click="everyDay = option.everyDay"
            >
              {{ option.label }}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{{ option.tip }}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>
