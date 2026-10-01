<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ScheduledTask } from "~/lib/types";
import { SLOT_HEIGHT, SLOT_MINUTES, SNAP_MINUTES } from "~/lib/types";
import { paletteOf } from "~/lib/colors";
import { formatDuration, formatTime, gutterLabel, floorMinutes, HOUR_OPTIONS, snapMinutes } from "~/lib/time";

const props = defineProps<{
  day: string;
  tasks: ScheduledTask[];
  nowMinute: number | null;
  resizing: string | null;
  preview: { start: number; duration: number; color: string; label: string } | null;
  layout: Map<string, { left: number; width: number }>;
  gridHeight: number;
}>();

const emit = defineEmits<{
  (e: "task-click", task: ScheduledTask): void;
  (e: "grid-click", event: MouseEvent): void;
  (e: "toggle-complete", task: ScheduledTask): void;
  (e: "delete-task", id: string): void;
  (e: "start-resize", task: ScheduledTask, event: PointerEvent): void;
  (e: "drag-over", event: DragEvent): void;
  (e: "drag-leave", event: DragEvent): void;
  (e: "drop", event: DragEvent): void;
  (e: "move-task", task: ScheduledTask, startMinutes: number): void;
  (e: "refresh"): void;
}>();

const gridRef = ref<HTMLDivElement | null>(null);
const hoverMinutes = ref<number | null>(null);
const HOVER_DURATION = 30; // matches the default duration of a block created by clicking the grid
const DAY_MINUTES = 24 * 60;

let lastPointer: { x: number; y: number } | null = null;

const updateHover = () => {
  if (!lastPointer || !gridRef.value || props.resizing || props.preview || drag.value) {
    hoverMinutes.value = null;
    return;
  }
  const rect = gridRef.value.getBoundingClientRect();
  const { x, y } = lastPointer;
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    hoverMinutes.value = null;
    return;
  }
  // Existing blocks handle their own clicks, so nothing new would be created there.
  const target = document.elementFromPoint(x, y);
  if (target?.closest("[data-task-block]")) {
    hoverMinutes.value = null;
    return;
  }
  // Floors to the quarter hour under the cursor, same as the click-to-create handler, so the block lands where it's shown.
  hoverMinutes.value = floorMinutes(((y - rect.top) / SLOT_HEIGHT) * SLOT_MINUTES, SNAP_MINUTES);
};

const handlePointerMove = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return; // no hover on touch
  lastPointer = { x: event.clientX, y: event.clientY };
  updateHover();
};

// Hovering a block marks where it starts and ends in the gutter and across the grid.
const hoveredTaskId = ref<string | null>(null);
const hoveredTask = computed(() =>
  drag.value ? null : (props.tasks.find((item) => item.id === hoveredTaskId.value) ?? null),
);
const onBlockPointerEnter = (task: ScheduledTask, event: PointerEvent) => {
  if (event.pointerType === "mouse") hoveredTaskId.value = task.id;
};

const clearHover = () => {
  lastPointer = null;
  hoverMinutes.value = null;
};

// Scrolling moves the grid under a stationary cursor without firing pointer events.
onMounted(() => window.addEventListener("scroll", updateHover, { capture: true, passive: true }));
onBeforeUnmount(() => window.removeEventListener("scroll", updateHover, { capture: true }));
watch(() => [props.preview, props.resizing], updateHover);

// ---- Moving blocks (pointer based, so it works with mouse, touch and pen) ----
const TOUCH_HOLD_MS = 220; // touch must press and hold, otherwise the gesture scrolls the page
const TOUCH_SLOP = 8;
const MOUSE_SLOP = 4;
const EDGE_SCROLL_ZONE = 72;
const EDGE_SCROLL_MAX = 16;

type DragState = {
  id: string;
  /** Free-following position of the block's top edge, in minutes. */
  rawStart: number;
  /** Where the block will land once released, after snapping. */
  snappedStart: number;
};

const drag = ref<DragState | null>(null);
let pending: {
  task: ScheduledTask;
  pointerType: string;
  startX: number;
  startY: number;
  timer: number | null;
} | null = null;
let active: { task: ScheduledTask; grabMinutes: number } | null = null;
let lastY = 0;
let scroller: HTMLElement | null = null;
let rafId: number | null = null;
let suppressClick = false;

const findScroller = (el: HTMLElement | null): HTMLElement | null => {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
};

const pointerMinutes = () => {
  const rect = gridRef.value!.getBoundingClientRect();
  return ((lastY - rect.top) / SLOT_HEIGHT) * SLOT_MINUTES;
};

