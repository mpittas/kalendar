import type { ActivityTemplate, ScheduledTask, ChecklistItem, DayChecklist } from "~/lib/types";
import { toISODate } from "~/lib/time";
import { Firestore, FirestoreError, type FsDoc } from "./firestore";
import { sessionOf, type Session } from "./session";

/**
 * Data access for one signed-in user. Everything lives under `users/{uid}` in
 * Firestore (see `firestore.rules` for the schema and the access rules).
 */
export interface Store {
  listTemplates(): Promise<ActivityTemplate[]>;
  createTemplate(draft: Omit<ActivityTemplate, "id" | "archived">): Promise<ActivityTemplate>;
  updateTemplate(id: string, patch: Partial<Omit<ActivityTemplate, "id">>): Promise<ActivityTemplate | null>;
  deleteTemplate(id: string): Promise<boolean>;
  listTasksForDay(day: string): Promise<ScheduledTask[]>;
  listTasksBetween(from: string, to: string): Promise<ScheduledTask[]>;
  createTask(draft: Omit<ScheduledTask, "id">): Promise<ScheduledTask>;
  updateTask(id: string, patch: Partial<Omit<ScheduledTask, "id" | "templateId">>): Promise<ScheduledTask | null>;
  deleteTask(id: string): Promise<boolean>;
  listChecklistItems(): Promise<ChecklistItem[]>;
  createChecklistItem(draft: Omit<ChecklistItem, "id" | "archived">): Promise<ChecklistItem>;
  updateChecklistItem(id: string, patch: Partial<Omit<ChecklistItem, "id">>): Promise<ChecklistItem | null>;
  deleteChecklistItem(id: string): Promise<boolean>;
  getDayChecklist(day: string): Promise<DayChecklist>;
  toggleDayChecklistItem(day: string, itemId: string, completed: boolean): Promise<DayChecklist>;
}

// Seed data
const DEFAULT_TEMPLATES = [
  {
    name: "Cleaning",
    emoji: "🧹",
    color: "cyan",
    category: "Home",
    defaultDuration: 45,
    notes: "Tidy a room, dishes, laundry or a quick vacuum run.",
  },
  {
    name: "Deep clean",
    emoji: "🧼",
    color: "teal",
    category: "Home",
    defaultDuration: 120,
    notes: "Bathroom, kitchen, floors — the full reset.",
  },
  {
    name: "Working on projects",
    emoji: "🛠️",
    color: "indigo",
    category: "Work",
    defaultDuration: 120,
    notes: "Focused maker time on the current project.",
  },
  {
    name: "Emails & admin",
    emoji: "📬",
    color: "slate",
    category: "Work",
    defaultDuration: 30,
    notes: "Inbox zero and small admin chores.",
  },
  {
    name: "Meeting",
    emoji: "👥",
    color: "violet",
    category: "Work",
    defaultDuration: 60,
    notes: "Calls, standups and check-ins.",
  },
  {
    name: "Workout",
    emoji: "🏋️",
    color: "emerald",
    category: "Health",
    defaultDuration: 60,
    notes: "Lift, run, swim or a class.",
  },
  {
    name: "Walk outside",
    emoji: "🚶",
    color: "lime",
    category: "Health",
    defaultDuration: 30,
    notes: "Fresh air and steps.",
  },
  {
    name: "Morning routine",
    emoji: "☀️",
    color: "amber",
    category: "Daily routines",
    defaultDuration: 45,
    notes: "Stretch, journal, coffee, plan the day.",
  },
  {
    name: "Meals",
    emoji: "🍽️",
    color: "orange",
    category: "Daily routines",
    defaultDuration: 45,
    notes: "Cook and eat — breakfast, lunch or dinner.",
  },
  {
    name: "Evening wind-down",
    emoji: "🌙",
    color: "sky",
    category: "Daily routines",
    defaultDuration: 30,
    notes: "Screens off, read, prep tomorrow.",
  },
  {
    name: "Study / learning",
    emoji: "📚",
    color: "rose",
    category: "Growth",
    defaultDuration: 60,
    notes: "Course, reading or deliberate practice.",
  },
  {
    name: "Errands",
    emoji: "🛒",
    color: "pink",
    category: "Home",
    defaultDuration: 60,
    notes: "Groceries, post office, pickups.",
  },
];

