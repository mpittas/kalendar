import { computed, getCurrentScope, onScopeDispose, ref, type Ref } from "vue";
import { TimelineHistory, type ScheduledTask } from "@klndr/core";
import { api } from "~/lib/api";

/** One step's changes: each block as it was before, and as it is after; null where it didn't exist. */
type Pairs = [ScheduledTask | null | undefined, ScheduledTask | null | undefined][];

/**
 * Undo and redo for changes made on the timeline. The engine — which saves the changes and keeps the
 * history — lives in @klndr/core; this wrapper only says where the blocks on screen are and mirrors
 * whether there is anything to undo or redo into refs the template can use.
 */
export const useTimelineHistory = (options: {
  tasks: Ref<ScheduledTask[]>;
  day: () => string;
  notify: (message: string) => void;
}) => {
  const { tasks, day, notify } = options;
  const canUndo = ref(false);
  const canRedo = ref(false);

  const history = new TimelineHistory({
    api,
    getTasks: () => tasks.value,
    setTasks: (next) => {
      tasks.value = next;
    },
    day,
    notify,
  });

  const stop = history.subscribe((state) => {
    canUndo.value = state.canUndo;
    canRedo.value = state.canRedo;
  });
  if (getCurrentScope()) onScopeDispose(stop);

  return {
    record: (label: string, pairs: Pairs) => history.record(label, pairs),
    clear: () => history.clear(),
    undo: () => history.undo(),
    redo: () => history.redo(),
    canUndo: computed(() => canUndo.value),
    canRedo: computed(() => canRedo.value),
  };
};
