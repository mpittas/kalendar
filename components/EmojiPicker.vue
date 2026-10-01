<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { loadEmojiGroups, readRecentEmojis, rememberEmoji, searchEmojis } from "~/lib/emojis";
import type { EmojiGroup } from "~/lib/emojis";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

const PANEL_WIDTH = 328;
const PANEL_HEIGHT = 380;
const GAP = 6;
/** Phones get a bottom sheet instead of a popover anchored to the field. */
const SHEET_QUERY = "(max-width: 639px)";

const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);
const scrollRef = ref<HTMLDivElement | null>(null);
const groups = ref<EmojiGroup[]>([]);
const loading = ref(false);
const query = ref("");
const recent = ref<string[]>([]);
const activeGroup = ref("");
const hovered = ref<{ char: string; label: string } | null>(null);
const position = ref({ top: 0, left: 0 });
const isSheet = ref(false);
/** How much of the bottom of the screen the on-screen keyboard covers, so the sheet can sit above it. */
const keyboardInset = ref(0);

const results = computed(() => searchEmojis(groups.value, query.value));
const searching = computed(() => query.value.trim().length > 0);

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
  const below = window.innerHeight - rect.bottom - GAP;
  const top = below >= PANEL_HEIGHT || below >= rect.top
    ? rect.bottom + GAP
    : Math.max(8, rect.top - GAP - PANEL_HEIGHT);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8));
  position.value = { top, left };
};

const show = async () => {
  place();
  recent.value = readRecentEmojis();
  query.value = "";
  hovered.value = null;
  open.value = true;
  window.addEventListener("resize", place);
  window.visualViewport?.addEventListener("resize", syncKeyboard);
  if (!groups.value.length) {
    loading.value = true;
    groups.value = await loadEmojiGroups();
    loading.value = false;
  }
  activeGroup.value = groups.value[0]?.key ?? "";
  await nextTick();
  // On touch, focusing search would raise the keyboard over most of the picker; let people browse first.
  if (window.matchMedia("(hover: hover)").matches) searchRef.value?.focus();
};

const hide = () => {
  open.value = false;
  window.removeEventListener("resize", place);
  window.visualViewport?.removeEventListener("resize", syncKeyboard);
  triggerRef.value?.focus({ preventScroll: true });
};

const choose = (char: string) => {
  emit("update:modelValue", char);
  rememberEmoji(char);
  hide();
};

const jumpTo = (key: string) => {
  activeGroup.value = key;
  scrollRef.value?.querySelector(`[data-group="${key}"]`)?.scrollIntoView({ block: "start" });
};

const syncActiveGroup = () => {
  const container = scrollRef.value;
  if (!container || searching.value) return;
  const top = container.getBoundingClientRect().top;
  let current = groups.value[0]?.key ?? "";
  for (const el of container.querySelectorAll<HTMLElement>("[data-group]")) {
    if (el.getBoundingClientRect().top - top <= 8) current = el.dataset.group ?? current;
  }
  activeGroup.value = current;
};

watch(query, () => scrollRef.value?.scrollTo({ top: 0 }));
onBeforeUnmount(() => {
  window.removeEventListener("resize", place);
  window.visualViewport?.removeEventListener("resize", syncKeyboard);
});
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    aria-label="Choose icon"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open ? hide() : show()"
    class="flex h-full w-12 shrink-0 cursor-pointer items-center justify-center rounded-l-md text-xl transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none sm:w-11 sm:text-lg"
  >
    {{ modelValue || "📌" }}
  </button>

  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60]" :class="isSheet ? 'bg-black/40' : ''" @click="hide">
      <div
        role="dialog"
        aria-label="Emoji picker"
        class="fixed flex flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg"
        :class="isSheet ? 'inset-x-0 rounded-t-2xl border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]' : 'rounded-xl'"
        :style="isSheet
          ? { bottom: `${keyboardInset}px`, height: `min(75dvh, ${PANEL_HEIGHT + 80}px)` }
          : { top: `${position.top}px`, left: `${position.left}px`, width: `${PANEL_WIDTH}px`, height: `${PANEL_HEIGHT}px` }"
        @click.stop
        @keydown.esc.stop.prevent="hide"
      >
        <div v-if="isSheet" class="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <div class="flex items-center gap-2 border-b border-border p-2">
          <input
            ref="searchRef"
            v-model="query"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            placeholder="Search emoji…"
            aria-label="Search emoji"
            class="flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-8 sm:px-2.5"
          />
          <button
            v-if="isSheet"
            type="button"
            class="h-11 shrink-0 cursor-pointer rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            @click="hide"
          >
            Cancel
          </button>
        </div>

        <div v-if="!searching && groups.length" class="flex items-center justify-between border-b border-border px-1.5 py-1">
          <button
            v-for="group in groups"
            :key="group.key"
            type="button"
            :title="group.label"
            @click="jumpTo(group.key)"
            :class="[
              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-sm transition touch:h-10 touch:w-auto touch:flex-1',
              activeGroup === group.key ? 'bg-accent' : 'opacity-60 hover:bg-accent/60 hover:opacity-100'
            ]"
          >
            {{ group.icon }}
          </button>
        </div>

        <div ref="scrollRef" class="min-h-0 flex-1 overflow-y-auto px-2 pb-2" @scroll.passive="syncActiveGroup">
          <p v-if="loading" class="py-10 text-center text-xs text-muted-foreground">Loading emoji…</p>

          <template v-else-if="searching">
            <p v-if="!results.length" class="py-10 text-center text-xs text-muted-foreground">
              No emoji found for “{{ query.trim() }}”
            </p>
            <div v-else class="grid grid-cols-8 pt-2">
              <button
                v-for="emoji in results"
                :key="emoji.char"
                type="button"
                :title="emoji.label"
                @click="choose(emoji.char)"
                @mouseenter="hovered = emoji"
                class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xl transition hover:bg-accent touch:h-11 touch:w-full"
              >
                {{ emoji.char }}
              </button>
            </div>
          </template>

          <template v-else>
            <section v-if="recent.length">
              <h3 class="sticky top-0 bg-popover py-1.5 text-[11px] font-medium text-muted-foreground">Recent</h3>
              <div class="grid grid-cols-8">
                <button
                  v-for="char in recent"
                  :key="char"
                  type="button"
                  @click="choose(char)"
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xl transition hover:bg-accent touch:h-11 touch:w-full"
                >
                  {{ char }}
                </button>
              </div>
            </section>
            <section v-for="group in groups" :key="group.key" :data-group="group.key">
              <h3 class="sticky top-0 bg-popover py-1.5 text-[11px] font-medium text-muted-foreground">{{ group.label }}</h3>
              <div class="grid grid-cols-8">
                <button
                  v-for="emoji in group.emojis"
                  :key="emoji.char"
                  type="button"
                  :title="emoji.label"
                  @click="choose(emoji.char)"
                  @mouseenter="hovered = emoji"
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xl transition hover:bg-accent touch:h-11 touch:w-full"
                >
                  {{ emoji.char }}
                </button>
              </div>
            </section>
          </template>
        </div>

        <div v-if="!isSheet" class="flex h-8 shrink-0 items-center gap-2 border-t border-border px-3 text-xs text-muted-foreground">
          <template v-if="hovered">
            <span class="text-base">{{ hovered.char }}</span>
            <span class="truncate">{{ hovered.label }}</span>
          </template>
          <span v-else>Pick an icon</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
