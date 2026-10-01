<script setup lang="ts">
import { computed, ref } from "vue";
import { withImplicitCategories } from "~/composables/useCategories";
import type { LibraryTab } from "~/composables/useLibrary";
import type { ActivityTemplate } from "~/lib/types";
import ActivitiesPanel from "~/components/library/ActivitiesPanel.vue";
import CategoriesPanel from "~/components/library/CategoriesPanel.vue";

const props = defineProps<{ templates: ActivityTemplate[] }>();

const emit = defineEmits<{
  (e: "saved", template: ActivityTemplate): void;
  (e: "deleted", id: string): void;
  // Renaming or deleting a category rewrites its activities, so the parent reloads them.
  (e: "categories-changed"): void;
}>();

const { open, tab, hide } = useLibrary();
const { categories } = useCategories();

const tabs = computed<{ key: LibraryTab; label: string; count: number }[]>(() => [
  { key: "activities", label: "Activities", count: props.templates.length },
  { key: "categories", label: "Categories", count: withImplicitCategories(categories.value, props.templates).length },
]);

const tabRefs = ref<HTMLButtonElement[]>([]);
const onTabKeydown = (event: KeyboardEvent) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const next = tab.value === "activities" ? "categories" : "activities";
  tab.value = next;
  tabRefs.value[next === "activities" ? 0 : 1]?.focus();
  event.preventDefault();
};
</script>

<template>
  <Modal :open="open" title="Customize" subtitle="Your activities and the categories that group them." lg @close="hide">
    <div class="sm:min-h-[30rem]">
      <div
        role="tablist"
        aria-label="Customize"
        class="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        @keydown="onTabKeydown"
      >
        <button
          v-for="item in tabs"
          :id="`library-tab-${item.key}`"
          :key="item.key"
          :ref="(el) => { if (el) tabRefs[item.key === 'activities' ? 0 : 1] = el as HTMLButtonElement }"
          type="button"
          role="tab"
          :aria-selected="tab === item.key"
          :aria-controls="`library-panel-${item.key}`"
          :tabindex="tab === item.key ? 0 : -1"
          class="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          :class="tab === item.key
            ? 'bg-background text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'"
          @click="tab = item.key"
        >
          {{ item.label }}
          <span
            class="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums"
            :class="tab === item.key ? 'bg-muted text-foreground' : 'bg-background/60 text-muted-foreground'"
          >
            {{ item.count }}
          </span>
        </button>
      </div>

      <!-- Both panels stay mounted so a half-filled form survives a trip to the other tab. -->
      <div v-show="tab === 'activities'" id="library-panel-activities" role="tabpanel" aria-labelledby="library-tab-activities">
        <ActivitiesPanel
          :active="open"
          :templates="templates"
          @saved="(template) => emit('saved', template)"
          @deleted="(id) => emit('deleted', id)"
        />
      </div>
      <div v-show="tab === 'categories'" id="library-panel-categories" role="tabpanel" aria-labelledby="library-tab-categories">
        <CategoriesPanel :active="open && tab === 'categories'" :templates="templates" @changed="emit('categories-changed')" />
      </div>
    </div>
  </Modal>
</template>
