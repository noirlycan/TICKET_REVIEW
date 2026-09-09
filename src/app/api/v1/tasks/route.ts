import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseStatusList } from "@/lib/task-status";
import { requireApiKey, serializeTask } from "@/lib/api-v1";

export async function GET(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const statuses = parseStatusList(statusParam);

  if (statusParam && !statuses) {
    return NextResponse.json(
      { error: "Invalid status filter" },
      { status: 400 },
    );
  }

  const tasks = await prisma.task.findMany({
    where: statuses ? { status: { in: statuses } } : undefined,
    orderBy: { updatedAt: "asc" },
  });

  return NextResponse.json({
    tasks: tasks.map((task) => serializeTask(task)),
  });
}
