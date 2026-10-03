<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { renderMarkdown, toggleTaskLine, type DayNotes } from "@klndr/core";
import { api } from "~/lib/api";

const MAX_LENGTH = 20_000;
const SAVE_DELAY_MS = 700;

const props = defineProps<{
  day: string;
  /** The saved text for `day`. */
  text: string;
  state: "loading" | "ready" | "error";
}>();

const emit = defineEmits<{
  (e: "saved", dayNotes: DayNotes): void;
  (e: "retry"): void;
}>();

const draft = ref(props.text);
const editing = ref(!props.text);
const status = ref<"idle" | "saving" | "saved" | "error">("idle");
const areaRef = ref<HTMLTextAreaElement | null>(null);

const html = computed(() => renderMarkdown(draft.value));

// ---- Saving: debounced, one request at a time, always sending the latest text ----
let pending: { day: string; text: string } | null = null;
let timer: number | null = null;
let inFlight = false;

const send = async () => {
  if (inFlight || !pending) return;
  const job = pending;
  pending = null;
  inFlight = true;
  status.value = "saving";
  try {
    const saved = await api.saveDayNotes(job.day, job.text);
    emit("saved", saved);
    if (!pending) status.value = "saved";
  } catch {
    // Put the text back so the retry (or the next edit) sends it again.
    pending ??= job;
    status.value = "error";
  } finally {
    inFlight = false;
  }
  if (pending && status.value !== "error") await send();
};

const flush = () => {
  if (timer !== null) window.clearTimeout(timer);
  timer = null;
  return send();
};

const queueSave = () => {
  pending = { day: props.day, text: draft.value };
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(flush, SAVE_DELAY_MS);
};

const onInput = () => {
  status.value = "idle";
  queueSave();
};

// Keep the editor in step with the server copy, but never clobber unsaved typing.
watch(
  () => [props.day, props.text] as const,
  async ([day], [previousDay]) => {
    if (day !== previousDay) {
      await flush(); // anything typed on the previous day is saved under that day
      status.value = "idle";
      draft.value = props.text;
      editing.value = !props.text;
      return;
    }
    if (!pending && !inFlight) draft.value = props.text;
  },
);

watch(
  () => props.state,
  (state, previous) => {
    if (state === "ready" && previous !== "ready") {
      draft.value = props.text;
      editing.value = !props.text;
      if (editing.value) focusEnd();
    }
  },
);

const focusEnd = async () => {
  await nextTick();
  const el = areaRef.value;
  if (!el) return;
  el.focus();
  el.setSelectionRange(el.value.length, el.value.length);
};

const startEditing = () => {
  if (props.state !== "ready") return;
  editing.value = true;
  focusEnd();
};

const stopEditing = () => {
  flush();
  if (draft.value.trim()) editing.value = false;
};

const onPreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest("a")) return; // let links open
  if (target instanceof HTMLInputElement && target.dataset.line) {
    draft.value = toggleTaskLine(draft.value, Number(target.dataset.line));
    queueSave();
    return;
  }
  startEditing();
};

const retry = () => {
  if (props.state === "error") emit("retry");
  else flush();
};

onBeforeUnmount(() => {
  if (timer !== null) window.clearTimeout(timer);
  send();
});
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-1 flex-col bg-background">
    <div v-if="state === 'loading'" class="space-y-2 p-4" aria-busy="true">
      <div class="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
    </div>

    <div v-else-if="state === 'error'" class="p-4 text-center text-sm text-muted-foreground">
      <p>Couldn't load the notes for this day.</p>
      <button
        type="button"
        class="mt-2 cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent"
        @click="emit('retry')"
      >
        Try again
      </button>
    </div>

    <template v-else>
      <textarea
        v-show="editing"
        ref="areaRef"
        v-model="draft"
        :maxlength="MAX_LENGTH"
        spellcheck="true"
        aria-label="Notes for this day"
        placeholder="Jot something down…&#10;&#10;# Heading   - list   - [ ] task   **bold**   `code`"
        class="min-h-0 w-full flex-1 resize-none bg-transparent px-4 py-3 pb-8 font-mono text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
        @input="onInput"
        @blur="stopEditing"
        @keydown.esc.stop.prevent="($event.target as HTMLTextAreaElement).blur()"
      />
      <div
        v-if="!editing"
        class="notes-prose min-h-0 flex-1 cursor-text overflow-y-auto px-4 py-3 pb-8 text-sm text-foreground"
        @click="onPreviewClick"
        v-html="html"
      />

      <p
        class="pointer-events-none absolute bottom-2 right-3 text-[11px] text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <template v-if="status === 'saving'">Saving…</template>
        <template v-else-if="status === 'saved'">Saved</template>
        <button
          v-else-if="status === 'error'"
          type="button"
          class="pointer-events-auto cursor-pointer font-medium text-destructive underline"
          @click="retry"
        >
          Couldn't save · Retry
        </button>
      </p>
    </template>
  </div>
</template>

<style scoped>
.notes-prose :deep(h1),
.notes-prose :deep(h2),
.notes-prose :deep(h3),
.notes-prose :deep(h4),
.notes-prose :deep(h5),
.notes-prose :deep(h6) {
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin: 1em 0 0.4em;
}
.notes-prose :deep(h1) { font-size: 1.25rem; }
.notes-prose :deep(h2) { font-size: 1.1rem; }
.notes-prose :deep(h3),
.notes-prose :deep(h4),
.notes-prose :deep(h5),
.notes-prose :deep(h6) { font-size: 0.95rem; }
.notes-prose :deep(> :first-child) { margin-top: 0; }
.notes-prose :deep(p),
.notes-prose :deep(ul),
.notes-prose :deep(ol),
.notes-prose :deep(blockquote),
.notes-prose :deep(pre) { margin: 0.5em 0; }
.notes-prose :deep(ul) { list-style: disc; padding-left: 1.25rem; }
.notes-prose :deep(ol) { list-style: decimal; padding-left: 1.25rem; }
.notes-prose :deep(li.task) { display: flex; align-items: baseline; gap: 0.5rem; list-style: none; margin-left: -1.25rem; }
.notes-prose :deep(li.task input) { cursor: pointer; accent-color: var(--color-primary); }
.notes-prose :deep(li.task.done span) { color: var(--color-muted-foreground); text-decoration: line-through; }
.notes-prose :deep(blockquote) { border-left: 2px solid var(--color-border); padding-left: 0.75rem; color: var(--color-muted-foreground); }
.notes-prose :deep(code) { background: var(--color-muted); border-radius: 0.25rem; padding: 0.1em 0.35em; font-size: 0.85em; }
.notes-prose :deep(pre) { background: var(--color-muted); border-radius: 0.5rem; padding: 0.6rem 0.75rem; overflow-x: auto; }
.notes-prose :deep(pre code) { background: none; padding: 0; }
.notes-prose :deep(a) { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; }
.notes-prose :deep(hr) { border-color: var(--color-border); margin: 1em 0; }
</style>
