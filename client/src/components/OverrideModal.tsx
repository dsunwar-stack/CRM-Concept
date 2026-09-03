import { useState } from "react";
import { api } from "../api";
import type { ComponentType, FieldOverride, SchemaField } from "../types";
import { COMPONENT_LABELS, COMPONENT_OPTIONS } from "../componentMeta";

const HEURISTICS = [
  "Visibility of system status",
  "Match between system and the real world",
  "User control and freedom",
  "Consistency and standards",
  "Error prevention",
  "Recognition rather than recall",
  "Flexibility and efficiency of use",
  "Aesthetic and minimalist design",
  "Help users recognize, diagnose, and recover from errors",
  "Help and documentation",
];

export default function OverrideModal({
  field,
  onClose,
  onSaved,
}: {
  field: SchemaField;
  onClose: () => void;
  onSaved: (override: FieldOverride) => void;
}) {
  const currentComponent = field.activeOverride?.component ?? field.defaultComponent;
  const [component, setComponent] = useState<ComponentType>(currentComponent);
  const [heuristic, setHeuristic] = useState("");
  const [researchReference, setResearchReference] = useState("");
  const [productJustification, setProductJustification] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ override: FieldOverride }>(`/fields/${field.id}`, {
        component,
        heuristic,
        researchReference,
        productJustification,
      });
      onSaved(res.override);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save override.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Override component for “{field.fieldName}”
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          The rules-engine default (
          <span className="font-medium text-slate-700">{COMPONENT_LABELS[field.defaultComponent]}</span>
          ) is strong and not editable by standard users. Every override needs a cited heuristic,
          research evidence, and a written product justification before it can save — that's what
          keeps this a documented decision, not a silent one-off.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Replacement component
            </label>
            <select
              value={component}
              onChange={(e) => setComponent(e.target.value as ComponentType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {COMPONENT_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {COMPONENT_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nielsen usability heuristic that justifies the change
            </label>
            <select
              required
              value={heuristic}
              onChange={(e) => setHeuristic(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select a heuristic…</option>
              {HEURISTICS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              User research reference
            </label>
            <textarea
              required
              rows={2}
              value={researchReference}
              onChange={(e) => setResearchReference(e.target.value)}
              placeholder="e.g. usability test finding, or a link to a recurring support-ticket pattern"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product need justification
            </label>
            <textarea
              required
              rows={2}
              value={productJustification}
              onChange={(e) => setProductJustification(e.target.value)}
              placeholder="Why this specific field, in this specific context, needs to break the default"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
