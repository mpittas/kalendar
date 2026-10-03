<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import { ref, computed, watch } from "vue";
import type { ChecklistItem, DayChecklist, DayChecklistItem } from "~/lib/types";
import { api } from "~/lib/api";
import ChecklistHeader from "~/components/daily-checklist/ChecklistHeader.vue";
import ChecklistItemRow from "~/components/daily-checklist/ChecklistItemRow.vue";
import ChecklistQuickAdd from "~/components/daily-checklist/ChecklistQuickAdd.vue";

const props = defineProps<{
  day: string;
  items: DayChecklistItem[];
  skippedItems: ChecklistItem[];
  completedIds: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", itemId: string, completed: boolean): void;
  (e: "created", item: ChecklistItem): void;
  (e: "updated", item: ChecklistItem): void;
  (e: "deleted", id: string): void;
  (e: "day-changed", dayChecklist: DayChecklist, message: string): void;
}>();

const HABIT_EMOJIS = [
  "💊", "🥤", "🚿", "💧", "🧘", "🏋️", "🏃", "🥗", "🍳",
  "📚", "🧹", "☀️", "🌙", "🦷", "🛌", "🚶", "☕", "✨",
];

const adding = ref(false);
const editingItem = ref<ChecklistItem | null>(null);
const editTitle = ref("");
const editEmoji = ref("");
const saving = ref(false);
// Only one row shows its actions at a time.
const expandedId = ref<string | null>(null);
const toggleActions = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};
watch(() => props.day, () => { expandedId.value = null; });

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

const handleAddSubmitted = async (payload: { title: string; emoji: string; scope: "default" | "day" }) => {
  adding.value = true;
  try {
    if (payload.scope === "day") {
      const dayChecklist = await api.addDayChecklistExtra(props.day, { title: payload.title, emoji: payload.emoji });
      emit("day-changed", dayChecklist, `Added "${payload.title}" for this day`);
    } else {
      const item = await api.createChecklistItem({
        title: payload.title,
        emoji: payload.emoji,
        order: props.items.filter((i) => i.scope === "default").length + props.skippedItems.length + 1,
      });
      emit("created", item);
    }
  } catch (err: any) {
    alert(err?.message || "Failed to add item");
  } finally {
    adding.value = false;
  }
};

const startEdit = (item: DayChecklistItem) => {
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

const skipForDay = async (item: ChecklistItem, hidden: boolean) => {
  try {
    const dayChecklist = await api.hideChecklistItem(props.day, item.id, hidden);
    emit("day-changed", dayChecklist, hidden ? `Skipped "${item.title}" for this day` : `Restored "${item.title}"`);
  } catch (err: any) {
    alert(err?.message || "Failed to update this day");
  }
};

const removeExtra = async (item: DayChecklistItem) => {
  try {
    const dayChecklist = await api.removeDayChecklistExtra(props.day, item.id);
    emit("day-changed", dayChecklist, `Removed "${item.title}"`);
  } catch (err: any) {
    alert(err?.message || "Failed to remove item");
  }
};

const removeItem = async (item: DayChecklistItem) => {
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
    <ChecklistHeader
      v-if="totalCount > 0"
      :completed-count="completedCount"
      :total-count="totalCount"
      :percentage="percentage"
      :all-done="allDone"
    />

    <!-- Items list -->
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3" :class="totalCount > 0 ? 'pt-1' : 'pt-4'">
      <div v-if="items.length === 0" class="px-4 py-10 text-center">
        <p class="text-sm font-medium text-foreground">
          {{ skippedItems.length === 0 ? "No checklist items yet" : "Everything is skipped on this day" }}
        </p>
        <p v-if="skippedItems.length === 0" class="mt-1 text-xs text-muted-foreground">
          Add small habits below, like pills, a protein shake or a shower.
        </p>
      </div>

      <ul v-else class="space-y-px">
        <li v-for="item in items" :key="item.id">
          <ChecklistItemRow
            :item="item"
            :completed="isCompleted(item.id)"
            :expanded="expandedId === item.id"
            @toggle="toggle"
            @toggle-actions="toggleActions"
            @edit="startEdit"
            @skip="skipForDay"
            @remove="(it) => it.scope === 'day' ? removeExtra(it) : removeItem(it)"
          />
        </li>
      </ul>

      <!-- Default items skipped on this day only -->
      <details v-if="skippedItems.length > 0" class="group/skipped mt-3 border-t border-border/60 pt-1">
        <summary class="flex min-h-10 cursor-pointer list-none select-none items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground touch:min-h-11 touch:text-sm [&::-webkit-details-marker]:hidden">
          <ChevronRight class="h-3.5 w-3.5 transition-transform group-open/skipped:rotate-90" aria-hidden="true" />
          Skipped on this day
          <span class="tabular-nums">{{ skippedItems.length }}</span>
        </summary>
        <ul class="space-y-px">
          <li
            v-for="item in skippedItems"
            :key="item.id"
            class="flex min-h-11 items-center gap-2 rounded-lg py-1 pl-2 pr-1 text-sm text-muted-foreground"
          >
            <span class="shrink-0 leading-snug opacity-50" aria-hidden="true">{{ item.emoji }}</span>
            <span class="min-w-0 flex-1 break-words leading-snug">{{ item.title }}</span>
            <button
              type="button"
              class="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-md px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent touch:h-11 touch:px-4 touch:text-sm"
              @click="skipForDay(item, false)"
            >
              Restore
            </button>
          </li>
        </ul>
      </details>
    </div>

    <!-- Quick add footer -->
    <ChecklistQuickAdd
      :adding="adding"
      @submit="handleAddSubmitted"
    />

    <!-- Edit item (applies to every day) -->
    <Modal :open="Boolean(editingItem)" title="Edit checklist item" subtitle="Changes apply across all days." @close="cancelEdit">
      <form id="checklist-edit-form" class="space-y-4" @submit.prevent="saveEdit">
        <div role="group" aria-labelledby="checklist-edit-emoji">
          <span id="checklist-edit-emoji" class="block text-xs font-medium text-foreground">Emoji</span>
          <div class="mt-1.5 flex flex-wrap gap-1.5 touch:gap-2">
            <button
              v-for="e in HABIT_EMOJIS"
              :key="e"
              type="button"
              :aria-pressed="editEmoji === e"
              @click="editEmoji = e"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border text-base transition touch:h-11 touch:w-11 touch:text-xl"
              :class="editEmoji === e ? 'border-primary bg-primary text-primary-foreground shadow-xs' : 'border-input bg-background hover:bg-accent'"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <div>
          <label for="checklist-edit-title" class="block text-xs font-medium text-foreground">Title</label>
          <input
            id="checklist-edit-title"
            v-model="editTitle"
            type="text"
            required
            maxlength="100"
            autocomplete="off"
            enterkeyhint="done"
            class="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9"
          />
        </div>
      </form>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            @click="cancelEdit"
            class="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3.5 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground sm:h-9 sm:flex-none sm:text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="checklist-edit-form"
            :disabled="!editTitle.trim() || saving"
            class="inline-flex h-11 flex-[1.6] cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 sm:h-9 sm:flex-none sm:text-xs"
          >
            {{ saving ? "Saving…" : "Save changes" }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
