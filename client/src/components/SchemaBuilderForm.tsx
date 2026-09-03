import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Schema } from "../types";
import { COMPONENT_LABELS } from "../componentMeta";
import { previewComponent } from "../lib/previewRules";

type FieldType = "select" | "text" | "longtext" | "date" | "boolean" | "number";

const TYPE_LABELS: Record<FieldType, string> = {
  select: "Select (options list)",
  text: "Short text",
  longtext: "Long text",
  date: "Date",
  boolean: "Yes / No",
  number: "Number",
};

interface BuilderField {
  key: string;
  fieldName: string;
  type: FieldType;
  optionsListText: string;
  required: boolean;
  min: string;
  max: string;
  expectLongText: boolean;
}

function newField(): BuilderField {
  return {
    key: crypto.randomUUID(),
    fieldName: "",
    type: "select",
    optionsListText: "",
    required: true,
    min: "",
    max: "",
    expectLongText: false,
  };
}

export default function SchemaBuilderForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<BuilderField[]>([newField()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const booleanCount = fields.filter((f) => f.type === "boolean").length;

  function updateField(key: string, patch: Partial<BuilderField>) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  function addField() {
    setFields((prev) => [...prev, newField()]);
  }

  function removeField(key: string) {
    setFields((prev) => (prev.length > 1 ? prev.filter((f) => f.key !== key) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Give the schema a name.");
    const namedFields = fields.filter((f) => f.fieldName.trim());
    if (namedFields.length === 0) return setError("Add at least one field with a name.");

    const payloadFields = namedFields.map((f) => {
      const optionsList =
        f.type === "select"
          ? f.optionsListText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      return {
        fieldName: f.fieldName.trim(),
        type: f.type,
        optionsCount: optionsList.length,
        optionsList,
        required: f.required,
        min: f.type === "number" && f.min !== "" ? Number(f.min) : undefined,
        max: f.type === "number" && f.max !== "" ? Number(f.max) : undefined,
        expectedLength: f.type === "text" && f.expectLongText ? 150 : undefined,
      };
    });

    setSubmitting(true);
    try {
      const res = await api.post<{ schema: Schema }>("/schemas/json", { name, fields: payloadFields });
      onCreated();
      navigate(`/schemas/${res.schema.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the schema.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Schema name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Customer Onboarding Case"
        />
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const optionsList = field.optionsListText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const component = previewComponent(
            {
              type: field.type,
              optionsCount: optionsList.length,
              min: field.min,
              max: field.max,
              expectedLength: field.expectLongText ? "150" : "",
            },
            booleanCount
          );

          return (
            <div key={field.key} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2 text-xs text-slate-400">{index + 1}.</span>
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[2fr_1.2fr_auto]">
                  <input
                    type="text"
                    value={field.fieldName}
                    onChange={(e) => updateField(field.key, { fieldName: e.target.value })}
                    placeholder="Field name (e.g. Case Status)"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.key, { type: e.target.value as FieldType })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 whitespace-nowrap px-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.key, { required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeField(field.key)}
                  disabled={fields.length === 1}
                  className="mt-1 shrink-0 text-xs text-slate-400 hover:text-red-600 disabled:opacity-30"
                  title="Remove field"
                >
                  ✕
                </button>
              </div>

              {field.type === "select" && (
                <div className="ml-5 mt-2">
                  <input
                    type="text"
                    value={field.optionsListText}
                    onChange={(e) => updateField(field.key, { optionsListText: e.target.value })}
                    placeholder="Comma-separated options, e.g. Open, In Review, Escalated, Closed"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {field.type === "number" && (
                <div className="ml-5 mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={field.min}
                    onChange={(e) => updateField(field.key, { min: e.target.value })}
                    placeholder="Min (optional)"
                    className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={field.max}
                    onChange={(e) => updateField(field.key, { max: e.target.value })}
                    placeholder="Max (optional)"
                    className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <span className="text-xs text-slate-400">
                    small known range → stepper/slider; otherwise plain text input
                  </span>
                </div>
              )}

              {field.type === "text" && (
                <label className="ml-5 mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={field.expectLongText}
                    onChange={(e) => updateField(field.key, { expectLongText: e.target.checked })}
                  />
                  Expect long input (over ~100 characters)
                </label>
              )}

              <div className="ml-5 mt-2 text-xs text-slate-400">
                Rules-engine preview: <span className="font-medium text-slate-600">{COMPONENT_LABELS[component]}</span>
                {field.type === "select" && optionsList.length > 0 && ` (${optionsList.length} options)`}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addField}
        className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
      >
        + Add field
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Generating…" : "Create form"}
        </button>
      </div>
    </form>
  );
}