const DEFAULT_CHECKLIST_ITEMS = [
  { title: "Take vitamins & pills", emoji: "💊", order: 1 },
  { title: "Drink protein shake", emoji: "🥤", order: 2 },
  { title: "Morning shower", emoji: "🚿", order: 3 },
  { title: "Drink 2L water", emoji: "💧", order: 4 },
  { title: "10 min stretch / meditate", emoji: "🧘", order: 5 },
];

function isoOffset(days: number): string {
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + days);
  return toISODate(dateObj);
}

/** Demo schedule shared by both stores: [template name, day offset, start minutes]. */
const DEMO_PLAN: ReadonlyArray<readonly [string, number, number]> = [
  ["Morning routine", 0, 7 * 60],
  ["Working on projects", 0, 9 * 60],
  ["Emails & admin", 0, 11 * 60 + 30],
  ["Meals", 0, 12 * 60 + 30],
  ["Workout", 0, 18 * 60],
  ["Morning routine", 1, 7 * 60],
  ["Deep clean", 1, 10 * 60],
  ["Study / learning", 1, 15 * 60],
  ["Errands", 2, 13 * 60],
];

function demoTasks(
  templates: ActivityTemplate[],
): Omit<ScheduledTask, "id" | "completed">[] {
  const byName = new Map(templates.map((t) => [t.name, t]));
  return DEMO_PLAN.flatMap(([name, dayOffset, start]) => {
    const t = byName.get(name);
    if (!t) return [];
    return [
      {
        templateId: t.id,
        title: t.name,
        emoji: t.emoji,
        color: t.color,
        category: t.category,
        day: isoOffset(dayOffset),
        startMinutes: start,
        durationMinutes: t.defaultDuration,
        notes: t.notes,
      },
    ];
  });
}


const byTemplateOrder = (a: ActivityTemplate, b: ActivityTemplate) =>
  a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
const byStart = (a: ScheduledTask, b: ScheduledTask) =>
  a.day.localeCompare(b.day) || a.startMinutes - b.startMinutes || a.id.localeCompare(b.id);

// ---------------------------------------------------------------------------
// In-memory store: local development only, used when Firebase isn't configured.
// ---------------------------------------------------------------------------
class MemoryStore implements Store {
  private templates: ActivityTemplate[] = [];
  private tasks: ScheduledTask[] = [];
  private checklistItems: ChecklistItem[] = [];
  private checklistDays = new Map<string, Set<string>>();
  private seq = 1;

  constructor() {
    for (const tpl of DEFAULT_TEMPLATES) {
      this.templates.push({ id: String(this.seq++), ...tpl, archived: false });
    }
    for (const task of demoTasks(this.templates)) {
      this.tasks.push({ id: String(this.seq++), ...task, completed: false });
    }
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      this.checklistItems.push({ id: String(this.seq++), ...item, archived: false });
    }
    // Demo completion for today: mark first 2 items completed
    const today = toISODate(new Date());
    if (this.checklistItems.length >= 2) {
      this.checklistDays.set(today, new Set([this.checklistItems[0].id, this.checklistItems[1].id]));
    }
  }

  async listTemplates() {
    return [...this.templates].sort(byTemplateOrder);
  }

  async createTemplate(draft: Omit<ActivityTemplate, "id" | "archived">) {
    const item: ActivityTemplate = { id: String(this.seq++), ...draft, archived: false };
    this.templates.push(item);
    return item;
  }

  async updateTemplate(id: string, patch: Partial<Omit<ActivityTemplate, "id">>) {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.templates[idx] = { ...this.templates[idx], ...patch, id };
    return this.templates[idx];
  }

  async deleteTemplate(id: string) {
    const before = this.templates.length;
    this.templates = this.templates.filter((t) => t.id !== id);
    this.tasks = this.tasks.map((t) => (t.templateId === id ? { ...t, templateId: null } : t));
    return this.templates.length < before;
  }

  async listTasksForDay(day: string) {
    return this.tasks.filter((t) => t.day === day).sort(byStart);
  }

  async listTasksBetween(from: string, to: string) {
    return this.tasks.filter((t) => t.day >= from && t.day <= to).sort(byStart);
  }

  async createTask(draft: Omit<ScheduledTask, "id">) {
    const owns = draft.templateId !== null && this.templates.some((t) => t.id === draft.templateId);
    const item: ScheduledTask = { id: String(this.seq++), ...draft, templateId: owns ? draft.templateId : null };
    this.tasks.push(item);
    return item;
  }

  async updateTask(id: string, patch: Partial<Omit<ScheduledTask, "id" | "templateId">>) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...patch, id };
    return this.tasks[idx];
  }

  async deleteTask(id: string) {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }

  async listChecklistItems() {
    return [...this.checklistItems]
      .filter((i) => !i.archived)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }

  async createChecklistItem(draft: Omit<ChecklistItem, "id" | "archived">) {
    const maxOrder = this.checklistItems.reduce((max, i) => Math.max(max, i.order), 0);
    const item: ChecklistItem = {
      id: String(this.seq++),
      ...draft,
      order: draft.order ?? maxOrder + 1,
      archived: false,
    };
    this.checklistItems.push(item);
    return item;
  }

  async updateChecklistItem(id: string, patch: Partial<Omit<ChecklistItem, "id">>) {
    const idx = this.checklistItems.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.checklistItems[idx] = { ...this.checklistItems[idx], ...patch, id };
    return this.checklistItems[idx];
  }

  async deleteChecklistItem(id: string) {
    const before = this.checklistItems.length;
    this.checklistItems = this.checklistItems.filter((i) => i.id !== id);
    for (const set of this.checklistDays.values()) {
      set.delete(id);
    }
    return this.checklistItems.length < before;
  }

  async getDayChecklist(day: string) {
    const set = this.checklistDays.get(day);
    return {
      day,
      completedItemIds: set ? Array.from(set) : [],
    };
  }

  async toggleDayChecklistItem(day: string, itemId: string, completed: boolean) {
    let set = this.checklistDays.get(day);
    if (!set) {
      set = new Set<string>();
      this.checklistDays.set(day, set);
    }
    if (completed) {
      set.add(itemId);
    } else {
      set.delete(itemId);
    }
    return {
      day,
      completedItemIds: Array.from(set),
    };
  }
}

