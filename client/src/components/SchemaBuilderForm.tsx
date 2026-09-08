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
    <form onSubmit={handleSubmit} className="slds-m-top_medium">
      <div className="slds-form-element slds-m-bottom_medium">
        <label className="slds-form-element__label" htmlFor="schema-name">
          Schema name
        </label>
        <div className="slds-form-element__control">
          <input
            id="schema-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="slds-input"
            placeholder="Customer Onboarding Case"
          />
        </div>
      </div>

      <div className="slds-grid slds-grid_vertical slds-gutters_direct-y">
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
            <div key={field.key} className="slds-box slds-box_x-small">
              <div className="slds-grid slds-gutters_x-small slds-grid_vertical-align-start">
                <span className="slds-col slds-no-flex slds-text-body_small slds-text-color_weak slds-p-top_xx-small">
                  {index + 1}.
                </span>
                <div className="slds-col slds-grid slds-wrap slds-gutters_x-small">
                  <div className="slds-col slds-size_1-of-1 slds-medium-size_5-of-12">
                    <input
                      type="text"
                      value={field.fieldName}
                      onChange={(e) => updateField(field.key, { fieldName: e.target.value })}
                      placeholder="Field name (e.g. Case Status)"
                      className="slds-input"
                    />
                  </div>
                  <div className="slds-col slds-size_1-of-1 slds-medium-size_4-of-12">
                    <div className="slds-select_container">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.key, { type: e.target.value as FieldType })}
                        className="slds-select"
                      >
                        {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
                          <option key={t} value={t}>
                            {TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="slds-col slds-size_1-of-1 slds-medium-size_3-of-12 slds-p-top_x-small">
                    <span className="slds-checkbox">
                      <input
                        type="checkbox"
                        id={`required-${field.key}`}
                        checked={field.required}
                        onChange={(e) => updateField(field.key, { required: e.target.checked })}
                      />
                      <label className="slds-checkbox__label" htmlFor={`required-${field.key}`}>
                        <span className="slds-checkbox_faux" />
                        <span className="slds-form-element__label">Required</span>
                      </label>
                    </span>
                  </div>
                </div>
                <div className="slds-col slds-no-flex">
                  <button
                    type="button"
                    onClick={() => removeField(field.key)}
                    disabled={fields.length === 1}
                    className="slds-button slds-button_icon slds-button_icon-border-filled"
                    title="Remove field"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {field.type === "select" && (
                <div className="slds-m-top_x-small" style={{ marginLeft: 24 }}>
                  <input
                    type="text"
                    value={field.optionsListText}
                    onChange={(e) => updateField(field.key, { optionsListText: e.target.value })}
                    placeholder="Comma-separated options, e.g. Open, In Review, Escalated, Closed"
                    className="slds-input"
                  />
                </div>
              )}

              {field.type === "number" && (
                <div className="slds-grid slds-gutters_x-small slds-grid_vertical-align-center slds-m-top_x-small" style={{ marginLeft: 24 }}>
                  <div className="slds-col slds-no-flex" style={{ width: 120 }}>
                    <input
                      type="number"
                      value={field.min}
                      onChange={(e) => updateField(field.key, { min: e.target.value })}
                      placeholder="Min (optional)"
                      className="slds-input"
                    />
                  </div>
                  <div className="slds-col slds-no-flex" style={{ width: 120 }}>
                    <input
                      type="number"
                      value={field.max}
                      onChange={(e) => updateField(field.key, { max: e.target.value })}
                      placeholder="Max (optional)"
                      className="slds-input"
                    />
                  </div>
                  <span className="slds-col slds-text-body_small slds-text-color_weak">
                    small known range → stepper/slider; otherwise plain text input
                  </span>
                </div>
              )}

              {field.type === "text" && (
                <div className="slds-m-top_x-small" style={{ marginLeft: 24 }}>
                  <span className="slds-checkbox">
                    <input
                      type="checkbox"
                      id={`longtext-${field.key}`}
                      checked={field.expectLongText}
                      onChange={(e) => updateField(field.key, { expectLongText: e.target.checked })}
                    />
                    <label className="slds-checkbox__label" htmlFor={`longtext-${field.key}`}>
                      <span className="slds-checkbox_faux" />
                      <span className="slds-form-element__label">Expect long input (over ~100 characters)</span>
                    </label>
                  </span>
                </div>
              )}

              <div className="slds-text-body_small slds-text-color_weak slds-m-top_x-small" style={{ marginLeft: 24 }}>
                Rules-engine preview:{" "}
                <span className="slds-text-color_default" style={{ fontWeight: 600 }}>
                  {COMPONENT_LABELS[component]}
                </span>
                {field.type === "select" && optionsList.length > 0 && ` (${optionsList.length} options)`}
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={addField} className="slds-button slds-button_neutral slds-m-top_small">
        + Add field
      </button>

      {error && <p className="slds-text-color_error slds-text-body_small slds-m-top_small">{error}</p>}

      <div className="slds-m-top_medium">
        <button type="submit" disabled={submitting} className="slds-button slds-button_brand">
          {submitting ? "Generating…" : "Create form"}
        </button>
      </div>
    </form>
  );
}
