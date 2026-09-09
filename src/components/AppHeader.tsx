"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { signOut } from "next-auth/react";

export function AppHeader({ username }: { username?: string | null }) {
  const t = useTranslations("app");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: "en" | "vi") {
    router.replace(pathname, { locale: next });
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/tasks" className="font-semibold tracking-tight">
            {t("title")}
          </Link>
          <nav className="flex gap-3 text-sm text-muted">
            <Link href="/tasks" className="hover:text-foreground">
              {t("navTasks")}
            </Link>
            <Link href="/api-keys" className="hover:text-foreground">
              {t("navApiKeys")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1 text-muted">
            <span className="sr-only">{t("language")}</span>
            <select
              className="rounded border border-border bg-card px-2 py-1"
              value={locale}
              onChange={(e) => switchLocale(e.target.value as "en" | "vi")}
            >
              <option value="en">EN</option>
              <option value="vi">VI</option>
            </select>
          </label>
          {username ? <span className="text-muted">{username}</span> : null}
          <button
            type="button"
            className="rounded border border-border px-2 py-1 hover:bg-background"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
