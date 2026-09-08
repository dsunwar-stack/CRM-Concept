export default function DataPolicyPage() {
  return (
    <div className="slds-grid slds-grid_vertical slds-gutters_direct-y" style={{ maxWidth: 720 }}>
      <div>
        <h1 className="slds-text-heading_medium">Data handling &amp; security posture</h1>
        <p className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small">
          Compliant by design now, certifiable later — once real enterprise demand justifies the
          cost and time of formal certification.
        </p>
      </div>

      <article className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">Built in from day one</h2>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner">
          <ul className="slds-list_dotted">
            <li className="slds-text-body_small slds-text-color_weak slds-p-vertical_xx-small">
              <span className="slds-text-color_default" style={{ fontWeight: 600 }}>
                Data-light architecture.
              </span>{" "}
              No real customer or case data ever passes through Caseflow. It stores form
              structures and schemas — field names, types, option lists, and override rationale —
              not the records later entered into the forms it generates. The triage map in this
              prototype runs on clearly labelled synthetic/demo stage stats for the same reason.
            </li>
            <li className="slds-text-body_small slds-text-color_weak slds-p-vertical_xx-small">
              <span className="slds-text-color_default" style={{ fontWeight: 600 }}>
                UK/EU-based hosting
              </span>{" "}
              with a clear, published data processing and retention policy from the start.
            </li>
            <li className="slds-text-body_small slds-text-color_weak slds-p-vertical_xx-small">
              <span className="slds-text-color_default" style={{ fontWeight: 600 }}>
                Standard access control.
              </span>{" "}
              Secure login, encrypted storage, and an audit log of who created or changed a
              schema, and when — see the Audit Log page.
            </li>
          </ul>
        </div>
      </article>

      <article className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">Addressed once real enterprise demand appears</h2>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner">
          <ul className="slds-list_dotted">
            <li className="slds-text-body_small slds-text-color_weak slds-p-vertical_xx-small">
              SOC 2 or ISO 27001 certification — the standard trust benchmark procurement teams
              ask for, not needed for early individual or small-team customers.
            </li>
            <li className="slds-text-body_small slds-text-color_weak slds-p-vertical_xx-small">
              Formal vendor security questionnaires — the real gate for larger FS buyers, worth
              the time investment once a real enterprise deal is on the table.
            </li>
            <li className="slds-text-body_small slds-text-color_weak slds-p-vertical_xx-small">
              Single sign-on and other enterprise procurement features are not in v1.
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}
