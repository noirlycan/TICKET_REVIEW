import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiKey, serializeTask } from "@/lib/api-v1";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  note: z.string().optional(),
});

export async function POST(request: Request, context: Ctx) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { id } = await context.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (task.status !== "allow_approve") {
    return NextResponse.json(
      { error: `Task is not allow_approve (current: ${task.status})` },
      { status: 409 },
    );
  }

  let note: string | undefined;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    note = parsed.data.note;
  } catch {
    note = undefined;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reviewEvent.create({
      data: {
        taskId: id,
        type: "approved",
        payload: JSON.stringify({ note: note ?? "MR approved by review system" }),
      },
    });
    return tx.task.update({
      where: { id },
      data: { status: "approved", allowApprove: false },
    });
  });

  return NextResponse.json({ task: serializeTask(updated) });
}
