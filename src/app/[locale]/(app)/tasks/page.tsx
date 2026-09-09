import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskStatus } from "@prisma/client";
import { TASK_STATUSES } from "@/lib/task-status";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function TasksPage({ searchParams }: Props) {
  const t = await getTranslations("tasks");
  const params = await searchParams;
  const statusFilter =
    params.status && TASK_STATUSES.includes(params.status as TaskStatus)
      ? (params.status as TaskStatus)
      : undefined;

  const tasks = await prisma.task.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link
          href="/tasks/new"
          className="rounded bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover"
        >
          {t("new")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/tasks"
          className={`rounded border px-2 py-1 ${!statusFilter ? "border-accent text-accent" : "border-border text-muted"}`}
        >
          {t("filterAll")}
        </Link>
        {TASK_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/tasks?status=${status}`}
            className={`rounded border px-2 py-1 ${statusFilter === status ? "border-accent text-accent" : "border-border text-muted"}`}
          >
            <StatusBadge status={status} />
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{t("columns.title")}</th>
                <th className="px-3 py-2 font-medium">{t("columns.status")}</th>
                <th className="px-3 py-2 font-medium">{t("columns.mr")}</th>
                <th className="px-3 py-2 font-medium">{t("columns.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={task.mrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted hover:underline"
                    >
                      {task.mrUrl}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {task.updatedAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
