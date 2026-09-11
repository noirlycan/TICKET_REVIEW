import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiKey, serializeTask } from "@/lib/api-v1";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  summary: z.string().min(1),
  findings: z.array(z.unknown()).optional().default([]),
  raw: z.unknown().optional(),
});

export async function POST(request: Request, context: Ctx) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { id } = await context.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    task.status !== "in_review" &&
    task.status !== "pending" &&
    task.status !== "needs_revision"
  ) {
    return NextResponse.json(
      { error: `Cannot post review for status ${task.status}` },
      { status: 409 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reviewEvent.create({
      data: {
        taskId: id,
        type: "review_result",
        payload: JSON.stringify(parsed.data),
      },
    });
    return tx.task.update({
      where: { id },
      data: { status: "reviewed", allowApprove: false, skipReview: false },
    });
  });

  return NextResponse.json({ task: serializeTask(updated) });
}
