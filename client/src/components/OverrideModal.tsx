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
    <>
      <section
        className="slds-modal slds-fade-in-open slds-modal_medium"
        role="dialog"
        aria-modal="true"
        aria-labelledby="override-modal-title"
      >
        <div className="slds-modal__container">
          <form onSubmit={submit}>
            <header className="slds-modal__header">
              <h2 id="override-modal-title" className="slds-modal__title slds-hyphenate">
                Override component for &ldquo;{field.fieldName}&rdquo;
              </h2>
              <button
                type="button"
                className="slds-button slds-button_icon slds-modal__close"
                onClick={onClose}
                title="Close"
              >
                ✕
              </button>
            </header>

            <div className="slds-modal__content slds-p-around_medium">
              <p className="slds-text-body_small slds-text-color_weak slds-m-bottom_medium">
                The rules-engine default (
                <span className="slds-text-color_default" style={{ fontWeight: 600 }}>
                  {COMPONENT_LABELS[field.defaultComponent]}
                </span>
                ) is strong and not editable by standard users. Every override needs a cited
                heuristic, research evidence, and a written product justification before it can
                save — that's what keeps this a documented decision, not a silent one-off.
              </p>

              <div className="slds-form-element slds-m-bottom_medium">
                <label className="slds-form-element__label" htmlFor="override-component">
                  Replacement component
                </label>
                <div className="slds-form-element__control">
                  <div className="slds-select_container">
                    <select
                      id="override-component"
                      value={component}
                      onChange={(e) => setComponent(e.target.value as ComponentType)}
                      className="slds-select"
                    >
                      {COMPONENT_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {COMPONENT_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="slds-form-element slds-m-bottom_medium">
                <label className="slds-form-element__label" htmlFor="override-heuristic">
                  <abbr className="slds-required" title="required">
                    *
                  </abbr>{" "}
                  Nielsen usability heuristic that justifies the change
                </label>
                <div className="slds-form-element__control">
                  <div className="slds-select_container">
                    <select
                      id="override-heuristic"
                      required
                      value={heuristic}
                      onChange={(e) => setHeuristic(e.target.value)}
                      className="slds-select"
                    >
                      <option value="">Select a heuristic…</option>
                      {HEURISTICS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="slds-form-element slds-m-bottom_medium">
                <label className="slds-form-element__label" htmlFor="override-research">
                  <abbr className="slds-required" title="required">
                    *
                  </abbr>{" "}
                  User research reference
                </label>
                <div className="slds-form-element__control">
                  <textarea
                    id="override-research"
                    required
                    rows={2}
                    value={researchReference}
                    onChange={(e) => setResearchReference(e.target.value)}
                    placeholder="e.g. usability test finding, or a link to a recurring support-ticket pattern"
                    className="slds-textarea"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="override-justification">
                  <abbr className="slds-required" title="required">
                    *
                  </abbr>{" "}
                  Product need justification
                </label>
                <div className="slds-form-element__control">
                  <textarea
                    id="override-justification"
                    required
                    rows={2}
                    value={productJustification}
                    onChange={(e) => setProductJustification(e.target.value)}
                    placeholder="Why this specific field, in this specific context, needs to break the default"
                    className="slds-textarea"
                  />
                </div>
              </div>

              {error && <p className="slds-text-color_error slds-text-body_small slds-m-top_small">{error}</p>}
            </div>

            <footer className="slds-modal__footer">
              <button type="button" className="slds-button slds-button_neutral" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="slds-button slds-button_brand">
                {submitting ? "Saving…" : "Save override"}
              </button>
            </footer>
          </form>
        </div>
      </section>
      <div className="slds-backdrop slds-backdrop_open" />
    </>
  );
}
