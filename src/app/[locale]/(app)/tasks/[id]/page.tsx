import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { ReviewEventCard } from "@/components/ReviewEventCard";
import { CommentBody } from "@/components/CommentBody";
import {
  addComment,
  allowApprove,
  allowApproveWithoutReview,
  cancelTask,
} from "@/app/actions/tasks";
import { DeleteTaskButton } from "@/components/DeleteTaskButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("tasks");

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      createdBy: { select: { username: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { username: true } } },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!task) notFound();

  const canAllow = task.status === "reviewed";
  const canSkipReview = [
    "pending",
    "in_review",
    "needs_revision",
    "reviewed",
  ].includes(task.status);
  const canComment =
    task.status !== "cancelled" && task.status !== "approved";
  const canCancel =
    task.status !== "cancelled" && task.status !== "approved";

  return (
    <div className="space-y-6">
      <Link href="/tasks" className="text-sm text-muted hover:underline">
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            {task.skipReview && task.status === "allow_approve" ? (
              <span className="rounded border border-warning bg-amber-50 px-2 py-0.5 text-xs font-medium text-warning">
                {t("skipReviewBadge")}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {t("createdBy")}: {task.createdBy.username}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAllow ? (
            <form action={allowApprove.bind(null, task.id)}>
              <button
                type="submit"
                className="rounded bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover"
              >
                {t("allowApprove")}
              </button>
            </form>
          ) : null}
          {canSkipReview ? (
            <form action={allowApproveWithoutReview.bind(null, task.id)}>
              <button
                type="submit"
                className="rounded border border-warning bg-amber-50 px-3 py-2 text-sm text-warning hover:bg-amber-100"
              >
                {t("allowApproveWithoutReview")}
              </button>
            </form>
          ) : null}
          {canCancel ? (
            <form action={cancelTask.bind(null, task.id)}>
              <button
                type="submit"
                className="rounded border border-danger px-3 py-2 text-sm text-danger"
              >
                {t("cancel")}
              </button>
            </form>
          ) : null}
          <DeleteTaskButton taskId={task.id} />
        </div>
      </div>

      <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
        {task.description ? <p>{task.description}</p> : null}
        <p>
          <span className="text-muted">MR: </span>
          <a
            href={task.mrUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            {task.mrUrl}
          </a>
        </p>
        {task.mrIid ? (
          <p>
            <span className="text-muted">MR IID: </span>
            {task.mrIid}
          </p>
        ) : null}
        {task.projectId ? (
          <p>
            <span className="text-muted">Project ID: </span>
            {task.projectId}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("timeline")}</h2>
        {task.events.length === 0 ? (
          <p className="text-sm text-muted">{t("noEvents")}</p>
        ) : (
          <ul className="space-y-3">
            {task.events.map((event) => (
              <li key={event.id}>
                <ReviewEventCard
                  type={event.type}
                  payload={event.payload}
                  createdAt={event.createdAt.toLocaleString()}
                  taskTitle={task.title}
                  mrUrl={task.mrUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("comments")}</h2>
        {task.comments.length === 0 ? (
          <p className="text-sm text-muted">{t("noComments")}</p>
        ) : (
          <ul className="space-y-2">
            {task.comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded border border-border bg-card p-3 text-sm"
              >
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{comment.author.username}</span>
                  <span>{comment.createdAt.toLocaleString()}</span>
                </div>
                <CommentBody body={comment.body} />
              </li>
            ))}
          </ul>
        )}

        {canComment ? (
          <form
            action={addComment.bind(null, task.id)}
            className="space-y-2 rounded-lg border border-border bg-card p-4"
          >
            <label className="block space-y-1 text-sm">
              <span>{t("addComment")}</span>
              <textarea
                name="body"
                required
                rows={3}
                placeholder={t("commentPlaceholder")}
                className="w-full rounded border border-border px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded border border-border px-3 py-2 text-sm hover:bg-background"
            >
              {t("submitComment")}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
