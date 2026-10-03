<script setup lang="ts">
import type { ActivityTemplate } from "~/lib/types";
import LibraryPanel from "~/components/library/LibraryPanel.vue";

defineProps<{ templates: ActivityTemplate[] }>();

const emit = defineEmits<{
  (e: "saved", template: ActivityTemplate): void;
  (e: "deleted", id: string): void;
  // Renaming or deleting a category rewrites its activities, so the parent reloads them.
  (e: "categories-changed"): void;
}>();

const { open, focus, hide } = useLibrary();
</script>

<template>
  <Modal :open="open" title="Activities & categories" subtitle="Edit everything in one place." lg @close="hide">
    <div class="sm:min-h-[30rem]">
      <LibraryPanel
        :active="open"
        :focus="focus"
        :templates="templates"
        @saved="(template) => emit('saved', template)"
        @deleted="(id) => emit('deleted', id)"
        @categories-changed="emit('categories-changed')"
      />
    </div>
  </Modal>
</template>
