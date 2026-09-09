"use client";

import { TaskStatus } from "@prisma/client";
import { useTranslations } from "next-intl";

const STATUS_CLASSES: Record<TaskStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_review: "bg-sky-100 text-sky-800",
  reviewed: "bg-amber-100 text-amber-900",
  needs_revision: "bg-orange-100 text-orange-900",
  allow_approve: "bg-emerald-100 text-emerald-900",
  approved: "bg-green-100 text-green-900",
  cancelled: "bg-zinc-100 text-zinc-600",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const t = useTranslations("status");
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {t(status)}
    </span>
  );
}
