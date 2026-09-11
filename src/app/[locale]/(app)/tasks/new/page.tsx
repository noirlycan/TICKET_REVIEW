import { getTranslations } from "next-intl/server";
import { createTask } from "@/app/actions/tasks";
import { Link } from "@/i18n/navigation";

export default async function NewTaskPage() {
  const t = await getTranslations("tasks");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/tasks" className="text-sm text-muted hover:underline">
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("createTitle")}</h1>
      <form action={createTask} className="space-y-3 rounded-lg border border-border bg-card p-4">
        <label className="block space-y-1 text-sm">
          <span>{t("fieldTitle")}</span>
          <input
            name="title"
            required
            className="w-full rounded border border-border px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("fieldDescription")}</span>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded border border-border px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("fieldMrUrl")}</span>
          <input
            name="mrUrl"
            type="url"
            required
            placeholder="https://gitlab.example.com/group/project/-/merge_requests/42"
            className="w-full rounded border border-border px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("fieldMrIid")}</span>
          <input
            name="mrIid"
            className="w-full rounded border border-border px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("fieldProjectId")}</span>
          <input
            name="projectId"
            className="w-full rounded border border-border px-3 py-2"
          />
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded border border-warning bg-amber-50 px-3 py-3 text-sm">
          <input
            type="checkbox"
            name="skipReview"
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-warning">
              {t("fieldSkipReview")}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {t("fieldSkipReviewHelp")}
            </span>
          </span>
        </label>
        <button
          type="submit"
          className="rounded bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover"
        >
          {t("submitCreate")}
        </button>
      </form>
    </div>
  );
}
