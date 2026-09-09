export type FindingSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info"
  | string;

export type ReviewFinding = {
  severity: FindingSeverity;
  title?: string;
  file?: string;
  message?: string;
  description?: string;
  [key: string]: unknown;
};

export type ReviewResultPayload = {
  summary: string;
  findings: ReviewFinding[];
  raw?: unknown;
};

export type StatusNotePayload = {
  note?: string;
  previousStatus?: string;
  by?: string;
  [key: string]: unknown;
};

export type ApprovedPayload = {
  note?: string;
  [key: string]: unknown;
};

export function parseJsonPayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

export function asReviewResult(payload: unknown): ReviewResultPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.summary !== "string") return null;
  const findings = Array.isArray(obj.findings)
    ? obj.findings.map(normalizeFinding).filter(Boolean)
    : [];
  return {
    summary: obj.summary,
    findings: findings as ReviewFinding[],
    raw: obj.raw,
  };
}

function normalizeFinding(item: unknown): ReviewFinding | null {
  if (!item || typeof item !== "object") {
    if (typeof item === "string") {
      return { severity: "info", title: item, message: item };
    }
    return null;
  }
  const f = item as Record<string, unknown>;
  const severity = String(f.severity ?? f.level ?? f.risk ?? "info").toLowerCase();
  return {
    ...f,
    severity,
    title: typeof f.title === "string" ? f.title : undefined,
    file: typeof f.file === "string" ? f.file : undefined,
    message: typeof f.message === "string" ? f.message : undefined,
    description:
      typeof f.description === "string"
        ? f.description
        : typeof f.details === "string"
          ? f.details
          : undefined,
  };
}

export function countBySeverity(findings: ReviewFinding[]) {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    const key = String(f.severity || "info").toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function formatReviewForCopy(
  review: ReviewResultPayload,
  meta?: { title?: string; mrUrl?: string; createdAt?: string },
): string {
  const lines: string[] = [];

  if (meta?.title) lines.push(`# ${meta.title}`);
  if (meta?.mrUrl) lines.push(`MR: ${meta.mrUrl}`);
  if (meta?.createdAt) lines.push(`Reviewed at: ${meta.createdAt}`);
  if (meta?.title || meta?.mrUrl || meta?.createdAt) lines.push("");

  lines.push(`## Summary`);
  lines.push(review.summary);
  lines.push("");

  if (review.findings.length === 0) {
    lines.push("No findings.");
    return lines.join("\n");
  }

  lines.push(`## Findings (${review.findings.length})`);
  lines.push("");

  review.findings.forEach((finding, index) => {
    const severity = String(finding.severity || "info").toUpperCase();
    const title =
      finding.title || finding.message || `Finding #${index + 1}`;
    lines.push(`### ${index + 1}. [${severity}] ${title}`);
    if (finding.file) lines.push(`File: ${finding.file}`);
    lines.push("");
    if (finding.description) {
      lines.push(finding.description.trim());
    } else if (finding.message && finding.message !== title) {
      lines.push(finding.message.trim());
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n").trim() + "\n";
}

export const SEVERITY_ORDER = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;
