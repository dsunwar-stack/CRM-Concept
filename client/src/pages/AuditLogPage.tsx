import { useEffect, useState } from "react";
import { api } from "../api";
import type { AuditEntry } from "../types";

const ACTION_LABELS: Record<string, string> = {
  "schema.created": "Schema created",
  "field.override": "Field override applied",
  "field.override_reverted": "Field override reverted",
};

export default function AuditLogPage() {
  const [log, setLog] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    api.get<{ log: AuditEntry[] }>("/audit-log").then((res) => setLog(res.log));
  }, []);

  return (
    <div className="slds-grid slds-grid_vertical slds-gutters_direct-y">
      <div>
        <h1 className="slds-text-heading_medium">Audit log</h1>
        <p className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small">
          Every schema creation and every expert override, with who made it, when, and why —
          nothing here is a silent, unexplained change.
        </p>
      </div>

      <article className="slds-card">
        <div className="slds-card__body slds-card__body_inner">
          <div style={{ overflowX: "auto" }}>
            <table className="slds-table slds-table_bordered slds-table_cell-buffer">
              <thead>
                <tr className="slds-line-height_reset">
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">Action</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {log === null && (
                  <tr>
                    <td colSpan={4} className="slds-text-align_center slds-text-color_weak">
                      Loading…
                    </td>
                  </tr>
                )}
                {log?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="slds-text-align_center slds-text-color_weak">
                      Nothing logged yet.
                    </td>
                  </tr>
                )}
                {log?.map((entry) => (
                  <tr key={entry.id}>
                    <td className="slds-text-color_weak slds-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{entry.actorName}</td>
                    <td>{ACTION_LABELS[entry.action] ?? entry.action}</td>
                    <td className="slds-text-color_weak">
                      <pre className="slds-text-body_small" style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0 }}>
                        {JSON.stringify(entry.details, null, 0)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
}
