import { useEffect, useState } from "react";
import EditorPanel from "../components/EditorPanel";
import ConsolePanel from "../components/ConsolePanel";
import HelpPanel from "../components/HelpPanel";
import { runCodeInWorker } from "../lib/sandbox";
import { autoFix } from "../lib/autofix";

/**
 * Main page - composes editor, console and help.
 * Written to be easy to read and human-feeling.
 */
export default function Home() {
  // code state -- what user edits
  const [code, setCode] = useState(`// Try this sample\nfunction greet(name) {\n  console.log(\"Hello \" + name)\n}\n\ngreet(\"Nannaaa\")`);
  const [consoleLines, setConsoleLines] = useState([]);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [lastFixes, setLastFixes] = useState([]);

  // append a console line
  function pushConsole(type, text) {
    setConsoleLines((s) => [...s, { type, text }]);
  }

  // run code in worker sandbox
  async function handleRun() {
    setConsoleLines([]); // clear console for clarity
    pushConsole("info", "Starting execution...");
    try {
      const { logs, error } = await runCodeInWorker(code, { timeout: 2000 });
      logs.forEach((l) => pushConsole("log", l));
      if (error) pushConsole("error", error);
      else pushConsole("info", "Execution finished.");
    } catch (err) {
      pushConsole("error", String(err));
    }
  }

  // auto-fix the code and show fixes applied
  function handleAutoFix() {
    const { fixedCode, fixes } = autoFix(code);
    if (fixes.length === 0) {
      setLastFixes(["No fixes applied — code looks clean!"]);
    } else {
      setLastFixes(fixes);
      setCode(fixedCode);
    }
    pushConsole("info", `Auto-Fix applied ${fixes.length} fix(es).`);
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h2 style={{margin:0}}>Tiny CodeLab — Internship App</h2>
          <div className="small">Editor • Run • Auto-Fix • Help</div>
        </div>

        <div className="toolbar">
          <button className="btn" onClick={handleRun}>Run</button>
          <button className="btn" onClick={handleAutoFix}>Auto-Fix</button>
          <button className="btn" onClick={() => setHelpOpen(true)}>Help</button>
        </div>
      </div>

      <div className="editor-console">
        <div className="editor">
          <EditorPanel code={code} onChange={setCode} />
          <div style={{marginTop:8}}>
            <div className="small">Last fixes:</div>
            {lastFixes && lastFixes.length > 0 ? (
              <div style={{fontSize:13, marginTop:6}}>
                {lastFixes.map((f,i) => <div key={i}>• {f}</div>)}
              </div>
            ) : <div className="small">No fixes yet.</div>}
          </div>
        </div>

        <div className="side">
          <div style={{background:"rgba(255,255,255,0.02)", borderRadius:10, padding:10}}>
            <div className="small">Quick tips</div>
            <div style={{marginTop:8}}>
              • Use <code>console.log()</code> to print output.<br/>
              • Auto-Fix applies simple, safe rules (see README).<br/>
              • Help panel understands keywords like <code>run</code>, <code>autofix</code>, <code>error</code>.
            </div>
          </div>

          <div style={{flex:1}}>
            <div className="small" style={{marginBottom:6}}>Console</div>
            <ConsolePanel lines={consoleLines} />
          </div>
        </div>
      </div>

      {isHelpOpen && <HelpPanel onClose={() => setHelpOpen(false)} onAppend={(q,res) => {
        pushConsole("info", `Help: ${q} -> ${res}`);
      }} />}
    </div>
  );
}