const updateDrag = () => {
  if (!active) return;
  const { task, grabMinutes } = active;
  const maxStart = DAY_MINUTES - task.durationMinutes;
  const rawStart = Math.max(0, Math.min(maxStart, pointerMinutes() - grabMinutes));
  const snappedStart = Math.min(
    Math.floor(maxStart / SNAP_MINUTES) * SNAP_MINUTES,
    snapMinutes(rawStart, SNAP_MINUTES),
  );
  drag.value = { id: task.id, rawStart, snappedStart };
};

const edgeScrollTick = () => {
  rafId = null;
  if (!active) return;
  if (scroller) {
    const rect = scroller.getBoundingClientRect();
    const intoTop = rect.top + EDGE_SCROLL_ZONE - lastY;
    const intoBottom = lastY - (rect.bottom - EDGE_SCROLL_ZONE);
    const speed = intoTop > 0
      ? -Math.min(1, intoTop / EDGE_SCROLL_ZONE) * EDGE_SCROLL_MAX
      : intoBottom > 0
        ? Math.min(1, intoBottom / EDGE_SCROLL_ZONE) * EDGE_SCROLL_MAX
        : 0;
    if (speed !== 0) {
      scroller.scrollTop += speed;
      updateDrag();
    }
  }
  rafId = requestAnimationFrame(edgeScrollTick);
};

const beginDrag = () => {
  if (!pending || !gridRef.value) return;
  const { task, pointerType } = pending;
  if (pending.timer) window.clearTimeout(pending.timer);
  pending = null;
  scroller = findScroller(gridRef.value);
  lastY = lastY || 0;
  active = { task, grabMinutes: pointerMinutes() - task.startMinutes };
  document.body.style.userSelect = "none";
  document.body.style.webkitUserSelect = "none";
  if (pointerType === "touch") navigator.vibrate?.(8);
  hoverMinutes.value = null;
  updateDrag();
  rafId = requestAnimationFrame(edgeScrollTick);
};

const endTracking = () => {
  if (pending?.timer) window.clearTimeout(pending.timer);
  pending = null;
  active = null;
  drag.value = null;
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  document.body.style.userSelect = "";
  document.body.style.webkitUserSelect = "";
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
  window.removeEventListener("pointercancel", onWindowPointerCancel);
};

const onWindowPointerMove = (event: PointerEvent) => {
  lastY = event.clientY;
  if (pending) {
    const moved = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
    if (pending.pointerType === "mouse") {
      if (moved > MOUSE_SLOP) beginDrag();
    } else if (moved > TOUCH_SLOP) {
      endTracking(); // the user is scrolling, not dragging
    }
    return;
  }
  updateDrag();
};

const onWindowPointerUp = () => {
  if (active && drag.value) {
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 80);
    const { task } = active;
    const start = drag.value.snappedStart;
    if (start !== task.startMinutes) emit("move-task", task, start);
  }
  endTracking();
};

const onWindowPointerCancel = () => {
  endTracking();
};

const onBlockPointerDown = (task: ScheduledTask, event: PointerEvent) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (props.resizing || pending || active) return;
  if ((event.target as HTMLElement).closest("button, [data-resize-handle]")) return;
  lastY = event.clientY;
  pending = {
    task,
    pointerType: event.pointerType,
    startX: event.clientX,
    startY: event.clientY,
    timer: event.pointerType === "mouse" ? null : window.setTimeout(beginDrag, TOUCH_HOLD_MS),
  };
  window.addEventListener("pointermove", onWindowPointerMove);
  window.addEventListener("pointerup", onWindowPointerUp);
  window.addEventListener("pointercancel", onWindowPointerCancel);
};

// Once a block is picked up, stop the browser from scrolling the page under the finger.
const blockTouchScroll = (event: TouchEvent) => {
  if (active && event.cancelable) event.preventDefault();
};

const onBlockKeydown = (task: ScheduledTask, event: KeyboardEvent) => {
  if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  const direction = event.key === "ArrowUp" ? -1 : 1;
  const next = Math.max(0, Math.min(DAY_MINUTES - task.durationMinutes, task.startMinutes + direction * SNAP_MINUTES));
  if (next !== task.startMinutes) emit("move-task", task, next);
};

