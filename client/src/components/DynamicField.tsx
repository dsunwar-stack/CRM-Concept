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
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-slate-800">
            {field.fieldName}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{COMPONENT_LABELS[component]}</span>
            {isOverridden && (
              <span
                title={`Overridden from ${COMPONENT_LABELS[field.activeOverride!.previousComponent]} by ${field.activeOverride!.createdByName}: ${field.activeOverride!.heuristic}`}
                className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700"
              >
                customised — see rationale
              </span>
            )}
          </div>
        </div>
        {user?.role === "expert" && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => onOverrideClick(field)}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Override
            </button>
            {isOverridden && (
              <button
                onClick={() => onRevertOverride(field)}
                className="text-xs font-medium text-slate-500 hover:underline"
              >
                Revert
              </button>
            )}
          </div>
        )}
      </div>

      <FieldInput field={field} component={component} value={value} onChange={setValue} />

      {isOverridden && (
        <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
          <p>
            <span className="font-semibold">Heuristic:</span> {field.activeOverride!.heuristic}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Research reference:</span>{" "}
            {field.activeOverride!.researchReference}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Product justification:</span>{" "}
            {field.activeOverride!.productJustification}
          </p>
          <p className="mt-1 text-amber-600">
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
  const base = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const options = field.optionsList?.length
    ? field.optionsList
    : Array.from({ length: field.optionsCount || 0 }, (_, i) => `Option ${i + 1}`);

  switch (component) {
    case "toggle":
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      );
    case "radio":
      return (
        <div className="flex flex-wrap gap-4">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case "dropdown":
      return (
        <select className={base} value={value as string} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "typeahead": {
      const listId = `${field.id}-options`;
      return (
        <>
          <input
            list={listId}
            className={base}
            placeholder={`Search ${options.length} options…`}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
          <datalist id={listId}>
            {options.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </>
      );
    }
    case "date_picker":
      return <input type="date" className={base} value={value as string} onChange={(e) => onChange(e.target.value)} />;
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          Yes
        </label>
      );
    case "textarea":
      return <textarea rows={3} className={base} value={value as string} onChange={(e) => onChange(e.target.value)} />;
    case "stepper":
      return (
        <input
          type="number"
          className={base}
          min={field.optionsList?.[0]}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "slider":
      return <input type="range" className="w-full" value={(value as string) || "0"} onChange={(e) => onChange(e.target.value)} />;
    case "text_input":
    default:
      return <input type="text" className={base} value={value as string} onChange={(e) => onChange(e.target.value)} />;
  }
}
