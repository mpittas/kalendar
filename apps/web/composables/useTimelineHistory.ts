import { computed, shallowRef, type Ref } from "vue";
import { api, type TaskPatch } from "~/lib/api";
import type { ScheduledTask } from "~/lib/types";

/** A block as it was before and after a change; null where it didn't exist (created or deleted). */
type Change = { before: ScheduledTask | null; after: ScheduledTask | null };
type Entry = { label: string; changes: Change[] };

const LIMIT = 100;
// What undo and redo may set back. Ids and template links stay as the server made them.
const FIELDS = [
  "title", "emoji", "color", "category", "day", "startMinutes", "durationMinutes", "notes", "completed", "lane",
] as const;

/**
 * Undo and redo for changes made on the timeline. Each step remembers the blocks it touched as they
 * were before and after, and undoing saves the "before" back (redoing, the "after"). Only the fields
 * a step changed are written, so edits made in between to other fields survive.
 */
export const useTimelineHistory = (options: {
  tasks: Ref<ScheduledTask[]>;
  day: () => string;
  notify: (message: string) => void;
}) => {
  const { tasks, day, notify } = options;
  const undoStack = shallowRef<Entry[]>([]);
  const redoStack = shallowRef<Entry[]>([]);
  // Undoing a delete makes the block again under a new id; later steps still name the old one.
  const aliases = new Map<string, string>();
  const resolve = (id: string) => {
    let current = id;
    while (aliases.has(current)) current = aliases.get(current)!;
    return current;
  };
  // Steps save one after another, so pressing undo quickly several times can't interleave them.
  let queue = Promise.resolve();

  const record = (label: string, pairs: [ScheduledTask | null | undefined, ScheduledTask | null | undefined][]) => {
    const changes = pairs
      .filter(([before, after]) => (before && after ? FIELDS.some((field) => before[field] !== after[field]) : before || after))
      .map(([before, after]) => ({ before: before ? { ...before } : null, after: after ? { ...after } : null }));
    if (!changes.length) return;
    undoStack.value = [...undoStack.value, { label, changes }].slice(-LIMIT);
    redoStack.value = [];
  };

  const clear = () => {
    undoStack.value = [];
    redoStack.value = [];
    aliases.clear();
  };

  // Puts the saved block on the timeline, or takes it off if it's gone or now on another day.
  const show = (id: string, task: ScheduledTask | null) => {
    const rest = tasks.value.filter((item) => item.id !== id);
    tasks.value = (task && task.day === day() ? [...rest, task] : rest).sort((a, b) => a.startMinutes - b.startMinutes);
  };

  const apply = async (from: ScheduledTask | null, to: ScheduledTask | null) => {
    if (!to) {
      const id = resolve(from!.id);
      await api.deleteTask(id);
      show(id, null);
      return;
    }
    if (!from) {
      const { id: _id, lane, ...draft } = to;
      const created = await api.createTask({ ...draft, ...(typeof lane === "number" ? { lane } : {}) });
      const gone = resolve(to.id);
      if (gone !== created.id) aliases.set(gone, created.id);
      show(created.id, created);
      return;
    }
    const patch: Record<string, unknown> = {};
    for (const field of FIELDS) {
      if (from[field] !== to[field]) patch[field] = to[field] ?? null; // a lane that wasn't set is cleared
    }
    if (!Object.keys(patch).length) return;
    const id = resolve(to.id);
    show(id, await api.updateTask(id, patch as TaskPatch));
  };

  const step = (direction: "undo" | "redo") => {
    const source = direction === "undo" ? undoStack : redoStack;
    const target = direction === "undo" ? redoStack : undoStack;
    const entry = source.value.at(-1);
    if (!entry) {
      notify(direction === "undo" ? "Nothing to undo" : "Nothing to redo");
      return;
    }
    source.value = source.value.slice(0, -1);
    target.value = [...target.value, entry];
    queue = queue.then(async () => {
      try {
        await Promise.all(
          entry.changes.map(({ before, after }) => (direction === "undo" ? apply(after, before) : apply(before, after))),
        );
        notify(`${direction === "undo" ? "Undid" : "Redid"}: ${entry.label}`);
      } catch {
        // Part of it may have saved; show what the server has and start the history afresh from there.
        notify(`Could not ${direction} that`);
        clear();
        try {
          tasks.value = await api.getTasksForDay(day());
        } catch {
          // Keep what is on screen; the next change or a reload brings it back in line.
        }
      }
    });
  };

  return {
    record,
    clear,
    undo: () => step("undo"),
    redo: () => step("redo"),
    canUndo: computed(() => undoStack.value.length > 0),
    canRedo: computed(() => redoStack.value.length > 0),
  };
};