// Block height is proportional to duration (minus a 4px gutter) so a 15 minute block is visibly
// half the height of a 30 minute one. Blocks shorter than a slot use a single-row compact layout.
const MIN_BLOCK_HEIGHT = 16;
const blockHeight = (durationMinutes: number) =>
  Math.max(MIN_BLOCK_HEIGHT, (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 4);
const isCompact = (durationMinutes: number) => durationMinutes < SLOT_MINUTES;

const dragGhostStyle = computed(() => {
  if (!drag.value) return undefined;
  const { id, snappedStart } = drag.value;
  const duration = props.tasks.find((item) => item.id === id)?.durationMinutes ?? SLOT_MINUTES;
  const lane = props.layout.get(id);
  return {
    top: `${(snappedStart / SLOT_MINUTES) * SLOT_HEIGHT + 2}px`,
    height: `${blockHeight(duration)}px`,
    left: `${(lane?.left ?? 0) * 100 + 1}%`,
    width: `${(lane?.width ?? 1) * 100 - 2}%`,
  };
});

const onBlockClick = (task: ScheduledTask) => {
  if (suppressClick) return;
  emit("task-click", task);
};

const onGridClick = (event: MouseEvent) => {
  clearHover();
  if (suppressClick) return;
  emit("grid-click", event);
};

const dragOffsetPx = (task: ScheduledTask) =>
  drag.value?.id === task.id
    ? ((drag.value.rawStart - task.startMinutes) / SLOT_MINUTES) * SLOT_HEIGHT
    : 0;

onMounted(() => gridRef.value?.addEventListener("touchmove", blockTouchScroll, { passive: false }));
onBeforeUnmount(() => {
  gridRef.value?.removeEventListener("touchmove", blockTouchScroll);
  endTracking();
});

const toneOf = (color: string) => paletteOf(color);

</script>

<template>
  <div class="mx-auto flex max-w-4xl pt-4 pb-8 sm:pt-6 sm:pb-12">
    <!-- Hour gutter -->
    <div class="relative w-14 sm:w-16 shrink-0 select-none border-r border-border bg-background pr-1.5 sm:pr-2.5">
      <div
        v-for="minute in HOUR_OPTIONS"
        :key="minute"
        :style="{ height: `${SLOT_HEIGHT}px` }"
        class="relative"
      >
        <span
          v-if="gutterLabel(minute)"
          class="absolute -top-2.5 right-1.5 sm:right-2 text-[11px] sm:text-xs font-mono font-medium text-muted-foreground tracking-tight"
        >
          {{ gutterLabel(minute) }}
        </span>
      </div>

      <!-- Start and end times of the hovered block -->
      <template v-if="hoveredTask">
        <div
          v-for="minute in [hoveredTask.startMinutes, Math.min(hoveredTask.startMinutes + hoveredTask.durationMinutes, DAY_MINUTES)]"
          :key="`edge-${minute}`"
          class="pointer-events-none absolute right-0.5 sm:right-1 z-20 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-muted px-1 sm:px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-foreground/70"
          :style="{ top: `${(minute / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
        >
          {{ formatTime(minute) }}
        </div>
      </template>

      <!-- Hover time pill in gutter -->
      <div
        v-if="hoverMinutes !== null && !preview && !resizing"
        class="pointer-events-none absolute right-0.5 sm:right-1 z-20 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-muted px-1 sm:px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-foreground/70"
        :style="{ top: `${(hoverMinutes / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
      >
        {{ formatTime(hoverMinutes) }}
      </div>

      <!-- Live time pill in gutter -->
      <div
        v-if="nowMinute !== null"
        class="pointer-events-none absolute right-0.5 sm:right-1 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-rose-500 px-1 sm:px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white shadow-xs"
        :style="{ top: `${(nowMinute / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
      >
        {{ formatTime(nowMinute) }}
      </div>
    </div>

    <!-- Drop grid -->
    <div
      ref="gridRef"
      @pointermove="handlePointerMove"
      @pointerleave="clearHover"
      @dragstart="clearHover"
      @dragover="(e) => emit('drag-over', e)"
      @dragleave="(e) => emit('drag-leave', e)"
      @drop="(e) => emit('drop', e)"
      @click="onGridClick"
      :style="{ height: `${gridHeight}px` }"
      class="relative flex-1 bg-background border-t border-border cursor-pointer"
    >
      <div
        v-for="minute in HOUR_OPTIONS"
        :key="minute"
        :style="{ height: `${SLOT_HEIGHT}px` }"
        :class="[
          'border-b',
          (minute + 30) % 60 === 0 ? 'border-border/70' : 'border-dashed border-border/30'
        ]"
      />

      <!-- Guides across the grid at the hovered block's start and end -->
      <template v-if="hoveredTask">
        <span
          v-for="minute in [hoveredTask.startMinutes, Math.min(hoveredTask.startMinutes + hoveredTask.durationMinutes, DAY_MINUTES)]"
          :key="`guide-${minute}`"
          class="pointer-events-none absolute inset-x-0 z-[5] border-t border-dashed border-foreground/15"
          :style="{ top: `${(minute / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
        />
      </template>

      <!-- Live Time Indicator Line -->
      <div
        v-if="nowMinute !== null"
        class="pointer-events-none absolute inset-x-0 z-20 flex items-center"
        :style="{ top: `${(nowMinute / SLOT_MINUTES) * SLOT_HEIGHT}px` }"
      >
        <div class="relative flex items-center w-full">
          <span class="absolute -left-1 flex h-2 w-2 items-center justify-center">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <span class="h-[1.5px] w-full bg-rose-500/80" />
        </div>
      </div>

      <!-- Hover Placement Indicator (default-length block following cursor) -->
      <div
        v-if="hoverMinutes !== null && !preview && !resizing"
        class="pointer-events-none absolute z-20 flex items-start justify-between overflow-hidden rounded-lg border border-primary/20 bg-primary/5 py-1.5 pl-3.5 pr-2.5"
        :style="{
          top: `${(hoverMinutes / SLOT_MINUTES) * SLOT_HEIGHT + 2}px`,
          height: `${(Math.min(HOVER_DURATION, DAY_MINUTES - hoverMinutes) / SLOT_MINUTES) * SLOT_HEIGHT - 4}px`,
          left: '1%',
          width: '98%',
        }"
      >
        <span class="absolute inset-y-1.5 left-1 w-0.5 rounded-full bg-primary/30" />
        <svg viewBox="0 0 20 20" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/50" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 4v12M4 10h12" stroke-linecap="round" />
        </svg>
        <span class="font-mono text-[11px] font-medium text-primary/60 tabular-nums">
          {{ formatTime(hoverMinutes) }} – {{ formatTime(Math.min(hoverMinutes + HOVER_DURATION, DAY_MINUTES)) }}
        </span>
      </div>

      <!-- Drag preview placeholder -->
      <div
        v-if="preview"
        :class="[
          'pointer-events-none absolute z-30 flex items-center justify-center rounded-lg border border-dashed shadow-2xs backdrop-blur-xs',
          toneOf(preview.color).ghost
        ]"
        :style="{
          top: `${(preview.start / SLOT_MINUTES) * SLOT_HEIGHT}px`,
          height: `${Math.max(
            MIN_BLOCK_HEIGHT,
            ((Math.min(preview.start + preview.duration, 24 * 60) - preview.start) /
              SLOT_MINUTES) *
              SLOT_HEIGHT,
          )}px`,
          left: '2%',
          width: '96%',
        }"
      >
        <span class="rounded-full bg-background px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs border border-border">
          {{ preview.label }} · {{ formatTime(preview.start) }}
        </span>
      </div>

      <!-- Landing slot while moving a block -->
      <div
        v-if="drag"
        class="pointer-events-none absolute z-30 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10"
        :style="dragGhostStyle"
      >
        <span class="absolute -top-2.5 right-2 rounded-md bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-primary-foreground shadow-xs">
          {{ formatTime(drag.snappedStart) }}
        </span>
      </div>

      <!-- Scheduled task blocks -->
      <div
        v-for="task in tasks"
        :key="task.id"
        data-task-block
        role="button"
        tabindex="0"
        :aria-label="`${task.title}, ${formatTime(task.startMinutes)} to ${formatTime(task.startMinutes + task.durationMinutes)}. Press Enter to edit.`"
        @keydown.enter.self.prevent="emit('task-click', task)"
        @keydown="(e) => onBlockKeydown(task, e)"
        @pointerdown="(e) => onBlockPointerDown(task, e)"
        @pointerenter="(e) => onBlockPointerEnter(task, e)"
        @pointerleave="hoveredTaskId = null"
        @contextmenu="(e) => { if (drag || pending) e.preventDefault(); }"
        @click.stop="onBlockClick(task)"
        :style="{
          top: `${(task.startMinutes / SLOT_MINUTES) * SLOT_HEIGHT + 2}px`,
          height: `${blockHeight(task.durationMinutes)}px`,
          left: `${(layout.get(task.id)?.left ?? 0) * 100 + 1}%`,
          width: `${(layout.get(task.id)?.width ?? 1) * 100 - 2}%`,
          transform: drag?.id === task.id ? `translateY(${dragOffsetPx(task)}px)` : undefined,
        }"
        :class="[
          'group absolute flex cursor-grab select-none flex-col overflow-hidden rounded-lg border px-2.5 [-webkit-touch-callout:none]',
          isCompact(task.durationMinutes) ? 'justify-center py-0' : 'py-1.5',
          drag?.id === task.id
            ? 'z-40 cursor-grabbing opacity-90 shadow-lg ring-2 ring-primary/30'
            : 'z-10 shadow-2xs transition-shadow hover:z-20 hover:shadow-xs',
          task.completed ? toneOf(task.color).blockDone : toneOf(task.color).block
        ]"
      >
        <!-- Vertical accent line -->
        <span
          class="absolute left-1 w-0.5 rounded-full transition-opacity"
          :class="[
            isCompact(task.durationMinutes) ? 'inset-y-1' : 'inset-y-1.5',
            toneOf(task.color).accent,
            task.completed ? 'opacity-40' : 'opacity-100',
          ]"
        />

        <div :class="['flex gap-2 pl-1.5', isCompact(task.durationMinutes) ? 'items-center' : 'items-start']">
          <button
            type="button"
            :aria-label="task.completed ? 'Mark as not done' : 'Mark as done'"
            @click.stop="emit('toggle-complete', task)"
            :class="[
              'relative flex shrink-0 items-center justify-center rounded-xs border transition-colors cursor-pointer after:absolute after:-inset-1.5 touch:after:-inset-2.5',
              isCompact(task.durationMinutes) ? 'h-3.5 w-3.5 touch:h-4 touch:w-4' : 'mt-0.5 h-4 w-4 touch:h-5 touch:w-5',
              task.completed
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                : 'border-input bg-background text-transparent hover:border-foreground/60'
            ]"
          >
            <svg viewBox="0 0 16 16" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3.5 8.5l3 3 6-6" />
            </svg>
          </button>
          <p
            :class="[
              'min-w-0 flex-1 truncate font-semibold leading-tight text-foreground',
              isCompact(task.durationMinutes) ? 'text-xs' : 'text-sm',
              task.completed ? 'line-through text-muted-foreground font-normal' : ''
            ]"
          >
            {{ task.emoji }} {{ task.title }}
          </p>
          <button
            v-if="resizing !== task.id"
            type="button"
            aria-label="Remove block"
            title="Remove block"
            @click.stop="emit('delete-task', task.id)"
            @pointerdown.stop
            @mousedown.stop
            :class="isCompact(task.durationMinutes) ? 'h-4 w-4' : 'mt-0.5 h-4.5 w-4.5'"
            class="flex shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-75 hover:opacity-100 focus-visible:opacity-100 touch:hidden"
          >
            <svg
              viewBox="0 0 20 20"
              class="h-3 w-3"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Time display for non-compact tasks -->
        <p
          v-if="blockHeight(task.durationMinutes) >= SLOT_HEIGHT * 1.5"
          class="mt-1 pl-6 text-[12.5px] font-medium leading-4 tabular-nums text-foreground/70"
        >
          {{ formatTime(task.startMinutes) }} – {{ formatTime(task.startMinutes + task.durationMinutes) }}
          <span class="mx-0.5 text-foreground/35">·</span>
          <span class="font-normal text-foreground/55">{{ formatDuration(task.durationMinutes) }}</span>
        </p>

        <!-- Notes snippet for non-compact tasks -->
        <p
          v-if="blockHeight(task.durationMinutes) >= SLOT_HEIGHT * 2.2 && task.notes"
          class="mt-1 line-clamp-1 pl-6 text-[13px] leading-5 text-foreground/60"
        >
          {{ task.notes }}
        </p>

        <!-- Resize handle at bottom -->
        <div
          data-resize-handle
          @pointerdown="(e) => emit('start-resize', task, e)"
          :class="isCompact(task.durationMinutes) ? 'h-2 touch:h-3' : 'h-3.5 sm:h-2 touch:h-5'"
          class="absolute inset-x-0 bottom-0 flex touch-none cursor-ns-resize items-center justify-center"
        >
          <span class="h-0.5 w-6 rounded-full bg-foreground/20 opacity-0 transition group-hover:opacity-100 touch:opacity-70" />
        </div>

        <!-- Active resizing duration badge -->
        <span
          v-if="resizing === task.id"
          class="absolute right-1.5 top-1.5 rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground shadow-xs"
        >
          {{ formatDuration(task.durationMinutes) }}
        </span>
      </div>
    </div>
  </div>
</template>
