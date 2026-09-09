"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { generateApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/db";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createApiKey(
  formData: FormData,
): Promise<{ raw: string } | { error: string }> {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name required" };

  const { raw, prefix, hash } = generateApiKey();
  await prisma.apiKey.create({
    data: {
      name,
      keyHash: hash,
      keyPrefix: prefix,
      createdById: user.id,
    },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/api-keys`);
  return { raw };
}

export async function revokeApiKey(id: string) {
  await requireUser();
  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  const locale = await getLocale();
  revalidatePath(`/${locale}/api-keys`);
}