// One in-memory store per user, so the dev fallback keeps the same isolation.
const memoryStores = new Map<string, MemoryStore>();

// ---------------------------------------------------------------------------
// Firestore store: users/{uid}/templates/{id} and users/{uid}/tasks/{id}.
// Runs as the caller (their ID token), so firestore.rules is always enforced.
// ---------------------------------------------------------------------------
const toTemplate = ({ id, data }: FsDoc): ActivityTemplate => ({
  id,
  name: String(data.name ?? ""),
  emoji: String(data.emoji ?? ""),
  color: String(data.color ?? ""),
  category: String(data.category ?? ""),
  defaultDuration: Number(data.defaultDuration ?? 60),
  notes: (data.notes as string | null) ?? null,
  archived: data.archived === true,
});

const toTask = ({ id, data }: FsDoc): ScheduledTask => ({
  id,
  templateId: (data.templateId as string | null) ?? null,
  title: String(data.title ?? ""),
  emoji: String(data.emoji ?? ""),
  color: String(data.color ?? ""),
  category: String(data.category ?? ""),
  day: String(data.day ?? ""),
  startMinutes: Number(data.startMinutes ?? 0),
  durationMinutes: Number(data.durationMinutes ?? 60),
  notes: (data.notes as string | null) ?? null,
  completed: data.completed === true,
});

const toChecklistItem = ({ id, data }: FsDoc): ChecklistItem => ({
  id,
  title: String(data.title ?? ""),
  emoji: String(data.emoji ?? "✅"),
  order: Number(data.order ?? 0),
  archived: data.archived === true,
});

/** Turn Firestore failures into API errors; `null`-returning callers handle NOT_FOUND first. */
function rethrow(err: unknown): never {
  if (err instanceof FirestoreError) {
    if (err.status === 401) throw createError({ statusCode: 401, statusMessage: "Invalid or expired session" });
    if (err.status === 403) throw createError({ statusCode: 403, statusMessage: "Not allowed" });
    if (err.status === 503) throw createError({ statusCode: 503, statusMessage: "Database unavailable" });
  }
  console.error("Firestore request failed:", err instanceof FirestoreError ? err.message : err);
  throw createError({ statusCode: 502, statusMessage: "Database error" });
}

const newId = () => crypto.randomUUID();

/** Users whose starter data this server instance has already confirmed. */
const seededUsers = new Set<string>();

class FirestoreStore implements Store {
  private readonly base: string;

  constructor(
    private readonly fs: Firestore,
    private readonly userId: string,
  ) {
    this.base = `users/${userId}`;
  }

