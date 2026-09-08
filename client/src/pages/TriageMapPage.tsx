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
    <div className="slds-grid slds-grid_vertical slds-gutters_direct-y">
      <div className="slds-grid slds-grid_align-spread slds-wrap slds-gutters_x-small">
        <div className="slds-col slds-grow">
          <h1 className="slds-text-heading_medium">Case pathway</h1>
          <p className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small" style={{ maxWidth: 640 }}>
            Volume and wait time surfaced at every stage — derived from the schema's own
            status-like field, so every schema gets its own journey automatically. Click a stage
            to see why it's slow.
          </p>
        </div>
        {schemas && schemas.length > 0 && (
          <div className="slds-col slds-no-flex">
            <div className="slds-form-element">
              <label className="slds-form-element__label" htmlFor="triage-schema">
                Schema
              </label>
              <div className="slds-form-element__control">
                <div className="slds-select_container">
                  <select
                    id="triage-schema"
                    className="slds-select"
                    value={schemaId ?? ""}
                    onChange={(e) => setSchemaId(e.target.value)}
                  >
                    {schemas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {!s.hasJourney ? " (no journey)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentSchema?.journeySourceField && (
        <p className="slds-text-body_small slds-text-color_weak">
          Journey derived from the "{currentSchema.journeySourceField}" field's options.
        </p>
      )}

      {error && <p className="slds-text-color_error slds-text-body_small">{error}</p>}
      {!stages && !error && <p className="slds-text-color_weak slds-text-body_small">Loading…</p>}

      {stages && stages.length === 0 && (
        <div className="slds-box slds-theme_shade slds-text-body_small slds-text-color_weak">
          No journey was derived for "{currentSchema?.name}" — it has no select-type field with
          2–8 options (e.g. one named "Status" with values like Open/In Review/Closed). Add one
          and re-create the schema to get a journey here automatically.
        </div>
      )}

      {stages && stages.length > 0 && (
        <div className="slds-grid slds-grid_vertical-align-stretch" style={{ overflowX: "auto", paddingBottom: 8 }}>
          {stages.map((stage, i) => (
            <div key={stage.id} className="slds-grid slds-grid_vertical-align-center slds-no-flex">
              <button
                type="button"
                onClick={() => setSelected(stage)}
                className={`slds-box slds-box_x-small slds-text-align_left ${
                  stage.isBottleneck
                    ? "slds-theme_error"
                    : selected?.id === stage.id
                    ? "slds-theme_shade"
                    : ""
                }`}
                style={{ width: 176, cursor: "pointer", border: 0 }}
              >
                {stage.isBottleneck && (
                  <span className="slds-badge slds-theme_alt-inverse slds-m-bottom_x-small">Bottleneck</span>
                )}
                <p className="slds-text-heading_small" style={{ fontWeight: 600 }}>
                  {stage.name}
                </p>
                <p className="slds-text-heading_large slds-m-top_x-small">{stage.caseCount}</p>
                <p className="slds-text-body_small" style={!stage.isBottleneck ? { opacity: 0.7 } : undefined}>
                  cases in stage
                </p>
                <p className="slds-text-body_small slds-m-top_x-small" style={{ fontWeight: 600 }}>
                  wait:{" "}
                  {stage.avgWaitDays > 0
                    ? `${stage.avgWaitDays} day${stage.avgWaitDays === 1 ? "" : "s"}`
                    : "—"}
                </p>
              </button>
              {i < stages.length - 1 && (
                <span className="slds-p-horizontal_x-small slds-text-color_weak" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <article className="slds-card">
          <div className="slds-card__header slds-grid">
            <header className="slds-media slds-media_center slds-has-flexi-truncate">
              <div className="slds-media__body">
                <h2 className="slds-card__header-title">{selected.name}</h2>
              </div>
            </header>
          </div>
          <div className="slds-card__body slds-card__body_inner">
            <p className="slds-text-body_small slds-text-color_weak">
              {selected.caseCount} cases currently in this stage, average wait{" "}
              {selected.avgWaitDays > 0 ? `${selected.avgWaitDays} days` : "n/a (terminal stage)"}.
            </p>
            {selected.reasons.length > 0 ? (
              <>
                <h3 className="slds-text-heading_small slds-m-top_medium">Why cases are stuck here</h3>
                <ul className="slds-list_dotted slds-m-top_x-small">
                  {selected.reasons.map((r) => (
                    <li key={r} className="slds-text-body_small slds-text-color_weak">
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="slds-text-body_small slds-text-color_weak slds-m-top_medium">
                No flagged issues at this stage.
              </p>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
