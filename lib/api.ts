import type { ActivityTemplate, ScheduledTask } from "~/lib/types";

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
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
  templateId?: number | null;
};

export type TaskPatch = Partial<Omit<TaskDraft, "day">> & { day?: string };

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
  async updateTask(id: number, patch: TaskPatch): Promise<ScheduledTask> {
    const data = await request<{ task: ScheduledTask }>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return data.task;
  },
  async deleteTask(id: number): Promise<void> {
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
    id: number,
    patch: Partial<Omit<ActivityTemplate, "id" | "archived">> & { archived?: boolean },
  ): Promise<ActivityTemplate> {
    const data = await request<{ template: ActivityTemplate }>(
      `/api/templates/${id}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return data.template;
  },
  async deleteTemplate(id: number): Promise<void> {
    await request<{ ok: true }>(`/api/templates/${id}`, { method: "DELETE" });
  },
};
