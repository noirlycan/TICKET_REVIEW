import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key";

export async function requireApiKey(request: Request) {
  const raw =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const apiKey = await verifyApiKey(raw);
  if (!apiKey) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      apiKey: null,
    };
  }
  return { error: null, apiKey };
}

export function serializeTask(
  task: {
    id: string;
    title: string;
    description: string | null;
    mrUrl: string;
    mrIid: string | null;
    projectId: string | null;
    status: string;
    allowApprove: boolean;
    createdAt: Date;
    updatedAt: Date;
    comments?: Array<{
      id: string;
      body: string;
      createdAt: Date;
      author: { username: string };
    }>;
    events?: Array<{
      id: string;
      type: string;
      payload: string;
      createdAt: Date;
    }>;
  },
  detailed = false,
) {
  const base = {
    id: task.id,
    title: task.title,
    description: task.description,
    mrUrl: task.mrUrl,
    mrIid: task.mrIid,
    projectId: task.projectId,
    status: task.status,
    allowApprove: task.allowApprove,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };

  if (!detailed) return base;

  return {
    ...base,
    comments:
      task.comments?.map((c) => ({
        id: c.id,
        body: c.body,
        author: c.author.username,
        createdAt: c.createdAt.toISOString(),
      })) ?? [],
    events:
      task.events?.map((e) => ({
        id: e.id,
        type: e.type,
        payload: safeJson(e.payload),
        createdAt: e.createdAt.toISOString(),
      })) ?? [],
  };
}

function safeJson(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}
