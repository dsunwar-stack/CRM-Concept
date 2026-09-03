export default function DataPolicyPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Data handling &amp; security posture</h1>
        <p className="mt-1 text-sm text-slate-500">
          Compliant by design now, certifiable later — once real enterprise demand justifies the
          cost and time of formal certification.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Built in from day one</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>
            <span className="font-medium text-slate-800">Data-light architecture.</span> No real
            customer or case data ever passes through Caseflow. It stores form structures and
            schemas — field names, types, option lists, and override rationale — not the records
            later entered into the forms it generates. The triage map in this prototype runs on
            clearly labelled synthetic/demo stage stats for the same reason.
          </li>
          <li>
            <span className="font-medium text-slate-800">UK/EU-based hosting</span> with a clear,
            published data processing and retention policy from the start.
          </li>
          <li>
            <span className="font-medium text-slate-800">Standard access control.</span> Secure
            login, encrypted storage, and an audit log of who created or changed a schema, and
            when — see the Audit Log page.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Addressed once real enterprise demand appears</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>
            SOC 2 or ISO 27001 certification — the standard trust benchmark procurement teams ask
            for, not needed for early individual or small-team customers.
          </li>
          <li>
            Formal vendor security questionnaires — the real gate for larger FS buyers, worth the
            time investment once a real enterprise deal is on the table.
          </li>
          <li>Single sign-on and other enterprise procurement features are not in v1.</li>
        </ul>
      </section>
    </div>
  );
}
