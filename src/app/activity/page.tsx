import { Icon, type IconName } from "@/components/icons";
import { ACTIVITY, POPULAR_QUESTIONS } from "@/lib/demo";

const KIND_ICON: Record<string, IconName> = {
  upload: "upload",
  index: "circleCheck",
  ask: "ask",
  update: "fileText",
};

export default function ActivityPage() {
  const feed = [
    ...ACTIVITY,
    ...POPULAR_QUESTIONS.slice(0, 3).map((q) => ({
      actor: "Somchai",
      action: "asked",
      target: q,
      when: "this week",
      kind: "ask" as const,
    })),
  ];

  return (
    <div className="min-h-full">
      <header className="flex items-center border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Activity</span>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-7">
        <h1 className="mb-1 text-[20px] font-semibold tracking-tight text-[#111827]">
          What changed recently
        </h1>
        <p className="mb-5 text-[14px] text-[#6b7280]">
          Uploads, indexing, edits, and questions across your workspace.
        </p>

        <div className="rounded-[12px] border border-[#ececec] bg-white p-6">
          <ul className="space-y-5">
            {feed.map((f, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f4f6] text-[#6b7280]">
                  <Icon name={KIND_ICON[f.kind]} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 border-b border-[#f4f4f6] pb-5 last:border-0 last:pb-0">
                  <div className="text-[14px] leading-snug text-[#111827]">
                    <span className="font-medium">{f.actor}</span>{" "}
                    <span className="text-[#6b7280]">{f.action}</span>{" "}
                    <span className="font-medium">
                      {f.kind === "ask" ? `"${f.target}"` : f.target}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#9ca3af]">{f.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
