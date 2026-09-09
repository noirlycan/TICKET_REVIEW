import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiKey, serializeTask } from "@/lib/api-v1";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { id } = await context.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (task.status !== "pending" && task.status !== "needs_revision") {
    return NextResponse.json(
      {
        error: `Cannot claim task in status ${task.status}`,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.task.update({
      where: { id },
      data: { status: "in_review" },
    });
    await tx.reviewEvent.create({
      data: {
        taskId: id,
        type: "status_note",
        payload: JSON.stringify({
          note: "Claimed by review system",
          previousStatus: task.status,
        }),
      },
    });
    return claimed;
  });

  return NextResponse.json({ task: serializeTask(updated) });
}
