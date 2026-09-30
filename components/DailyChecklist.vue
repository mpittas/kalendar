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
  <div class="flex h-full flex-col">
    <!-- Progress banner -->
    <div class="px-4 pt-3 pb-3 border-b border-slate-100">
      <div class="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-2xs">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-700 uppercase tracking-wider">Today's Progress</span>
          <span class="font-mono font-bold text-slate-900 tabular-nums">
            {{ completedCount }} / {{ totalCount }}
            <span class="text-slate-400 font-normal">({{ percentage }}%)</span>
          </span>
        </div>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="allDone ? 'bg-emerald-500' : 'bg-slate-900'"
            :style="{ width: `${percentage}%` }"
          />
        </div>
        <p v-if="allDone" class="mt-2 text-center text-xs font-semibold text-emerald-700 animate-fade-in">
          🎉 All habits completed for today!
        </p>
      </div>
    </div>

    <!-- Items list -->
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
      <p v-if="items.length === 0" class="py-10 text-center text-sm text-slate-400">
        No checklist items yet.<br />Add small habits below (e.g. pills, protein shake, shower).
      </p>

      <div
        v-for="item in items"
        :key="item.id"
        class="group relative flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50/80"
        :class="{ 'opacity-65': isCompleted(item.id) }"
      >
        <!-- Toggle button -->
        <button
          type="button"
          @click="toggle(item.id)"
          class="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg border transition shadow-2xs cursor-pointer"
          :class="isCompleted(item.id)
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-300 bg-white hover:border-slate-500 text-transparent'"
          :aria-label="isCompleted(item.id) ? `Mark ${item.title} as pending` : `Mark ${item.title} as completed`"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 10l3.5 3.5L15 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <!-- Emoji -->
        <span
          class="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200/90 text-base shadow-2xs select-none"
        >
          {{ item.emoji }}
        </span>

        <!-- Title -->
        <span
          @click="toggle(item.id)"
          class="min-w-0 flex-1 cursor-pointer select-none text-sm transition"
          :class="isCompleted(item.id)
            ? 'text-slate-400 line-through'
            : 'font-medium text-slate-800 hover:text-slate-900'"
        >
          {{ item.title }}
        </span>

        <!-- Actions (edit / delete) -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            @click="startEdit(item)"
            class="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            title="Edit item"
          >
            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            type="button"
            @click="removeItem(item)"
            class="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
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
    <div class="border-t border-slate-200/80 bg-white p-3 space-y-2.5">
      <form @submit.prevent="submitNew" class="space-y-2">
        <div class="flex items-center gap-1.5">
          <!-- Emoji picker button -->
          <div class="relative">
            <button
              type="button"
              @click="showEmojiPicker = !showEmojiPicker"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base shadow-2xs hover:bg-slate-100"
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
              class="absolute bottom-11 left-0 z-40 grid w-48 grid-cols-6 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            >
              <button
                v-for="e in HABIT_EMOJIS"
                :key="e"
                type="button"
                @click="newEmoji = e; showEmojiPicker = false"
                class="flex h-7 w-7 items-center justify-center rounded text-base hover:bg-slate-100"
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
            class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden"
          />

          <!-- Submit -->
          <button
            type="submit"
            :disabled="!newTitle.trim() || adding"
            class="flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-40"
          >
            {{ adding ? "..." : "Add" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Edit modal -->
    <div
      v-if="editingItem"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      @click.self="cancelEdit"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 class="text-base font-bold text-slate-900">Edit Checklist Item</h3>
        <p class="mt-1 text-xs text-slate-500">
          Changes will apply across all days.
        </p>

        <form @submit.prevent="saveEdit" class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500">Emoji</label>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <button
                v-for="e in HABIT_EMOJIS"
                :key="e"
                type="button"
                @click="editEmoji = e"
                class="flex h-8 w-8 items-center justify-center rounded-lg border text-lg transition"
                :class="editEmoji === e ? 'border-slate-900 bg-slate-100 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'"
              >
                {{ e }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500">Title</label>
            <input
              v-model="editTitle"
              type="text"
              required
              maxlength="100"
              class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-hidden"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="cancelEdit"
              class="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!editTitle.trim() || saving"
              class="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-40"
            >
              {{ saving ? "Saving…" : "Save changes" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
