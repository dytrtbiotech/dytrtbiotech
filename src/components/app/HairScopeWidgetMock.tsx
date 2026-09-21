/** Static demo mock of a future HairScope widget — intentionally simple. */
export default function HairScopeWidgetMock({
  mode = "scan",
}: {
  mode?: "scan" | "result";
}) {
  return (
    <div className="hs-mock" aria-hidden="true">
      <div className="hs-mock-chrome">
        <span className="hs-mock-chrome-title">HairScope</span>
        <span className="hs-mock-chrome-meta">
          {mode === "result" ? "Náhled výstupu" : "Náhled kamery"}
        </span>
      </div>

      <div className="hs-mock-body">
        <div className="hs-mock-viewport">
          <div className="hs-mock-frame" />
          <p className="hs-mock-hint">
            {mode === "result"
              ? "Ukázkový výstup analýzy"
              : "Prostor pro kamerový náhled"}
          </p>
        </div>

        <aside className="hs-mock-panel">
          <p className="hs-mock-panel-kicker">Orientační přehled</p>
          <ul className="hs-mock-metrics">
            <li>
              <span>Hustota</span>
              <strong>{mode === "result" ? "Střední" : "—"}</strong>
            </li>
            <li>
              <span>Rozložení</span>
              <strong>{mode === "result" ? "Rovnoměrné" : "—"}</strong>
            </li>
            <li>
              <span>Stav</span>
              <strong>{mode === "result" ? "Dokončeno" : "Čeká na snímek"}</strong>
            </li>
          </ul>
          <p className="hs-mock-note">
            Zjednodušený mock · ostrý widget přijde později
          </p>
        </aside>
      </div>
    </div>
  );
}
