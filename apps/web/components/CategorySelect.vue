<script setup lang="ts">
import { Check, ChevronDown, Plus, SlidersHorizontal } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { paletteOf } from "~/lib/colors";
import { withImplicitCategories, type ActivityTemplate } from "@klndr/core";

const props = defineProps<{
  modelValue: string;
  templates?: ActivityTemplate[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const { categories, load, create, nextColor } = useCategories();
const { show: showLibrary } = useLibrary();
onMounted(() => load());

const PANEL_MAX_HEIGHT = 340;
const GAP = 6;
/** Phones get a bottom sheet instead of a popover anchored to the field. */
const SHEET_QUERY = "(max-width: 639px)";

const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLDivElement | null>(null);
const newInputRef = ref<HTMLInputElement | null>(null);
const position = ref({ top: 0, left: 0, width: 240, maxHeight: PANEL_MAX_HEIGHT });
const isSheet = ref(false);
/** How much of the bottom of the screen the on-screen keyboard covers, so the sheet can sit above it. */
const keyboardInset = ref(0);

const creating = ref(false);
const newName = ref("");
const newError = ref<string | null>(null);
const busy = ref(false);

const entries = computed(() => {
  const list = withImplicitCategories(categories.value, props.templates);
  const current = props.modelValue?.trim();
  // The current value may not be saved anywhere yet (e.g. a brand-new typed name).
  if (current && !list.some((c) => c.name.toLowerCase() === current.toLowerCase())) {
    list.push({ id: null, name: current, color: "slate" });
  }
  return list;
});

const selected = computed(() => entries.value.find((c) => c.name.toLowerCase() === props.modelValue?.trim().toLowerCase()));

const syncKeyboard = () => {
  const viewport = window.visualViewport;
  keyboardInset.value = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
};

const place = () => {
  isSheet.value = window.matchMedia(SHEET_QUERY).matches;
  syncKeyboard();
  if (isSheet.value) return;
  const rect = triggerRef.value?.getBoundingClientRect();
  if (!rect) return;
  const below = window.innerHeight - rect.bottom - GAP - 8;
  const above = rect.top - GAP - 8;
  const openUp = below < 220 && above > below;
  const maxHeight = Math.min(PANEL_MAX_HEIGHT, openUp ? above : below);
  const width = Math.max(rect.width, 240);
  position.value = {
    top: openUp ? rect.top - GAP - maxHeight : rect.bottom + GAP,
    left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
    width,
    maxHeight,
  };
};

const show = async () => {
  place();
  open.value = true;
  creating.value = false;
  window.addEventListener("resize", place);
  window.visualViewport?.addEventListener("resize", syncKeyboard);
  await nextTick();
  const active = panelRef.value?.querySelector<HTMLElement>('[aria-selected="true"]') ?? panelRef.value?.querySelector<HTMLElement>("[role=option]");
  active?.focus({ preventScroll: true });
  active?.scrollIntoView({ block: "nearest" });
};

const hide = () => {
  open.value = false;
  creating.value = false;
  newName.value = "";
  newError.value = null;
  window.removeEventListener("resize", place);
  window.visualViewport?.removeEventListener("resize", syncKeyboard);
  triggerRef.value?.focus({ preventScroll: true });
};

const choose = (name: string) => {
  emit("update:modelValue", name);
  hide();
};

const startCreating = async () => {
  creating.value = true;
  newError.value = null;
  await nextTick();
  newInputRef.value?.focus();
};

const submitNew = async () => {
  const name = newName.value.trim();
  if (!name || busy.value) return;
  const existing = entries.value.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return choose(existing.name);
  busy.value = true;
  newError.value = null;
  try {
    const created = await create({ name, color: nextColor() });
    choose(created.name);
  } catch (err) {
    newError.value = err instanceof Error ? err.message : "Could not add category";
  } finally {
    busy.value = false;
  }
};

const manage = () => {
  hide();
  showLibrary({ kind: "new-category" });
};

// Arrow keys move through the options.
const onListKeydown = (event: KeyboardEvent) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const options = [...(panelRef.value?.querySelectorAll<HTMLElement>("[role=option]") ?? [])];
  const index = options.indexOf(document.activeElement as HTMLElement);
  const next = event.key === "ArrowDown" ? index + 1 : index - 1;
  options[Math.max(0, Math.min(options.length - 1, next))]?.focus();
  event.preventDefault();
};

onBeforeUnmount(() => {
  window.removeEventListener("resize", place);
  window.visualViewport?.removeEventListener("resize", syncKeyboard);
});
</script>

<template>
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      class="flex h-11 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-2.5 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9 sm:px-2"
      @click="open ? hide() : show()"
    >
      <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="paletteOf(selected?.color ?? 'slate').dot" />
      <span class="min-w-0 flex-1 truncate text-foreground">{{ modelValue || "Choose a category" }}</span>
      <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <div v-if="open" class="fixed inset-0 z-[60]" :class="isSheet ? 'bg-black/40' : ''" @click="hide">
        <div
          ref="panelRef"
          class="fixed flex flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg"
          :class="isSheet ? 'inset-x-0 rounded-t-2xl border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]' : 'rounded-xl'"
          :style="isSheet
            ? { bottom: `${keyboardInset}px`, maxHeight: `min(70dvh, ${PANEL_MAX_HEIGHT + 100}px)` }
            : { top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px`, maxHeight: `${position.maxHeight}px` }"
          @click.stop
          @keydown.esc.stop.prevent="hide"
        >
          <div v-if="isSheet" class="shrink-0 border-b border-border px-4 pb-2.5 pt-2.5">
            <div class="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            <p class="mt-2 text-sm font-semibold text-foreground">Category</p>
          </div>
          <ul role="listbox" aria-label="Categories" class="min-h-0 flex-1 overflow-y-auto p-1" @keydown="onListKeydown">
            <li v-for="entry in entries" :key="entry.name" role="presentation">
              <button
                type="button"
                role="option"
                :aria-selected="entry.name.toLowerCase() === modelValue?.trim().toLowerCase()"
                class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none touch:min-h-12 touch:px-3"
                @click="choose(entry.name)"
              >
                <span class="flex h-6 w-6 shrink-0 items-center justify-center">
                  <span class="h-2.5 w-2.5 rounded-full" :class="paletteOf(entry.color).dot" />
                </span>
                <span class="min-w-0 flex-1 truncate font-medium text-foreground">{{ entry.name }}</span>
                <Check v-if="entry.name.toLowerCase() === modelValue?.trim().toLowerCase()" class="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" :stroke-width="3" />
              </button>
            </li>
            <li v-if="!entries.length" class="px-3 py-4 text-center text-xs text-muted-foreground">No categories yet</li>
          </ul>

          <div class="shrink-0 border-t border-border p-1">
            <form v-if="creating" class="p-1" @submit.prevent="submitNew">
              <div class="flex gap-1.5">
                <input
                  ref="newInputRef"
                  v-model="newName"
                  type="text"
                  maxlength="40"
                  autocomplete="off"
                  placeholder="New category name"
                  class="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-8"
                  @input="newError = null"
                />
                <button
                  type="submit"
                  :disabled="busy || !newName.trim()"
                  class="h-10 shrink-0 cursor-pointer rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:px-3 sm:text-xs"
                >
                  Add
                </button>
              </div>
              <p v-if="newError" class="mt-1.5 text-xs font-medium text-destructive" role="alert">{{ newError }}</p>
            </form>
            <template v-else>
              <button
                type="button"
                class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none touch:min-h-12 touch:px-3"
                @click="startCreating"
              >
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                  <Plus class="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                New category
              </button>
              <button
                type="button"
                class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:outline-none touch:min-h-12 touch:px-3"
                @click="manage"
              >
                <span class="flex h-6 w-6 shrink-0 items-center justify-center">
                  <SlidersHorizontal class="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                Manage categories…
              </button>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
