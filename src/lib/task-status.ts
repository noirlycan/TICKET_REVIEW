import { TaskStatus } from "@prisma/client";

export const TASK_STATUSES = [
  "pending",
  "in_review",
  "reviewed",
  "needs_revision",
  "allow_approve",
  "approved",
  "cancelled",
] as const satisfies readonly TaskStatus[];

export function parseStatusList(value: string | null): TaskStatus[] | null {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const invalid = parts.filter(
    (p) => !TASK_STATUSES.includes(p as TaskStatus),
  );
  if (invalid.length > 0) return null;
  return parts as TaskStatus[];
}
