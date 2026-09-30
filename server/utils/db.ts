import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import pg from "pg";
const { Pool } = pg;
import type { ActivityTemplate, ScheduledTask } from "~/lib/types";

// Schema definitions
export const activityTemplatesTable = pgTable("activity_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("📌"),
  color: text("color").notNull().default("indigo"),
  category: text("category").notNull().default("General"),
  defaultDuration: integer("default_duration").notNull().default(60),
  notes: text("notes"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const scheduledTasksTable = pgTable("scheduled_tasks", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => activityTemplatesTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  emoji: text("emoji").notNull().default("📌"),
  color: text("color").notNull().default("indigo"),
  category: text("category").notNull().default("General"),
  day: date("day", { mode: "string" }).notNull(),
  startMinutes: integer("start_minutes").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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

function isoOffset(days: number): string {
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + days);
  const y = dateObj.getFullYear();
  const m = `${dateObj.getMonth() + 1}`.padStart(2, "0");
  const d = `${dateObj.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// In-memory fallback store
class MemoryStore {
  templates: ActivityTemplate[] = [];
  tasks: ScheduledTask[] = [];
  templateSeq = 1;
  taskSeq = 1;
  seeded = false;

  constructor() {
    this.seed();
  }

  seed() {
    if (this.seeded) return;
    this.seeded = true;
    for (const tpl of DEFAULT_TEMPLATES) {
      this.templates.push({
        id: this.templateSeq++,
        name: tpl.name,
        emoji: tpl.emoji,
        color: tpl.color,
        category: tpl.category,
        defaultDuration: tpl.defaultDuration,
        notes: tpl.notes,
        archived: false,
      });
    }

    const byName = new Map(this.templates.map((t) => [t.name, t]));
    const plan = (name: string, dayOffset: number, start: number) => {
      const t = byName.get(name);
      if (!t) return;
      this.tasks.push({
        id: this.taskSeq++,
        templateId: t.id,
        title: t.name,
        emoji: t.emoji,
        color: t.color,
        category: t.category,
        day: isoOffset(dayOffset),
        startMinutes: start,
        durationMinutes: t.defaultDuration,
        notes: t.notes,
        completed: false,
      });
    };

    plan("Morning routine", 0, 7 * 60);
    plan("Working on projects", 0, 9 * 60);
    plan("Emails & admin", 0, 11 * 60 + 30);
    plan("Meals", 0, 12 * 60 + 30);
    plan("Workout", 0, 18 * 60);
    plan("Morning routine", 1, 7 * 60);
    plan("Deep clean", 1, 10 * 60);
    plan("Study / learning", 1, 15 * 60);
    plan("Errands", 2, 13 * 60);
  }

  getTemplates(): ActivityTemplate[] {
    return [...this.templates].sort(
      (a, b) => a.category.localeCompare(b.category) || a.id - b.id,
    );
  }

  getTemplate(id: number): ActivityTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  createTemplate(data: Omit<ActivityTemplate, "id" | "archived">): ActivityTemplate {
    const item: ActivityTemplate = {
      id: this.templateSeq++,
      ...data,
      archived: false,
    };
    this.templates.push(item);
    return item;
  }

  updateTemplate(id: number, patch: Partial<ActivityTemplate>): ActivityTemplate | null {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.templates[idx] = { ...this.templates[idx], ...patch };
    return this.templates[idx];
  }

  deleteTemplate(id: number): boolean {
    const initialLen = this.templates.length;
    this.templates = this.templates.filter((t) => t.id !== id);
    return this.templates.length < initialLen;
  }

  getTasksForDay(day: string): ScheduledTask[] {
    return this.tasks
      .filter((t) => t.day === day)
      .sort((a, b) => a.startMinutes - b.startMinutes || a.id - b.id);
  }

  getTasksBetween(from: string, to: string): ScheduledTask[] {
    return this.tasks
      .filter((t) => t.day >= from && t.day <= to)
      .sort((a, b) => a.day.localeCompare(b.day) || a.startMinutes - b.startMinutes);
  }

  createTask(data: Omit<ScheduledTask, "id">): ScheduledTask {
    const item: ScheduledTask = {
      id: this.taskSeq++,
      ...data,
    };
    this.tasks.push(item);
    return item;
  }

  updateTask(id: number, patch: Partial<ScheduledTask>): ScheduledTask | null {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...patch };
    return this.tasks[idx];
  }

  deleteTask(id: number): boolean {
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < initialLen;
  }
}

const memoryStore = new MemoryStore();

// Postgres Pool check
let postgresPool: InstanceType<typeof Pool> | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;
let isPostgresHealthy: boolean | null = null;

function getPostgresUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

async function tryInitPostgres() {
  const url = getPostgresUrl();
  if (!url) {
    isPostgresHealthy = false;
    return null;
  }
  if (drizzleDb) return drizzleDb;

  try {
    const pool = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 1500,
    });
    // Test connection
    const client = await pool.connect();
    client.release();
    postgresPool = pool;
    drizzleDb = drizzle(pool);
    isPostgresHealthy = true;
    return drizzleDb;
  } catch {
    isPostgresHealthy = false;
    return null;
  }
}

let seedPromise: Promise<void> | null = null;
async function ensurePostgresSeeded(db: NonNullable<typeof drizzleDb>) {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityTemplatesTable);
      if ((row?.count ?? 0) > 0) return;

      const inserted = await db
        .insert(activityTemplatesTable)
        .values(DEFAULT_TEMPLATES)
        .returning();

      const byName = new Map(inserted.map((item) => [item.name, item]));
      const plan = (name: string, day: number, start: number) => {
        const template = byName.get(name);
        if (!template) return null;
        return {
          templateId: template.id,
          title: template.name,
          emoji: template.emoji,
          color: template.color,
          category: template.category,
          day: isoOffset(day),
          startMinutes: start,
          durationMinutes: template.defaultDuration,
          notes: template.notes,
        };
      };

      const demoTasks = [
        plan("Morning routine", 0, 7 * 60),
        plan("Working on projects", 0, 9 * 60),
        plan("Emails & admin", 0, 11 * 60 + 30),
        plan("Meals", 0, 12 * 60 + 30),
        plan("Workout", 0, 18 * 60),
        plan("Morning routine", 1, 7 * 60),
        plan("Deep clean", 1, 10 * 60),
        plan("Study / learning", 1, 15 * 60),
        plan("Errands", 2, 13 * 60),
      ].filter((value): value is NonNullable<typeof value> => value !== null);

      if (demoTasks.length) {
        await db.insert(scheduledTasksTable).values(demoTasks);
      }
    } catch (err) {
      console.warn("Postgres seed skipped:", err);
    }
  })();
  return seedPromise;
}

export const dbService = {
  async isHealthy(): Promise<boolean> {
    const db = await tryInitPostgres();
    if (db) {
      try {
        await db.execute(sql`select 1`);
        return true;
      } catch {
        return false;
      }
    }
    return true; // Memory fallback is always healthy
  },

  async listTemplates(): Promise<ActivityTemplate[]> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.getTemplates();
    }
    await ensurePostgresSeeded(db);
    const rows = await db
      .select()
      .from(activityTemplatesTable)
      .orderBy(asc(activityTemplatesTable.category), asc(activityTemplatesTable.id));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      defaultDuration: row.defaultDuration,
      notes: row.notes,
      archived: row.archived,
    }));
  },

  async createTemplate(
    draft: Omit<ActivityTemplate, "id" | "archived">,
  ): Promise<ActivityTemplate> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.createTemplate(draft);
    }
    const [row] = await db
      .insert(activityTemplatesTable)
      .values({
        name: draft.name.slice(0, 80),
        emoji: (draft.emoji || "📌").slice(0, 8),
        color: draft.color || "indigo",
        category: (draft.category || "General").slice(0, 40),
        defaultDuration: draft.defaultDuration,
        notes: draft.notes ? draft.notes.slice(0, 500) : null,
      })
      .returning();
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      defaultDuration: row.defaultDuration,
      notes: row.notes,
      archived: row.archived,
    };
  },

  async updateTemplate(
    id: number,
    patch: Partial<Omit<ActivityTemplate, "id">>,
  ): Promise<ActivityTemplate | null> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.updateTemplate(id, patch);
    }
    const updates: Partial<typeof activityTemplatesTable.$inferInsert> = {};
    if (patch.name !== undefined) updates.name = patch.name.slice(0, 80);
    if (patch.emoji !== undefined) updates.emoji = patch.emoji.slice(0, 8);
    if (patch.color !== undefined) updates.color = patch.color;
    if (patch.category !== undefined) updates.category = patch.category.slice(0, 40);
    if (patch.defaultDuration !== undefined) updates.defaultDuration = patch.defaultDuration;
    if (patch.notes !== undefined) updates.notes = patch.notes ? patch.notes.slice(0, 500) : null;
    if (patch.archived !== undefined) updates.archived = patch.archived;

    const [row] = await db
      .update(activityTemplatesTable)
      .set(updates)
      .where(eq(activityTemplatesTable.id, id))
      .returning();
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      defaultDuration: row.defaultDuration,
      notes: row.notes,
      archived: row.archived,
    };
  },

  async deleteTemplate(id: number): Promise<boolean> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.deleteTemplate(id);
    }
    const [row] = await db
      .delete(activityTemplatesTable)
      .where(eq(activityTemplatesTable.id, id))
      .returning();
    return Boolean(row);
  },

  async listTasksForDay(day: string): Promise<ScheduledTask[]> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.getTasksForDay(day);
    }
    await ensurePostgresSeeded(db);
    const rows = await db
      .select()
      .from(scheduledTasksTable)
      .where(eq(scheduledTasksTable.day, day))
      .orderBy(asc(scheduledTasksTable.startMinutes), asc(scheduledTasksTable.id));
    return rows.map((row) => ({
      id: row.id,
      templateId: row.templateId,
      title: row.title,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      day: row.day,
      startMinutes: row.startMinutes,
      durationMinutes: row.durationMinutes,
      notes: row.notes,
      completed: row.completed,
    }));
  },

  async listTasksBetween(from: string, to: string): Promise<ScheduledTask[]> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.getTasksBetween(from, to);
    }
    await ensurePostgresSeeded(db);
    const rows = await db
      .select()
      .from(scheduledTasksTable)
      .where(
        and(gte(scheduledTasksTable.day, from), lte(scheduledTasksTable.day, to)),
      )
      .orderBy(asc(scheduledTasksTable.day), asc(scheduledTasksTable.startMinutes));
    return rows.map((row) => ({
      id: row.id,
      templateId: row.templateId,
      title: row.title,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      day: row.day,
      startMinutes: row.startMinutes,
      durationMinutes: row.durationMinutes,
      notes: row.notes,
      completed: row.completed,
    }));
  },

  async createTask(
    draft: Omit<ScheduledTask, "id">,
  ): Promise<ScheduledTask> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.createTask(draft);
    }
    const [row] = await db
      .insert(scheduledTasksTable)
      .values({
        templateId: draft.templateId,
        title: draft.title.slice(0, 120),
        emoji: (draft.emoji || "📌").slice(0, 8),
        color: draft.color || "indigo",
        category: (draft.category || "General").slice(0, 40),
        day: draft.day,
        startMinutes: draft.startMinutes,
        durationMinutes: draft.durationMinutes,
        notes: draft.notes ? draft.notes.slice(0, 500) : null,
        completed: draft.completed,
      })
      .returning();
    return {
      id: row.id,
      templateId: row.templateId,
      title: row.title,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      day: row.day,
      startMinutes: row.startMinutes,
      durationMinutes: row.durationMinutes,
      notes: row.notes,
      completed: row.completed,
    };
  },

  async updateTask(
    id: number,
    patch: Partial<Omit<ScheduledTask, "id">>,
  ): Promise<ScheduledTask | null> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.updateTask(id, patch);
    }
    const updates: Partial<typeof scheduledTasksTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (patch.title !== undefined) updates.title = patch.title.slice(0, 120);
    if (patch.emoji !== undefined) updates.emoji = patch.emoji.slice(0, 8);
    if (patch.color !== undefined) updates.color = patch.color;
    if (patch.category !== undefined) updates.category = patch.category.slice(0, 40);
    if (patch.day !== undefined) updates.day = patch.day;
    if (patch.startMinutes !== undefined) updates.startMinutes = patch.startMinutes;
    if (patch.durationMinutes !== undefined) updates.durationMinutes = patch.durationMinutes;
    if (patch.notes !== undefined) updates.notes = patch.notes ? patch.notes.slice(0, 500) : null;
    if (patch.completed !== undefined) updates.completed = patch.completed;

    const [row] = await db
      .update(scheduledTasksTable)
      .set(updates)
      .where(eq(scheduledTasksTable.id, id))
      .returning();
    if (!row) return null;
    return {
      id: row.id,
      templateId: row.templateId,
      title: row.title,
      emoji: row.emoji,
      color: row.color,
      category: row.category,
      day: row.day,
      startMinutes: row.startMinutes,
      durationMinutes: row.durationMinutes,
      notes: row.notes,
      completed: row.completed,
    };
  },

  async deleteTask(id: number): Promise<boolean> {
    const db = await tryInitPostgres();
    if (!db) {
      return memoryStore.deleteTask(id);
    }
    const [row] = await db
      .delete(scheduledTasksTable)
      .where(eq(scheduledTasksTable.id, id))
      .returning();
    return Boolean(row);
  },
};
