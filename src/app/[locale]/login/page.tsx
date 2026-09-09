"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const locale = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError(true);
      return;
    }
    router.replace("/tasks");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <select
            className="rounded border border-border bg-card px-2 py-1 text-sm"
            value={locale}
            onChange={(e) => {
              window.location.href = `/${e.target.value}/login`;
            }}
          >
            <option value="en">EN</option>
            <option value="vi">VI</option>
          </select>
        </div>
        <label className="block space-y-1 text-sm">
          <span>{t("username")}</span>
          <input
            className="w-full rounded border border-border px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("password")}</span>
          <input
            type="password"
            className="w-full rounded border border-border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-danger">{t("error")}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-accent px-3 py-2 text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
