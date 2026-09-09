import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiKey, serializeTask } from "@/lib/api-v1";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { id } = await context.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { username: true } } },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ task: serializeTask(task, true) });
}
