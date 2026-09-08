import { useState } from "react";
import type { SchemaField } from "../types";
import { COMPONENT_LABELS } from "../componentMeta";
import { useAuth } from "../context/AuthContext";

interface Props {
  field: SchemaField;
  onOverrideClick: (field: SchemaField) => void;
  onRevertOverride: (field: SchemaField) => void;
}

export default function DynamicField({ field, onOverrideClick, onRevertOverride }: Props) {
  const { user } = useAuth();
  const [value, setValue] = useState<string | boolean>(field.type === "boolean" ? false : "");
  const component = field.activeOverride?.component ?? field.defaultComponent;
  const isOverridden = Boolean(field.activeOverride);

  return (
    <div className="slds-box slds-box_x-small">
      <div className="slds-grid slds-grid_align-spread slds-m-bottom_x-small">
        <div>
          <label className="slds-form-element__label" style={{ fontWeight: 600 }}>
            {field.fieldName}
            {field.required && (
              <abbr className="slds-required" title="required">
                {" "}
                *
              </abbr>
            )}
          </label>
          <div className="slds-grid slds-wrap slds-gutters_xx-small slds-m-top_xx-small">
            <span className="slds-text-body_small slds-text-color_weak">{COMPONENT_LABELS[component]}</span>
            {isOverridden && (
              <span
                title={`Overridden from ${COMPONENT_LABELS[field.activeOverride!.previousComponent]} by ${field.activeOverride!.createdByName}: ${field.activeOverride!.heuristic}`}
                className="slds-badge slds-theme_warning slds-m-left_x-small"
                style={{ textTransform: "none" }}
              >
                customised — see rationale
              </span>
            )}
          </div>
        </div>
        {user?.role === "expert" && (
          <div className="slds-grid slds-gutters_x-small slds-no-flex">
            <button
              onClick={() => onOverrideClick(field)}
              className="slds-button slds-button_reset slds-text-link"
              type="button"
            >
              Override
            </button>
            {isOverridden && (
              <button
                onClick={() => onRevertOverride(field)}
                className="slds-button slds-button_reset slds-text-link slds-m-left_small"
                type="button"
              >
                Revert
              </button>
            )}
          </div>
        )}
      </div>

      <FieldInput field={field} component={component} value={value} onChange={setValue} />

      {isOverridden && (
        <div className="slds-box slds-theme_warning slds-box_x-small slds-m-top_small">
          <p className="slds-text-body_small">
            <span style={{ fontWeight: 600 }}>Heuristic:</span> {field.activeOverride!.heuristic}
          </p>
          <p className="slds-text-body_small slds-m-top_xx-small">
            <span style={{ fontWeight: 600 }}>Research reference:</span>{" "}
            {field.activeOverride!.researchReference}
          </p>
          <p className="slds-text-body_small slds-m-top_xx-small">
            <span style={{ fontWeight: 600 }}>Product justification:</span>{" "}
            {field.activeOverride!.productJustification}
          </p>
          <p className="slds-text-body_small slds-m-top_xx-small">
            — {field.activeOverride!.createdByName}, {new Date(field.activeOverride!.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  component,
  value,
  onChange,
}: {
  field: SchemaField;
  component: string;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
}) {
  const options = field.optionsList?.length
    ? field.optionsList
    : Array.from({ length: field.optionsCount || 0 }, (_, i) => `Option ${i + 1}`);

  switch (component) {
    case "toggle":
      return (
        <label className="slds-checkbox_toggle slds-grid">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="slds-checkbox_faux_container" aria-live="assertive">
            <span className="slds-checkbox_faux" />
            <span className="slds-checkbox_on">Yes</span>
            <span className="slds-checkbox_off">No</span>
          </span>
        </label>
      );
    case "radio":
      return (
        <fieldset>
          <div className="slds-grid slds-wrap slds-gutters_small">
            {options.map((opt) => (
              <div className="slds-col slds-no-flex" key={opt}>
                <span className="slds-radio">
                  <input
                    type="radio"
                    id={`${field.id}-${opt}`}
                    name={field.id}
                    checked={value === opt}
                    onChange={() => onChange(opt)}
                  />
                  <label className="slds-radio__label" htmlFor={`${field.id}-${opt}`}>
                    <span className="slds-radio_faux" />
                    <span className="slds-form-element__label">{opt}</span>
                  </label>
                </span>
              </div>
            ))}
          </div>
        </fieldset>
      );
    case "dropdown":
      return (
        <div className="slds-form-element__control">
          <div className="slds-select_container">
            <select className="slds-select" value={value as string} onChange={(e) => onChange(e.target.value)}>
              <option value="">Select…</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    case "typeahead": {
      const listId = `${field.id}-options`;
      return (
        <div className="slds-form-element__control">
          <input
            list={listId}
            className="slds-input"
            placeholder={`Search ${options.length} options…`}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
          <datalist id={listId}>
            {options.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>
      );
    }
    case "date_picker":
      return (
        <div className="slds-form-element__control">
          <input
            type="date"
            className="slds-input"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "checkbox":
      return (
        <span className="slds-checkbox">
          <input
            type="checkbox"
            id={`${field.id}-checkbox`}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <label className="slds-checkbox__label" htmlFor={`${field.id}-checkbox`}>
            <span className="slds-checkbox_faux" />
            <span className="slds-form-element__label">Yes</span>
          </label>
        </span>
      );
    case "textarea":
      return (
        <div className="slds-form-element__control">
          <textarea
            rows={3}
            className="slds-textarea"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "stepper":
      return (
        <div className="slds-form-element__control">
          <input
            type="number"
            className="slds-input"
            min={field.optionsList?.[0]}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "slider":
      return (
        <div className="slds-form-element__control">
          <input
            type="range"
            className="slds-slider__range"
            value={(value as string) || "0"}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "text_input":
    default:
      return (
        <div className="slds-form-element__control">
          <input
            type="text"
            className="slds-input"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}
