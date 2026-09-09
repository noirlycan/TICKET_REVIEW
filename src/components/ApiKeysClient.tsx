"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
};

export function ApiKeysClient({ keys: initialKeys }: { keys: ApiKeyRow[] }) {
  const t = useTranslations("apiKeys");
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name") || "").trim();
    if (!name) return;

    setError(null);
    setRawKey(null);
    startTransition(async () => {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { raw?: string; error?: string };
      if (!res.ok) {
        setError(data.error || "Failed to create key");
        return;
      }
      setRawKey(data.raw ?? null);
      form.reset();
      const listRes = await fetch("/api/api-keys");
      if (listRes.ok) {
        const list = (await listRes.json()) as { keys: ApiKeyRow[] };
        setKeys(list.keys);
      }
      router.refresh();
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to revoke key");
        return;
      }
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k,
        ),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
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
                        disabled={pending}
                        onClick={() => handleRevoke(key.id)}
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
