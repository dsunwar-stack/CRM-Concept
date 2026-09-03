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

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!schema) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          ← All schemas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{schema.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generated automatically from a {schema.sourceType.toUpperCase()} schema. Every component
          below was chosen by the rules engine — hover the “customised” badge on an overridden
          field to see the documented rationale.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
        {fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            onOverrideClick={setOverrideTarget}
            onRevertOverride={revertOverride}
          />
        ))}
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">
          Rules-engine reasoning for this schema
        </summary>
        <ul className="mt-3 space-y-2">
          {fields.map((f) => (
            <li key={f.id} className="text-slate-600">
              <span className="font-medium text-slate-800">{f.fieldName}:</span>{" "}
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
