import { useState } from "react";

/**
 * Help panel: very small keyword matcher
 * Keep responses helpful and short.
 */

const HELP_MAP = {
  run: "Click Run to execute your JavaScript. Output and errors appear in the Console below.",
  autofix: "Auto-Fix applies: trailing spaces trim, tab->2 spaces, collapse multiple spaces, add missing semicolons (heuristic), and basic bracket balancing.",
  semicolons: "Auto-Fix adds semicolons at line ends for expressions. It avoids adding after if/for/while/function declarations.",
  console: "Use console.log('hello') to print values. Worker captures console output and shows it in Console.",
  error: "If you see ReferenceError, ensure variable is declared (let/const/var). For SyntaxError, look for missing parentheses or braces.",
  timeout: "Long running or infinite loops may be terminated by the 2s sandbox timeout. Refactor heavy loops or add breaks."
};

export default function HelpPanel({ onClose, onAppend }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);

  function handleAsk() {
    const q = (query || "").toLowerCase();
    if (!q) return;
    // simple token match
    const tokens = q.split(/\W+/);
    const hits = new Set();
    tokens.forEach(t => {
      if (HELP_MAP[t]) hits.add(HELP_MAP[t]);
    });

    const response = hits.size > 0 ? Array.from(hits).join("\n\n") : "Sorry, I couldn't find a match. Try keywords: run, autofix, semicolons, console, error.";
    setHistory(h => [{ q: query, r: response }, ...h].slice(0, 6));
    setQuery("");
    onAppend && onAppend(query, response);
  }

  return (
    <div className="help-panel" role="dialog" aria-label="Help panel">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <div style={{fontWeight:700}}>Help</div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>

      <div style={{marginBottom:8}}>
        <input
          placeholder="Ask for help (try: run, autofix, semicolons, error)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{width:"100%", padding:8, borderRadius:6, border:"1px solid rgba(255,255,255,0.04)", background:"transparent", color:"inherit"}} />
        <div style={{display:"flex", justifyContent:"flex-end", marginTop:8}}>
          <button className="btn" onClick={handleAsk}>Ask</button>
        </div>
      </div>

      <div style={{maxHeight:220, overflow:"auto"}}>
        <div className="small" style={{marginBottom:6}}>Recent answers</div>
        {history.length === 0 && <div className="small">No queries yet.</div>}
        {history.map((h,i) => (
          <div key={i} style={{borderTop:"1px dashed rgba(255,255,255,0.03)", paddingTop:8, marginTop:8}}>
            <div style={{fontSize:13}}><strong>Q:</strong> {h.q}</div>
            <div className="small" style={{marginTop:6}}><strong>A:</strong> {h.r}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
