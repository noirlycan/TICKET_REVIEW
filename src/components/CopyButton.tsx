"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-background"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export function CopyReviewButton({ text }: { text: string }) {
  const t = useTranslations("events");
  return (
    <CopyButton
      text={text}
      label={t("copyReview")}
      copiedLabel={t("copied")}
    />
  );
}
