"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "ticket-review-auto-refresh";
const INTERVAL_MS = 10_000;

export function AutoRefresh({
  enabledWhen = true,
}: {
  /** When false, auto-refresh stays off (e.g. terminal statuses). */
  enabledWhen?: boolean;
}) {
  const t = useTranslations("tasks");
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [lastAt, setLastAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "0") setEnabled(false);
      if (saved === "1") setEnabled(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled || !enabledWhen) return;

    const tick = () => {
      router.refresh();
      setLastAt(new Date().toLocaleTimeString());
    };

    const id = window.setInterval(tick, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, enabledWhen, router]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <label className="inline-flex cursor-pointer items-center gap-1.5">
        <input
          type="checkbox"
          checked={enabled && enabledWhen}
          disabled={!enabledWhen}
          onChange={toggle}
          className="rounded border-border"
        />
        <span>{t("autoRefresh")}</span>
      </label>
      <button
        type="button"
        onClick={() => {
          router.refresh();
          setLastAt(new Date().toLocaleTimeString());
        }}
        className="rounded border border-border px-2 py-0.5 hover:bg-background"
      >
        {t("refreshNow")}
      </button>
      {lastAt ? (
        <span>
          {t("lastRefresh")}: {lastAt}
        </span>
      ) : null}
    </div>
  );
}
