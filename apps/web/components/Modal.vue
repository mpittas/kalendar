<script lang="ts">
// Shared by every open Modal, so only the top-most one reacts to Escape.
const openStack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
</script>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
  subtitle?: string;
  wide?: boolean;
  lg?: boolean;
  /** Content runs edge to edge (no padding) and brings its own height, e.g. notes or a list with a pinned footer. */
  flush?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const id = Symbol("modal");
const titleId = `modal-title-${useId()}`;
const dialogRef = ref<HTMLElement | null>(null);
let returnFocusTo: HTMLElement | null = null;

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && openStack[openStack.length - 1] === id) {
    emit("close");
  }
};

/** Keeps Tab inside the dialog. Listens on the dialog itself, so popovers teleported out of it are unaffected. */
const trapTab = (event: KeyboardEvent) => {
  if (event.key !== "Tab" || !dialogRef.value) return;
  const items = [...dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) {
    event.preventDefault();
    dialogRef.value.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === dialogRef.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

const activate = async () => {
  openStack.push(id);
  lockScroll();
  window.addEventListener("keydown", onKeydown);
  returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  const dialog = dialogRef.value;
  if (!dialog || dialog.contains(document.activeElement)) return; // a field inside already took focus
  // Never auto-focus a field on touch: it would raise the keyboard over half the sheet.
  const wantsField = window.matchMedia("(hover: hover)").matches;
  (wantsField ? dialog.querySelector<HTMLElement>("[autofocus]") : null)?.focus();
  if (!dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true });
};

const deactivate = () => {
  const index = openStack.indexOf(id);
  if (index === -1) return;
  openStack.splice(index, 1);
  unlockScroll();
  window.removeEventListener("keydown", onKeydown);
  if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true });
  returnFocusTo = null;
};

watch(
  () => props.open,
  (isOpen) => (isOpen ? activate() : deactivate()),
);
onMounted(() => {
  if (props.open) activate();
});
onBeforeUnmount(deactivate);

// ---- Swipe down on the grab handle / header to dismiss (phones only: the handle is hidden from `sm`) ----
const dragY = ref(0);
const dragging = ref(false);
let dragStart: { y: number; time: number } | null = null;

const onSheetPointerDown = (event: PointerEvent) => {
  if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("button")) return;
  dragStart = { y: event.clientY, time: event.timeStamp };
  dragging.value = true;
  try {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  } catch {
    /* the pointer is already gone; the gesture just won't be captured */
  }
};

const onSheetPointerMove = (event: PointerEvent) => {
  if (!dragStart) return;
  dragY.value = Math.max(0, event.clientY - dragStart.y);
};

const onSheetPointerUp = (event: PointerEvent) => {
  if (!dragStart) return;
  const distance = Math.max(0, event.clientY - dragStart.y);
  const velocity = distance / Math.max(1, event.timeStamp - dragStart.time); // px per ms
  dragStart = null;
  dragging.value = false;
  dragY.value = 0;
  if (distance > 120 || (distance > 40 && velocity > 0.6)) emit("close");
};
</script>

<template>
  <!-- In <body>, so a modal opened from inside another one is a sibling, not a descendant (focus trap, stacking). -->
  <Teleport to="body">
  <Transition name="modal">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-6"
    >
      <div aria-hidden="true" class="absolute inset-0" @click="emit('close')" />
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        :style="dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined"
        :class="[
          'modal-panel relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-lg focus:outline-none sm:max-h-[88dvh] sm:rounded-xl',
          wide ? 'sm:max-w-2xl' : lg ? 'sm:max-w-xl' : 'sm:max-w-md',
          dragging ? '' : 'transition-transform duration-200',
        ]"
        @keydown="trapTab"
      >
        <!-- Grab handle + header double as the swipe-to-dismiss area -->
        <div
          class="shrink-0 touch-none"
          @pointerdown="onSheetPointerDown"
          @pointermove="onSheetPointerMove"
          @pointerup="onSheetPointerUp"
          @pointercancel="onSheetPointerUp"
        >
          <div class="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-muted-foreground/30 sm:hidden" />
          <header class="flex items-start justify-between gap-3 border-b border-border bg-background py-3 pl-4 pr-2 sm:px-6 sm:py-4">
            <div class="min-w-0 self-center">
              <h2 :id="titleId" class="text-base font-semibold leading-tight tracking-tight text-foreground">{{ title }}</h2>
              <p v-if="subtitle" class="mt-1 text-xs text-muted-foreground tabular-nums">{{ subtitle }}</p>
            </div>
            <button
              type="button"
              class="-my-0.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-accent-foreground sm:my-0 sm:-mr-2 sm:h-8 sm:w-8"
              aria-label="Close"
              @click="emit('close')"
            >
              <X class="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
          </header>
        </div>

        <div
          :class="[
            'min-h-0 flex-1 overscroll-contain',
            flush
              ? 'flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]'
              : 'overflow-y-auto px-4 py-4 sm:px-6 sm:py-5',
            !flush && !$slots.footer ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : '',
          ]"
        >
          <slot />
        </div>

        <!-- Pinned below the scrolling body so the primary action never scrolls out of reach -->
        <div
          v-if="$slots.footer"
          class="shrink-0 border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.22s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.18s ease;
}
/* Phones: the sheet slides up from the bottom edge. */
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(100%);
}
/* From `sm` the dialog is centered, so it fades and settles in instead. */
@media (min-width: 640px) {
  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    transform: translateY(8px) scale(0.98);
    opacity: 0;
  }
}
</style>
