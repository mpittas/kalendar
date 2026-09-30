<script setup lang="ts">
import { ref, computed } from "vue";
import type { ChecklistItem } from "~/lib/types";
import { api } from "~/lib/api";

const props = defineProps<{
  day: string;
  items: ChecklistItem[];
  completedIds: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", itemId: string, completed: boolean): void;
  (e: "created", item: ChecklistItem): void;
  (e: "updated", item: ChecklistItem): void;
  (e: "deleted", id: string): void;
}>();

const HABIT_EMOJIS = [
  "💊", "🥤", "🚿", "💧", "🧘", "🏋️", "🏃", "🥗", "🍳",
  "📚", "🧹", "☀️", "🌙", "🦷", "🛌", "🚶", "☕", "✨",
];

const newTitle = ref("");
const newEmoji = ref("💊");
const showEmojiPicker = ref(false);
const adding = ref(false);

const editingItem = ref<ChecklistItem | null>(null);
const editTitle = ref("");
const editEmoji = ref("");
const saving = ref(false);

const totalCount = computed(() => props.items.length);
const completedCount = computed(() => {
  const set = new Set(props.completedIds);
  return props.items.filter((item) => set.has(item.id)).length;
});

const percentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((completedCount.value / totalCount.value) * 100);
});

const allDone = computed(() => totalCount.value > 0 && completedCount.value === totalCount.value);

const isCompleted = (itemId: string) => props.completedIds.includes(itemId);

const toggle = (itemId: string) => {
  const nextCompleted = !isCompleted(itemId);
  emit("toggle", itemId, nextCompleted);
};

const submitNew = async () => {
  const title = newTitle.value.trim();
  if (!title) return;
  adding.value = true;
  try {
    const item = await api.createChecklistItem({
      title,
      emoji: newEmoji.value,
      order: props.items.length + 1,
    });
    emit("created", item);
    newTitle.value = "";
    const currentIndex = HABIT_EMOJIS.indexOf(newEmoji.value);
    if (currentIndex >= 0 && currentIndex < HABIT_EMOJIS.length - 1) {
      newEmoji.value = HABIT_EMOJIS[currentIndex + 1];
    }
    showEmojiPicker.value = false;
  } catch (err: any) {
    alert(err?.message || "Failed to add item");
  } finally {
    adding.value = false;
  }
};

const startEdit = (item: ChecklistItem) => {
  editingItem.value = item;
  editTitle.value = item.title;
  editEmoji.value = item.emoji;
};

const cancelEdit = () => {
  editingItem.value = null;
};

const saveEdit = async () => {
  if (!editingItem.value) return;
  const title = editTitle.value.trim();
  if (!title) return;
  saving.value = true;
  try {
    const updated = await api.updateChecklistItem(editingItem.value.id, {
      title,
      emoji: editEmoji.value,
    });
    emit("updated", updated);
    editingItem.value = null;
  } catch (err: any) {
    alert(err?.message || "Failed to update item");
  } finally {
    saving.value = false;
  }
};

const removeItem = async (item: ChecklistItem) => {
  if (!confirm(`Delete "${item.title}" from your daily checklist?`)) return;
  try {
    await api.deleteChecklistItem(item.id);
    emit("deleted", item.id);
    if (editingItem.value?.id === item.id) {
      editingItem.value = null;
    }
  } catch (err: any) {
    alert(err?.message || "Failed to delete item");
  }
};
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Progress banner -->
    <div class="px-4 pt-3 pb-3 border-b border-border">
      <div class="rounded-xl border border-border bg-card p-3 shadow-xs">
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Today's Progress</span>
          <span class="font-mono font-semibold text-foreground tabular-nums">
            {{ completedCount }} / {{ totalCount }}
            <span class="text-muted-foreground font-normal">({{ percentage }}%)</span>
          </span>
        </div>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="allDone ? 'bg-emerald-500' : 'bg-primary'"
            :style="{ width: `${percentage}%` }"
          />
        </div>
        <p v-if="allDone" class="mt-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
          🎉 All habits completed for today!
        </p>
      </div>
    </div>

    <!-- Items list -->
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
      <p v-if="items.length === 0" class="py-10 text-center text-sm text-muted-foreground">
        No checklist items yet.<br />Add small habits below (e.g. pills, protein shake, shower).
      </p>

      <div
        v-for="item in items"
        :key="item.id"
        class="group relative flex items-center gap-2.5 rounded-lg border border-transparent p-2 transition hover:border-border hover:bg-accent/40"
        :class="{ 'opacity-60': isCompleted(item.id) }"
      >
        <!-- Toggle checkbox -->
        <button
          type="button"
          @click="toggle(item.id)"
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border transition shadow-2xs cursor-pointer"
          :class="isCompleted(item.id)
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-input bg-background hover:border-foreground/50 text-transparent'"
          :aria-label="isCompleted(item.id) ? `Mark ${item.title} as pending` : `Mark ${item.title} as completed`"
        >
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 10l3.5 3.5L15 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <!-- Emoji -->
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-sm shadow-2xs select-none"
        >
          {{ item.emoji }}
        </span>

        <!-- Title -->
        <span
          @click="toggle(item.id)"
          class="min-w-0 flex-1 cursor-pointer select-none text-sm transition"
          :class="isCompleted(item.id)
            ? 'text-muted-foreground line-through'
            : 'font-medium text-foreground hover:text-foreground/90'"
        >
          {{ item.title }}
        </span>

        <!-- Actions (edit / delete) -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            @click="startEdit(item)"
            class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            title="Edit item"
          >
            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            type="button"
            @click="removeItem(item)"
            class="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            title="Delete item"
          >
            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 7v9a2 2 0 002 2h4a2 2 0 002-2V7M4 7h12M9 4h2a1 1 0 011 1v1H8V5a1 1 0 011-1z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick add footer -->
    <div class="border-t border-border bg-card p-3 space-y-2">
      <form @submit.prevent="submitNew" class="space-y-2">
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
            placeholder="Add habit (e.g. pills, shake)…"
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

    <!-- Edit modal -->
    <div
      v-if="editingItem"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      @click.self="cancelEdit"
    >
      <div class="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-lg">
        <h3 class="text-base font-semibold leading-none tracking-tight text-foreground">Edit Checklist Item</h3>
        <p class="mt-1.5 text-xs text-muted-foreground">
          Changes will apply across all days.
        </p>

        <form @submit.prevent="saveEdit" class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-medium text-foreground">Emoji</label>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <button
                v-for="e in HABIT_EMOJIS"
                :key="e"
                type="button"
                @click="editEmoji = e"
                class="flex h-8 w-8 items-center justify-center rounded-md border text-base transition cursor-pointer"
                :class="editEmoji === e ? 'border-primary bg-primary text-primary-foreground shadow-xs' : 'border-input bg-background hover:bg-accent'"
              >
                {{ e }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-foreground">Title</label>
            <input
              v-model="editTitle"
              type="text"
              required
              maxlength="100"
              class="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              @click="cancelEdit"
              class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!editTitle.trim() || saving"
              class="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
            >
              {{ saving ? "Saving…" : "Save changes" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
