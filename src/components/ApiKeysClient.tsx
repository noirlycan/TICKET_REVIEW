"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createApiKey, revokeApiKey } from "@/app/actions/api-keys";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
};

export function ApiKeysClient({ keys }: { keys: ApiKeyRow[] }) {
  const t = useTranslations("apiKeys");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onCreate(formData: FormData) {
    setError(null);
    setRawKey(null);
    startTransition(async () => {
      const result = await createApiKey(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRawKey(result.raw);
    });
  }

  return (
    <div className="space-y-4">
      <form action={onCreate} className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-sm">
          <span>{t("name")}</span>
          <input
            name="name"
            required
            className="block rounded border border-border px-3 py-2"
            placeholder="review-bot"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {t("create")}
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {rawKey ? (
        <div className="rounded border border-warning bg-amber-50 p-3 text-sm">
          <p className="mb-2 font-medium">{t("createdOnce")}</p>
          <code className="block break-all font-mono text-xs">{rawKey}</code>
        </div>
      ) : null}

      {keys.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-3 py-2">{t("name")}</th>
                <th className="px-3 py-2">{t("prefix")}</th>
                <th className="px-3 py-2">{t("createdAt")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    {key.name}{" "}
                    <span className="text-xs text-muted">
                      ({key.revokedAt ? t("revoked") : t("active")})
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{key.keyPrefix}…</td>
                  <td className="px-3 py-2 text-muted">
                    {new Date(key.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!key.revokedAt ? (
                      <button
                        type="button"
                        className="text-danger hover:underline"
                        onClick={() =>
                          startTransition(async () => {
                            await revokeApiKey(key.id);
                          })
                        }
                      >
                        {t("revoke")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
