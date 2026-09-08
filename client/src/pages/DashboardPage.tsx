import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Schema } from "../types";
import SchemaUploadPanel from "../components/SchemaUploadPanel";

export default function DashboardPage() {
  const [schemas, setSchemas] = useState<Schema[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api
      .get<{ schemas: Schema[] }>("/schemas")
      .then((res) => setSchemas(res.schemas))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load schemas."));
  }

  useEffect(reload, []);

  return (
    <div className="slds-grid slds-grid_vertical slds-gutters_direct-y">
      <div className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__body">
                <div className="slds-page-header__name">
                  <div className="slds-page-header__name-title">
                    <h1>
                      <span className="slds-page-header__title slds-truncate">Schemas</span>
                    </h1>
                  </div>
                </div>
                <p className="slds-page-header__name-meta">
                  Every screen below was generated from a schema by the rules engine — no squad
                  hand-built any of these forms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="slds-text-color_error slds-text-body_small">{error}</p>}

      <article className="slds-card">
        <div className="slds-card__body slds-card__body_inner">
          <div style={{ overflowX: "auto" }}>
            <table className="slds-table slds-table_bordered slds-table_cell-buffer">
              <thead>
                <tr className="slds-line-height_reset">
                  <th scope="col">Name</th>
                  <th scope="col">Source</th>
                  <th scope="col">Fields</th>
                  <th scope="col">Journey</th>
                  <th scope="col">Created</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {schemas === null && (
                  <tr>
                    <td colSpan={6} className="slds-text-align_center slds-text-color_weak">
                      Loading…
                    </td>
                  </tr>
                )}
                {schemas?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="slds-text-align_center slds-text-color_weak">
                      No schemas yet — upload one below.
                    </td>
                  </tr>
                )}
                {schemas?.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="slds-text-body_regular slds-text-color_default" style={{ fontWeight: 600 }}>
                        {s.name}
                      </span>
                    </td>
                    <td className="slds-text-title_caps">{s.sourceType}</td>
                    <td>{s.fieldCount}</td>
                    <td>
                      {s.hasJourney ? (
                        <Link to={`/triage?schemaId=${s.id}`}>
                          <span className="slds-badge slds-theme_success">✓ derived</span>
                        </Link>
                      ) : (
                        <span className="slds-badge">none</span>
                      )}
                    </td>
                    <td className="slds-text-color_weak">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="slds-text-align_right">
                      <Link to={`/schemas/${s.id}`}>Open form →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <SchemaUploadPanel onCreated={reload} />
    </div>
  );
}
