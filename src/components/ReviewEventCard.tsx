"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";
import {
  asReviewResult,
  countBySeverity,
  parseJsonPayload,
  SEVERITY_ORDER,
  type FindingSeverity,
  type ReviewFinding,
} from "@/lib/review-payload";

type Props = {
  type: string;
  payload: string;
  createdAt: string;
};

const SEVERITY_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-900 border-red-200",
  high: "bg-orange-100 text-orange-900 border-orange-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-sky-100 text-sky-900 border-sky-200",
  info: "bg-slate-100 text-slate-700 border-slate-200",
};

const TYPE_CLASS: Record<string, string> = {
  review_result: "bg-emerald-50 text-emerald-800 border-emerald-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  status_note: "bg-slate-50 text-slate-700 border-slate-200",
};

export function ReviewEventCard({ type, payload, createdAt }: Props) {
  const t = useTranslations("events");
  const parsed = useMemo(() => parseJsonPayload(payload), [payload]);

  if (type === "review_result") {
    const review = asReviewResult(parsed);
    if (review) {
      return (
        <article className="overflow-hidden rounded-lg border border-border bg-card">
          <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-background/60 px-4 py-3">
            <div className="space-y-1">
              <TypeLabel type={type} label={t("types.review_result")} />
              <h3 className="text-base font-semibold leading-snug">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                  }}
                >
                  {review.summary}
                </ReactMarkdown>
              </h3>
            </div>
            <time className="shrink-0 text-xs text-muted">{createdAt}</time>
          </header>

          <SeveritySummary findings={review.findings} />

          {review.findings.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">{t("noFindings")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {review.findings.map((finding, index) => (
                <FindingItem
                  key={`${finding.title ?? finding.message ?? index}-${index}`}
                  finding={finding}
                  index={index}
                />
              ))}
            </ul>
          )}
        </article>
      );
    }
  }

  if (type === "approved" && parsed && typeof parsed === "object") {
    const note =
      typeof (parsed as { note?: unknown }).note === "string"
        ? (parsed as { note: string }).note
        : null;
    return (
      <SimpleEvent
        type={type}
        typeLabel={t("types.approved")}
        createdAt={createdAt}
        body={
          <div className="prose-review text-sm">
            <ReactMarkdown>{note || t("approvedDefault")}</ReactMarkdown>
          </div>
        }
      />
    );
  }

  if (type === "status_note" && parsed && typeof parsed === "object") {
    const obj = parsed as { note?: string; previousStatus?: string };
    return (
      <SimpleEvent
        type={type}
        typeLabel={t("types.status_note")}
        createdAt={createdAt}
        body={
          <>
            {obj.note ? (
              <div className="prose-review text-sm">
                <ReactMarkdown>{obj.note}</ReactMarkdown>
              </div>
            ) : null}
            {obj.previousStatus ? (
              <p className="mt-1 text-xs text-muted">
                {t("previousStatus")}: {obj.previousStatus}
              </p>
            ) : null}
          </>
        }
      />
    );
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4 text-sm">
      <header className="mb-2 flex justify-between gap-2 text-xs text-muted">
        <TypeLabel type={type} label={type} />
        <time>{createdAt}</time>
      </header>
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
        {typeof parsed === "string"
          ? parsed
          : JSON.stringify(parsed, null, 2)}
      </pre>
    </article>
  );
}

function SeveritySummary({ findings }: { findings: ReviewFinding[] }) {
  const t = useTranslations("events");
  const counts = countBySeverity(findings);
  if (findings.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-xs">
      <span className="font-medium text-muted">
        {t("findingsCount", { count: findings.length })}
      </span>
      {SEVERITY_ORDER.filter((s) => counts[s]).map((severity) => (
        <SeverityBadge key={severity} severity={severity}>
          {severity} · {counts[severity]}
        </SeverityBadge>
      ))}
      {Object.keys(counts)
        .filter((s) => !(SEVERITY_ORDER as readonly string[]).includes(s))
        .map((severity) => (
          <SeverityBadge key={severity} severity={severity}>
            {severity} · {counts[severity]}
          </SeverityBadge>
        ))}
    </div>
  );
}

function FindingItem({
  finding,
  index,
}: {
  finding: ReviewFinding;
  index: number;
}) {
  const t = useTranslations("events");
  const title =
    finding.title ||
    finding.message ||
    t("findingFallback", { n: index + 1 });
  const detailMarkdown =
    finding.description ||
    (finding.message && finding.message !== title ? finding.message : null);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start gap-2">
        <SeverityBadge severity={finding.severity}>
          {finding.severity}
        </SeverityBadge>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-snug">{title}</p>
          {finding.file ? (
            <p className="break-all font-mono text-xs text-muted">
              {finding.file}
            </p>
          ) : null}
        </div>
      </div>

      {detailMarkdown ? (
        <div className="prose-review mt-3 rounded-md border border-border bg-background p-3 text-sm">
          <ReactMarkdown>{detailMarkdown}</ReactMarkdown>
        </div>
      ) : null}
    </li>
  );
}

function SeverityBadge({
  severity,
  children,
}: {
  severity: FindingSeverity;
  children: React.ReactNode;
}) {
  const key = String(severity).toLowerCase();
  const cls = SEVERITY_CLASS[key] ?? SEVERITY_CLASS.info;
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}

function TypeLabel({ type, label }: { type: string; label: string }) {
  const cls = TYPE_CLASS[type] ?? TYPE_CLASS.status_note;
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function SimpleEvent({
  type,
  typeLabel,
  createdAt,
  body,
}: {
  type: string;
  typeLabel: string;
  createdAt: string;
  body: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 text-sm">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <TypeLabel type={type} label={typeLabel} />
        <time className="text-xs text-muted">{createdAt}</time>
      </header>
      <div>{body}</div>
    </article>
  );
}
