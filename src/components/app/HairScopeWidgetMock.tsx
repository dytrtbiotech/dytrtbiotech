/** Static demo mock of a future HairScope camera widget. */
export default function HairScopeWidgetMock({
  mode = "scan",
}: {
  mode?: "scan" | "result";
}) {
  return (
    <div className="hs-mock" aria-hidden="true">
      <div className="hs-mock-chrome">
        <span className="hs-mock-dot" />
        <span className="hs-mock-dot" />
        <span className="hs-mock-dot" />
        <span className="hs-mock-chrome-title">HairScope</span>
        <span className="hs-mock-live">
          <span className="hs-mock-live-pip" />
          {mode === "result" ? "Hotovo" : "Náhled kamery"}
        </span>
      </div>

      <div className="hs-mock-body">
        <div className="hs-mock-viewport">
          <div className="hs-mock-viewport-glow" />
          <div className="hs-mock-silhouette" />
          <div className="hs-mock-frame">
            <span className="hs-mock-corner hs-mock-corner--tl" />
            <span className="hs-mock-corner hs-mock-corner--tr" />
            <span className="hs-mock-corner hs-mock-corner--bl" />
            <span className="hs-mock-corner hs-mock-corner--br" />
          </div>
          <div className="hs-mock-scanline" />
          <div className="hs-mock-points">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="hs-mock-hint">
            {mode === "result"
              ? "Ukázkový výstup analýzy"
              : "Zarovnejte temeno do rámečku"}
          </p>
        </div>

        <aside className="hs-mock-panel">
          <p className="hs-mock-panel-kicker">Orientační metriky</p>
          <ul className="hs-mock-metrics">
            <li>
              <span>Hustota vlasů</span>
              <div className="hs-mock-bar">
                <i style={{ width: mode === "result" ? "68%" : "42%" }} />
              </div>
            </li>
            <li>
              <span>Průměr pramene</span>
              <div className="hs-mock-bar">
                <i style={{ width: mode === "result" ? "54%" : "28%" }} />
              </div>
            </li>
            <li>
              <span>Pokrytí pokožky</span>
              <div className="hs-mock-bar">
                <i style={{ width: mode === "result" ? "61%" : "35%" }} />
              </div>
            </li>
          </ul>
          <div className="hs-mock-steps">
            <span className={mode === "scan" ? "is-active" : "is-done"}>1</span>
            <span className={mode === "result" ? "is-active" : ""}>2</span>
            <span>3</span>
          </div>
          <p className="hs-mock-note">
            {mode === "result"
              ? "Demo náhled · bez medicínského hodnocení"
              : "Mock widget · ostrá kamera přijde později"}
          </p>
        </aside>
      </div>
    </div>
  );
}
