"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteTask } from "@/app/actions/tasks";

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const t = useTranslations("tasks");
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteTask(taskId);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded bg-danger px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("deleting") : t("delete")}
    </button>
  );
}
