import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Schema } from "../types";
import SchemaUploadPanel from "../components/SchemaUploadPanel";

export default function DashboardPage() {
  const [schemas, setSchemas] = useState<Schema[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api
      .get<{ schemas: Schema[] }>("/schemas")
      .then((res) => setSchemas(res.schemas))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load schemas."));
  }

  useEffect(reload, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Schemas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every screen below was generated from a schema by the rules engine — no squad hand-built
          any of these forms.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Fields</th>
              <th className="px-4 py-3">Journey</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schemas === null && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {schemas?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No schemas yet — upload one below.
                </td>
              </tr>
            )}
            {schemas?.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 uppercase text-slate-500">{s.sourceType}</td>
                <td className="px-4 py-3 text-slate-600">{s.fieldCount}</td>
                <td className="px-4 py-3">
                  {s.hasJourney ? (
                    <Link
                      to={`/triage?schemaId=${s.id}`}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      ✓ derived
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">none</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/schemas/${s.id}`} className="text-indigo-600 hover:underline">
                    Open form →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SchemaUploadPanel onCreated={reload} />
    </div>
  );
}
