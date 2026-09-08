import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { FieldOverride, Schema, SchemaField } from "../types";
import DynamicField from "../components/DynamicField";
import OverrideModal from "../components/OverrideModal";

export default function FormPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<SchemaField | null>(null);

  function load() {
    if (!id) return;
    api
      .get<{ schema: Schema; fields: SchemaField[] }>(`/schemas/${id}`)
      .then((res) => {
        setSchema(res.schema);
        setFields(res.fields);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load schema."));
  }

  useEffect(load, [id]);

  async function revertOverride(field: SchemaField) {
    await api.delete(`/fields/${field.id}`);
    load();
  }

  function handleOverrideSaved(override: FieldOverride) {
    setFields((prev) => prev.map((f) => (f.id === override.fieldId ? { ...f, activeOverride: override } : f)));
    setOverrideTarget(null);
  }

  if (error) return <p className="slds-text-color_error slds-text-body_small">{error}</p>;
  if (!schema) return <p className="slds-text-color_weak slds-text-body_small">Loading…</p>;

  return (
    <div className="slds-grid slds-grid_vertical slds-gutters_direct-y">
      <div>
        <Link to="/" className="slds-text-body_small">
          ← All schemas
        </Link>
        <div className="slds-page-header slds-m-top_x-small">
          <div className="slds-page-header__row">
            <div className="slds-page-header__col-title">
              <div className="slds-media">
                <div className="slds-media__body">
                  <div className="slds-page-header__name">
                    <div className="slds-page-header__name-title">
                      <h1>
                        <span className="slds-page-header__title slds-truncate">{schema.name}</span>
                      </h1>
                    </div>
                  </div>
                  <p className="slds-page-header__name-meta">
                    Generated automatically from a {schema.sourceType.toUpperCase()} schema. Every
                    component below was chosen by the rules engine — hover the "customised" badge on
                    an overridden field to see the documented rationale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {schema.journeySourceField ? (
          <p className="slds-text-body_small slds-m-top_x-small">
            <Link to={`/triage?schemaId=${schema.id}`}>View this schema's journey on the triage map →</Link>{" "}
            <span className="slds-text-body_small slds-text-color_weak">
              (derived from the "{schema.journeySourceField}" field)
            </span>
          </p>
        ) : (
          <p className="slds-text-body_small slds-text-color_weak slds-m-top_x-small">
            No triage journey for this schema — add a select field with 2–8 options (e.g. named
            "Status") and recreate it to get one automatically.
          </p>
        )}
      </div>

      <article className="slds-card">
        <div className="slds-card__body slds-card__body_inner">
          <div className="slds-grid slds-gutters slds-wrap">
            {fields.map((field) => (
              <div key={field.id} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-p-bottom_small">
                <DynamicField
                  field={field}
                  onOverrideClick={setOverrideTarget}
                  onRevertOverride={revertOverride}
                />
              </div>
            ))}
          </div>
        </div>
      </article>

      <details className="slds-card slds-p-around_medium">
        <summary className="slds-text-heading_small" style={{ cursor: "pointer" }}>
          Rules-engine reasoning for this schema
        </summary>
        <ul className="slds-list_vertical-space slds-m-top_small">
          {fields.map((f) => (
            <li key={f.id} className="slds-text-body_small slds-text-color_weak">
              <span className="slds-text-color_default" style={{ fontWeight: 600 }}>
                {f.fieldName}:
              </span>{" "}
              {f.activeOverride ? (
                <>
                  overridden to {f.activeOverride.component} — {f.activeOverride.heuristic}
                </>
              ) : (
                f.defaultRationale
              )}
            </li>
          ))}
        </ul>
      </details>

      {overrideTarget && (
        <OverrideModal
          field={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSaved={handleOverrideSaved}
        />
      )}
    </div>
  );
}