  /**
   * Give a brand-new user the starter templates and a demo week, exactly once.
   * The marker document is created with an "must not exist" precondition, so
   * concurrent first requests can't both seed.
   */
  private async ensureSeeded(): Promise<void> {
    if (seededUsers.has(this.userId)) return;
    try {
      if (await this.fs.get(`${this.base}/meta/seed`)) {
        seededUsers.add(this.userId);
        return;
      }

      const templates = DEFAULT_TEMPLATES.map((tpl) => ({ id: newId(), ...tpl, archived: false }));
      await this.fs.commit([
        { op: "create", path: `${this.base}/meta/seed`, data: {}, serverTimes: ["seededAt"] },
        ...templates.map(({ id, ...data }) => ({
          op: "create" as const,
          path: `${this.base}/templates/${id}`,
          data,
          serverTimes: ["createdAt"],
        })),
      ]);
      seededUsers.add(this.userId);

      // Tasks link to templates, which rules verify against already-committed data.
      const demo = demoTasks(templates);
      if (demo.length) {
        await this.fs
          .commit(
            demo.map((task) => ({
              op: "create" as const,
              path: `${this.base}/tasks/${newId()}`,
              data: { ...task, completed: false },
              serverTimes: ["createdAt", "updatedAt"],
            })),
          )
          .catch((err) => console.warn("Demo tasks skipped:", err instanceof FirestoreError ? err.message : err));
      }

      const defaultItems = DEFAULT_CHECKLIST_ITEMS.map((item) => ({ id: newId(), ...item, archived: false }));
      await this.fs
        .commit(
          defaultItems.map(({ id, ...data }) => ({
            op: "create" as const,
            path: `${this.base}/checklist_items/${id}`,
            data,
            serverTimes: ["createdAt"],
          })),
        )
        .catch((err) => console.warn("Checklist seed skipped:", err instanceof FirestoreError ? err.message : err));
    } catch (err) {
      if (err instanceof FirestoreError && err.alreadyExists) {
        seededUsers.add(this.userId); // another request won the race
        return;
      }
      rethrow(err);
    }
  }

  async listTemplates() {
    try {
      let docs = await this.fs.query(this.base, "templates");
      if (docs.length > 0) {
        seededUsers.add(this.userId); // existing user: skip the seed-marker lookup from now on
      } else {
        await this.ensureSeeded();
        docs = await this.fs.query(this.base, "templates");
      }
      return docs.map(toTemplate).sort(byTemplateOrder);
    } catch (err) {
      rethrow(err);
    }
  }

  async createTemplate(draft: Omit<ActivityTemplate, "id" | "archived">) {
    const id = newId();
    const data = { ...draft, archived: false };
    try {
      await this.fs.commit([{ op: "create", path: `${this.base}/templates/${id}`, data, serverTimes: ["createdAt"] }]);
    } catch (err) {
      rethrow(err);
    }
    return { id, ...data };
  }

