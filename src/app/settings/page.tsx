import { WORKSPACE } from "@/lib/demo";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f4f4f6] py-3.5 last:border-0">
      <span className="text-[13px] text-[#6b7280]">{label}</span>
      <span className="text-[13px] font-medium text-[#111827]">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-full">
      <header className="flex items-center border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Settings</span>
      </header>

      <div className="mx-auto max-w-2xl px-8 py-6">
        <div className="space-y-6">
          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Workspace</h2>
            <div className="mt-2">
              <Row label="Name" value={WORKSPACE.name} />
              <Row label="Plan" value={WORKSPACE.plan} />
              <Row label="Members" value="24" />
              <Row label="Region" value="Asia Pacific (Singapore)" />
            </div>
          </section>

          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Answering</h2>
            <div className="mt-2">
              <Row label="Answer model" value="Configurable (OpenRouter)" />
              <Row label="Require citations" value="On" />
              <Row label="Answer only from company documents" value="On" />
              <Row label="Decline when no source is found" value="On" />
            </div>
          </section>

          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Security</h2>
            <div className="mt-2">
              <Row label="Single sign-on (SSO)" value="Google Workspace" />
              <Row label="Access control" value="By collection" />
              <Row label="Audit log" value="Enabled" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
