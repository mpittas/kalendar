<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { DayChecklistItem } from "@klndr/core";

const props = defineProps<{
  items: DayChecklistItem[];
  completedIds: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", id: string, completed: boolean): void;
  (e: "open-manager"): void;
}>();

const doneCount = computed(() => props.items.filter((item) => props.completedIds.includes(item.id)).length);

const strip = ref<HTMLElement | null>(null);
const canLeft = ref(false);
const canRight = ref(false);
const dragging = ref(false);

const updateEdges = () => {
  const el = strip.value;
  if (!el) return;
  canLeft.value = el.scrollLeft > 1;
  canRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  updateEdges();
  if (strip.value) {
    resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(strip.value);
  }
});
onBeforeUnmount(() => resizeObserver?.disconnect());
watch(() => props.items.length, () => nextTick(updateEdges));

const scrollByPage = (direction: -1 | 1) => {
  const el = strip.value;
  if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
};

// A vertical mouse wheel scrolls the strip sideways, unless it is already at that end (then the page gets the wheel).
const onWheel = (event: WheelEvent) => {
  const el = strip.value;
  if (!el || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  const atStart = el.scrollLeft <= 0 && event.deltaY < 0;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && event.deltaY > 0;
  if (el.scrollWidth <= el.clientWidth || atStart || atEnd) return;
  event.preventDefault();
  el.scrollLeft += event.deltaY;
};

// Click-and-drag with a mouse. Touch and pen already scroll natively.
const DRAG_THRESHOLD = 4;
let press: { x: number; scrollLeft: number; pointerId: number } | null = null;
let moved = false;

const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType !== "mouse" || event.button !== 0 || !strip.value) return;
  press = { x: event.clientX, scrollLeft: strip.value.scrollLeft, pointerId: event.pointerId };
  moved = false;
};

const onPointerMove = (event: PointerEvent) => {
  const el = strip.value;
  if (!press || !el) return;
  const dx = event.clientX - press.x;
  if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return;
  if (!moved) {
    moved = true;
    dragging.value = true;
    el.setPointerCapture(press.pointerId);
  }
  el.scrollLeft = press.scrollLeft - dx;
};

const endDrag = () => {
  press = null;
  dragging.value = false;
};

// A drag ends with a click on whichever chip is under the cursor; swallow it so dragging never ticks a routine.
const onClickCapture = (event: MouseEvent) => {
  if (!moved) return;
  event.stopPropagation();
  event.preventDefault();
  moved = false;
};

const edgeMask = computed(() => {
  const left = canLeft.value ? "transparent 0, black 28px" : "black 0";
  const right = canRight.value ? "black calc(100% - 28px), transparent 100%" : "black 100%";
  return `linear-gradient(to right, ${left}, ${right})`;
});

const arrowClass =
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-2xs transition hover:bg-accent hover:text-foreground";
</script>

<template>
  <div class="mx-auto max-w-4xl border-b border-border/40 px-3 pb-2 pt-3 sm:px-6">
    <div class="flex items-center gap-2">
      <span class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Routines
        <span class="font-mono font-medium normal-case tabular-nums" :class="doneCount === items.length ? 'text-emerald-600 dark:text-emerald-400' : ''">
          {{ doneCount }}/{{ items.length }}
        </span>
      </span>

      <button v-if="canLeft" type="button" :class="[arrowClass, 'max-lg:hidden']" aria-label="Scroll routines left" @click="scrollByPage(-1)">
        <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <div
        ref="strip"
        class="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1"
        :class="dragging ? 'cursor-grabbing select-none' : 'cursor-grab'"
        :style="{ maskImage: edgeMask, WebkitMaskImage: edgeMask }"
        @scroll.passive="updateEdges"
        @wheel="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @click.capture="onClickCapture"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          :aria-pressed="completedIds.includes(item.id)"
          class="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-2xs transition touch:min-h-10 touch:gap-2 touch:px-3.5 touch:text-[13px]"
          :class="completedIds.includes(item.id)
            ? 'border-border/60 bg-muted/50 text-muted-foreground line-through opacity-70'
            : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent'"
          @click="emit('toggle', item.id, !completedIds.includes(item.id))"
        >
          <span
            class="flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] transition touch:h-4.5 touch:w-4.5 touch:text-[10px]"
            :class="completedIds.includes(item.id)
              ? 'border-emerald-600 bg-emerald-600 font-bold text-white'
              : 'border-muted-foreground/40 text-transparent group-hover:border-foreground'"
            aria-hidden="true"
          >
            ✓
          </span>
          <span aria-hidden="true">{{ item.emoji }}</span>
          <span class="max-w-[12rem] truncate">{{ item.title }}</span>
        </button>
      </div>

      <button v-if="canRight" type="button" :class="[arrowClass, 'max-lg:hidden']" aria-label="Scroll routines right" @click="scrollByPage(1)">
        <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground touch:min-h-10 touch:px-3.5 touch:text-[13px]"
        title="Manage habits"
        @click="emit('open-manager')"
      >
        <Plus class="h-3 w-3" aria-hidden="true" />
        <span>Manage</span>
      </button>
    </div>
  </div>
</template>
