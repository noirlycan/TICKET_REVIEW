import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ApiKeysClient } from "@/components/ApiKeysClient";

export default async function ApiKeysPage() {
  const t = await getTranslations("apiKeys");
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
      </div>
      <ApiKeysClient
        keys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          createdAt: k.createdAt.toISOString(),
          revokedAt: k.revokedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
