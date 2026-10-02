import type { ActivityTemplate, Category, ScheduledTask, ChecklistItem, DayChecklist, DayNotes } from "~/lib/types";
import { getIdToken } from "~/composables/useAuth";

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const token = await getIdToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      // Our own errors carry `error: "…"`; the framework's carry `statusMessage` (and `error: true`).
      const body = (await response.json()) as { error?: unknown; statusMessage?: string; message?: string };
      const text = typeof body?.error === "string" ? body.error : body?.statusMessage || body?.message;
      if (text) message = text;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export type TaskDraft = {
  day: string;
  title: string;
  emoji: string;
  color: string;
  category: string;
  startMinutes: number;
  durationMinutes: number;
  notes?: string | null;
  completed?: boolean;
  templateId?: string | null;
  lane?: number;
};

/** `lane: null` clears a block's column, so it is placed automatically again. */
export type TaskPatch = Partial<Omit<TaskDraft, "day" | "lane">> & { day?: string; lane?: number | null };

export const api = {
  async getTasksForDay(day: string): Promise<ScheduledTask[]> {
    const data = await request<{ tasks: ScheduledTask[] }>(`/api/tasks?day=${day}`, {
      method: "GET",
    });
    return data.tasks;
  },
  async getTasksBetween(from: string, to: string): Promise<ScheduledTask[]> {
    const data = await request<{ tasks: ScheduledTask[] }>(`/api/tasks?from=${from}&to=${to}`, {
      method: "GET",
    });
    return data.tasks;
  },
  async getTemplates(): Promise<ActivityTemplate[]> {
    const data = await request<{ templates: ActivityTemplate[] }>("/api/templates", {
      method: "GET",
    });
    return data.templates;
  },
  async createTask(draft: TaskDraft): Promise<ScheduledTask> {
    const data = await request<{ task: ScheduledTask }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    return data.task;
  },
  async updateTask(id: string, patch: TaskPatch): Promise<ScheduledTask> {
    const data = await request<{ task: ScheduledTask }>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return data.task;
  },
  async deleteTask(id: string): Promise<void> {
    await request<{ ok: true }>(`/api/tasks/${id}`, { method: "DELETE" });
  },
  async createTemplate(
    draft: Omit<ActivityTemplate, "id" | "archived">,
  ): Promise<ActivityTemplate> {
    const data = await request<{ template: ActivityTemplate }>("/api/templates", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    return data.template;
  },
  async updateTemplate(
    id: string,
    patch: Partial<Omit<ActivityTemplate, "id" | "archived">> & { archived?: boolean },
  ): Promise<ActivityTemplate> {
    const data = await request<{ template: ActivityTemplate }>(
      `/api/templates/${id}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return data.template;
  },
  async deleteTemplate(id: string): Promise<void> {
    await request<{ ok: true }>(`/api/templates/${id}`, { method: "DELETE" });
  },
  async getCategories(): Promise<Category[]> {
    const data = await request<{ categories: Category[] }>("/api/categories", { method: "GET" });
    return data.categories;
  },
  async createCategory(draft: Omit<Category, "id">): Promise<Category> {
    const data = await request<{ category: Category }>("/api/categories", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    return data.category;
  },
  async updateCategory(id: string, patch: Partial<Omit<Category, "id">>): Promise<Category> {
    const data = await request<{ category: Category }>(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return data.category;
  },
  /** Its activities either go to the category named `moveTo`, or are deleted along with it. */
  async deleteCategory(id: string, target?: { moveTo: string } | { deleteActivities: true }): Promise<void> {
    const query =
      target && "moveTo" in target
        ? `?moveTo=${encodeURIComponent(target.moveTo)}`
        : target
          ? "?deleteActivities=1"
          : "";
    await request<{ ok: true }>(`/api/categories/${id}${query}`, { method: "DELETE" });
  },
  async getChecklistItems(): Promise<ChecklistItem[]> {
    const data = await request<{ items: ChecklistItem[] }>("/api/checklist/items", {
      method: "GET",
    });
    return data.items;
  },
  async createChecklistItem(draft: { title: string; emoji: string; order?: number }): Promise<ChecklistItem> {
    const data = await request<{ item: ChecklistItem }>("/api/checklist/items", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    return data.item;
  },
  async updateChecklistItem(
    id: string,
    patch: Partial<Omit<ChecklistItem, "id">>,
  ): Promise<ChecklistItem> {
    const data = await request<{ item: ChecklistItem }>(`/api/checklist/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return data.item;
  },
  async deleteChecklistItem(id: string): Promise<void> {
    await request<{ ok: true }>(`/api/checklist/items/${id}`, { method: "DELETE" });
  },
  async getDayChecklist(day: string): Promise<DayChecklist> {
    const data = await request<{ dayChecklist: DayChecklist }>(`/api/checklist/day?day=${day}`, {
      method: "GET",
    });
    return data.dayChecklist;
  },
  async toggleChecklistItem(day: string, itemId: string, completed: boolean): Promise<DayChecklist> {
    const data = await request<{ dayChecklist: DayChecklist }>("/api/checklist/toggle", {
      method: "POST",
      body: JSON.stringify({ day, itemId, completed }),
    });
    return data.dayChecklist;
  },
  async hideChecklistItem(day: string, itemId: string, hidden: boolean): Promise<DayChecklist> {
    const data = await request<{ dayChecklist: DayChecklist }>("/api/checklist/hide", {
      method: "POST",
      body: JSON.stringify({ day, itemId, hidden }),
    });
    return data.dayChecklist;
  },
  async addDayChecklistExtra(day: string, draft: { title: string; emoji: string }): Promise<DayChecklist> {
    const data = await request<{ dayChecklist: DayChecklist }>("/api/checklist/extras", {
      method: "POST",
      body: JSON.stringify({ day, ...draft }),
    });
    return data.dayChecklist;
  },
  async removeDayChecklistExtra(day: string, id: string): Promise<DayChecklist> {
    const data = await request<{ dayChecklist: DayChecklist }>(`/api/checklist/extras/${id}?day=${day}`, {
      method: "DELETE",
    });
    return data.dayChecklist;
  },
  async getDayNotes(day: string): Promise<DayNotes> {
    const data = await request<{ dayNotes: DayNotes }>(`/api/notes?day=${day}`, { method: "GET" });
    return data.dayNotes;
  },
  async saveDayNotes(day: string, text: string): Promise<DayNotes> {
    const data = await request<{ dayNotes: DayNotes }>("/api/notes", {
      method: "PUT",
      body: JSON.stringify({ day, text }),
    });
    return data.dayNotes;
  },
};
