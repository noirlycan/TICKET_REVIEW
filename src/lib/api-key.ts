import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `tr_${randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 10);
  const hash = hashApiKey(raw);
  return { raw, prefix, hash };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function verifyApiKey(raw: string | null | undefined) {
  if (!raw) return null;
  const keyHash = hashApiKey(raw);
  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    include: { createdBy: { select: { id: true, username: true } } },
  });
  return apiKey;
}