  async updateTemplate(id: string, patch: Partial<Omit<ActivityTemplate, "id">>) {
    try {
      if (Object.keys(patch).length > 0) {
        await this.fs.commit([{ op: "update", path: `${this.base}/templates/${id}`, data: patch }]);
      }
      const doc = await this.fs.get(`${this.base}/templates/${id}`);
      return doc ? toTemplate(doc) : null;
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) return null;
      rethrow(err);
    }
  }

  async deleteTemplate(id: string) {
    try {
      // Mirror "on delete set null": unlink this template's tasks in the same atomic commit.
      const linked = await this.fs.query(this.base, "tasks", [{ field: "templateId", op: "EQUAL", value: id }]);
      await this.fs.commit([
        ...linked.map((task) => ({
          op: "update" as const,
          path: `${this.base}/tasks/${task.id}`,
          data: { templateId: null },
          serverTimes: ["updatedAt"],
        })),
        { op: "delete", path: `${this.base}/templates/${id}` },
      ]);
      return true;
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) return false;
      rethrow(err);
    }
  }

  async listTasksForDay(day: string) {
    try {
      await this.ensureSeeded();
      const docs = await this.fs.query(this.base, "tasks", [{ field: "day", op: "EQUAL", value: day }]);
      return docs.map(toTask).sort(byStart);
    } catch (err) {
      rethrow(err);
    }
  }

  async listTasksBetween(from: string, to: string) {
    try {
      await this.ensureSeeded();
      const docs = await this.fs.query(this.base, "tasks", [
        { field: "day", op: "GREATER_THAN_OR_EQUAL", value: from },
        { field: "day", op: "LESS_THAN_OR_EQUAL", value: to },
      ]);
      return docs.map(toTask).sort(byStart);
    } catch (err) {
      rethrow(err);
    }
  }

  async createTask(draft: Omit<ScheduledTask, "id">): Promise<ScheduledTask> {
    const id = newId();
    try {
      await this.fs.commit([
        { op: "create", path: `${this.base}/tasks/${id}`, data: draft, serverTimes: ["createdAt", "updatedAt"] },
      ]);
    } catch (err) {
      // Rules reject a link to a template the caller doesn't own; store the task unlinked instead.
      if (err instanceof FirestoreError && err.status === 403 && draft.templateId !== null) {
        return this.createTask({ ...draft, templateId: null });
      }
      rethrow(err);
    }
    return { id, ...draft };
  }

  async updateTask(id: string, patch: Partial<Omit<ScheduledTask, "id" | "templateId">>) {
    try {
      await this.fs.commit([
        { op: "update", path: `${this.base}/tasks/${id}`, data: patch, serverTimes: ["updatedAt"] },
      ]);
      const doc = await this.fs.get(`${this.base}/tasks/${id}`);
      return doc ? toTask(doc) : null;
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) return null;
      rethrow(err);
    }
  }

  async deleteTask(id: string) {
    try {
      await this.fs.commit([{ op: "delete", path: `${this.base}/tasks/${id}` }]);
      return true;
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) return false;
      rethrow(err);
    }
  }

  async listChecklistItems() {
    try {
      await this.ensureSeeded();
      const docs = await this.fs.query(this.base, "checklist_items");
      return docs
        .map(toChecklistItem)
        .filter((i) => !i.archived)
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    } catch (err) {
      rethrow(err);
    }
  }

  async createChecklistItem(draft: Omit<ChecklistItem, "id" | "archived">) {
    const id = newId();
    const data = { ...draft, archived: false };
    try {
      await this.fs.commit([
        { op: "create", path: `${this.base}/checklist_items/${id}`, data, serverTimes: ["createdAt"] },
      ]);
    } catch (err) {
      rethrow(err);
    }
    return { id, ...data };
  }

  async updateChecklistItem(id: string, patch: Partial<Omit<ChecklistItem, "id">>) {
    try {
      if (Object.keys(patch).length > 0) {
        await this.fs.commit([{ op: "update", path: `${this.base}/checklist_items/${id}`, data: patch }]);
      }
      const doc = await this.fs.get(`${this.base}/checklist_items/${id}`);
      return doc ? toChecklistItem(doc) : null;
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) return null;
      rethrow(err);
    }
  }

  async deleteChecklistItem(id: string) {
    try {
      await this.fs.commit([{ op: "delete", path: `${this.base}/checklist_items/${id}` }]);
      return true;
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) return false;
      rethrow(err);
    }
  }

  async getDayChecklist(day: string) {
    try {
      await this.ensureSeeded();
      const doc = await this.fs.get(`${this.base}/checklist_days/${day}`);
      const completedItemIds = doc && Array.isArray(doc.data.completedItemIds)
        ? (doc.data.completedItemIds as string[])
        : [];
      return { day, completedItemIds };
    } catch (err) {
      if (err instanceof FirestoreError && err.notFound) {
        return { day, completedItemIds: [] };
      }
      rethrow(err);
    }
  }

  async toggleDayChecklistItem(day: string, itemId: string, completed: boolean) {
    try {
      const doc = await this.fs.get(`${this.base}/checklist_days/${day}`);
      let completedItemIds: string[] = [];
      if (doc && Array.isArray(doc.data.completedItemIds)) {
        completedItemIds = [...(doc.data.completedItemIds as string[])];
      }
      if (completed) {
        if (!completedItemIds.includes(itemId)) {
          completedItemIds.push(itemId);
        }
      } else {
        completedItemIds = completedItemIds.filter((id) => id !== itemId);
      }

      await this.fs.commit([
        {
          op: doc ? "update" : "create",
          path: `${this.base}/checklist_days/${day}`,
          data: { day, completedItemIds },
          serverTimes: ["updatedAt"],
        },
      ]);
      return { day, completedItemIds };
    } catch (err) {
      rethrow(err);
    }
  }
}

export function storeFor(session: Session): Store {
  if (session.idToken) {
    const projectId = String(useRuntimeConfig().public.firebaseProjectId);
    return new FirestoreStore(new Firestore(projectId, session.idToken), session.userId);
  }
  // Dev mode without Firebase: isolated in-memory data per user id.
  let store = memoryStores.get(session.userId);
  if (!store) {
    store = new MemoryStore();
    memoryStores.set(session.userId, store);
  }
  return store;
}

/** The store for the verified caller of this request. */
export const storeOf = (event: { context: Record<string, any> }): Store => storeFor(sessionOf(event));
