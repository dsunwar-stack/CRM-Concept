import { useEffect, useState } from "react";
import { api } from "../api";
import type { AuditEntry } from "../types";

const ACTION_LABELS: Record<string, string> = {
  "schema.created": "Schema created",
  "field.override": "Field override applied",
  "field.override_reverted": "Field override reverted",
};

export default function AuditLogPage() {
  const [log, setLog] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    api.get<{ log: AuditEntry[] }>("/audit-log").then((res) => setLog(res.log));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every schema creation and every expert override, with who made it, when, and why —
          nothing here is a silent, unexplained change.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {log === null && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {log?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nothing logged yet.
                </td>
              </tr>
            )}
            {log?.map((entry) => (
              <tr key={entry.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{entry.actorName}</td>
                <td className="px-4 py-3 text-slate-700">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {JSON.stringify(entry.details, null, 0)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
