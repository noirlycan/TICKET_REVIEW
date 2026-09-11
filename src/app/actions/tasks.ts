"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const mrUrl = String(formData.get("mrUrl") || "").trim();
  const mrIid = String(formData.get("mrIid") || "").trim();
  const projectId = String(formData.get("projectId") || "").trim();
  const skipReview = formData.get("skipReview") === "on";

  if (!title || !mrUrl) {
    throw new Error("Title and MR URL are required");
  }

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title,
        description: description || null,
        mrUrl,
        mrIid: mrIid || null,
        projectId: projectId || null,
        createdById: user.id,
        status: skipReview ? "allow_approve" : "pending",
        allowApprove: skipReview,
        skipReview,
      },
    });

    if (skipReview) {
      await tx.reviewEvent.create({
        data: {
          taskId: created.id,
          type: "status_note",
          payload: JSON.stringify({
            note: "Created with approve without review",
            skipReview: true,
            by: user.id,
          }),
        },
      });
    }

    return created;
  });

  const locale = await getLocale();
  redirect({ href: `/tasks/${task.id}`, locale });
}

export async function addComment(taskId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.status === "cancelled" || task.status === "approved") {
    throw new Error("Cannot comment on this task");
  }

  await prisma.$transaction([
    prisma.taskComment.create({
      data: { taskId, authorId: user.id, body },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: {
        status:
          task.status === "reviewed" || task.status === "in_review"
            ? "needs_revision"
            : task.status,
        allowApprove: false,
        skipReview: false,
      },
    }),
    prisma.reviewEvent.create({
      data: {
        taskId,
        type: "status_note",
        payload: JSON.stringify({
          note: "User added comment; status set to needs_revision if applicable",
          previousStatus: task.status,
        }),
      },
    }),
  ]);

  const locale = await getLocale();
  revalidatePath(`/${locale}/tasks/${taskId}`);
  revalidatePath(`/${locale}/tasks`);
}

export async function allowApprove(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.status !== "reviewed") {
    throw new Error("Task must be in reviewed status");
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: {
        status: "allow_approve",
        allowApprove: true,
        skipReview: false,
      },
    }),
    prisma.reviewEvent.create({
      data: {
        taskId,
        type: "status_note",
        payload: JSON.stringify({
          note: "User allowed approve after review",
          skipReview: false,
          by: user.id,
        }),
      },
    }),
  ]);

  const locale = await getLocale();
  revalidatePath(`/${locale}/tasks/${taskId}`);
  revalidatePath(`/${locale}/tasks`);
}

const SKIP_REVIEW_STATUSES = [
  "pending",
  "in_review",
  "needs_revision",
  "reviewed",
] as const;

export async function allowApproveWithoutReview(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (
    !task ||
    !SKIP_REVIEW_STATUSES.includes(
      task.status as (typeof SKIP_REVIEW_STATUSES)[number],
    )
  ) {
    throw new Error("Cannot skip review for this task status");
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: {
        status: "allow_approve",
        allowApprove: true,
        skipReview: true,
      },
    }),
    prisma.reviewEvent.create({
      data: {
        taskId,
        type: "status_note",
        payload: JSON.stringify({
          note: "User allowed approve without review",
          skipReview: true,
          previousStatus: task.status,
          by: user.id,
        }),
      },
    }),
  ]);

  const locale = await getLocale();
  revalidatePath(`/${locale}/tasks/${taskId}`);
  revalidatePath(`/${locale}/tasks`);
}

export async function cancelTask(taskId: string) {
  await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.status === "approved") {
    throw new Error("Cannot cancel this task");
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { status: "cancelled", allowApprove: false, skipReview: false },
    }),
    prisma.reviewEvent.create({
      data: {
        taskId,
        type: "status_note",
        payload: JSON.stringify({ note: "Task cancelled by user" }),
      },
    }),
  ]);

  const locale = await getLocale();
  revalidatePath(`/${locale}/tasks/${taskId}`);
  revalidatePath(`/${locale}/tasks`);
}

export async function deleteTask(taskId: string) {
  await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.task.delete({ where: { id: taskId } });

  const locale = await getLocale();
  revalidatePath(`/${locale}/tasks`);
  redirect({ href: "/tasks", locale });
}
