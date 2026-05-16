import type { Lead, Scenario } from "./types";

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const apiModeEnabled = Boolean(apiUrl);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchApiLeads() {
  return request<Lead[]>("/api/leads");
}

export function createApiLead() {
  return request<Lead>("/api/leads", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function updateApiLead(id: string, patch: Partial<Lead>) {
  return request<Lead>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export function changeApiScenario(id: string, scenario: Scenario) {
  return request<Lead>(`/api/leads/${id}/scenario`, {
    method: "POST",
    body: JSON.stringify({ scenario })
  });
}

export function toggleApiTask(id: string, taskId: string) {
  return request<Lead>(`/api/leads/${id}/tasks/${taskId}/toggle`, {
    method: "POST"
  });
}

export function classifyApiMessage(id: string, message: string) {
  return request<Lead>(`/api/leads/${id}/classify`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}
