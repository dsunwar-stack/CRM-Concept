import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { Schema, TriageStage } from "../types";

export default function TriageMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemas, setSchemas] = useState<Schema[] | null>(null);
  const [schemaId, setSchemaId] = useState<string | null>(searchParams.get("schemaId"));
  const [stages, setStages] = useState<TriageStage[] | null>(null);
  const [selected, setSelected] = useState<TriageStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ schemas: Schema[] }>("/schemas").then((res) => {
      setSchemas(res.schemas);
      if (!schemaId && res.schemas.length > 0) {
        const preferred = res.schemas.find((s) => s.hasJourney) ?? res.schemas[0];
        setSchemaId(preferred.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!schemaId) return;
    setSearchParams({ schemaId }, { replace: true });
    setStages(null);
    setSelected(null);
    api
      .get<{ stages: TriageStage[] }>(`/triage?schemaId=${schemaId}`)
      .then((res) => {
        setStages(res.stages);
        setSelected(res.stages.find((s) => s.isBottleneck) ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load triage map."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaId]);

  const currentSchema = schemas?.find((s) => s.id === schemaId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Case pathway</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Volume and wait time surfaced at every stage — derived from the schema's own
            status-like field, so every schema gets its own journey automatically. Click a stage
            to see why it's slow.
          </p>
        </div>
        {schemas && schemas.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Schema</label>
            <select
              value={schemaId ?? ""}
              onChange={(e) => setSchemaId(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {!s.hasJourney ? " (no journey)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentSchema?.journeySourceField && (
        <p className="text-xs text-slate-400">
          Journey derived from the "{currentSchema.journeySourceField}" field's options.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!stages && !error && <p className="text-sm text-slate-400">Loading…</p>}

      {stages && stages.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No journey was derived for "{currentSchema?.name}" — it has no select-type field with
          2–8 options (e.g. one named "Status" with values like Open/In Review/Closed). Add one
          and re-create the schema to get a journey here automatically.
        </div>
      )}

      {stages && stages.length > 0 && (
        <div className="flex flex-col gap-3 overflow-x-auto pb-2 md:flex-row md:items-stretch">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-stretch gap-3">
              <button
                onClick={() => setSelected(stage)}
                className={`w-44 shrink-0 rounded-xl border p-3 text-left transition-shadow hover:shadow-md ${
                  stage.isBottleneck
                    ? "border-red-300 bg-red-50"
                    : selected?.id === stage.id
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {stage.isBottleneck && (
                  <span className="mb-2 inline-block rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Bottleneck
                  </span>
                )}
                <p className="font-semibold text-slate-900">{stage.name}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{stage.caseCount}</p>
                <p className="text-xs text-slate-500">cases in stage</p>
                <p
                  className={`mt-2 text-sm font-medium ${
                    stage.isBottleneck ? "text-red-700" : "text-slate-600"
                  }`}
                >
                  wait: {stage.avgWaitDays > 0 ? `${stage.avgWaitDays} day${stage.avgWaitDays === 1 ? "" : "s"}` : "—"}
                </p>
              </button>
              {i < stages.length - 1 && (
                <div className="flex shrink-0 items-center text-slate-300">
                  <svg width="18" height="24" viewBox="0 0 28 24" fill="none">
                    <path d="M2 12h22M18 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {selected.caseCount} cases currently in this stage, average wait{" "}
            {selected.avgWaitDays > 0 ? `${selected.avgWaitDays} days` : "n/a (terminal stage)"}.
          </p>
          {selected.reasons.length > 0 ? (
            <>
              <h3 className="mt-4 text-sm font-semibold text-slate-700">Why cases are stuck here</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {selected.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No flagged issues at this stage.</p>
          )}
        </div>
      )}
    </div>
  );
}
