/**
 * ConsolePanel - shows output lines from the worker
 */
export default function ConsolePanel({ lines = [] }) {
  return (
    <div className="console" id="console">
      {lines.length === 0 && <div className="small">Console is empty. Run code to see output here.</div>}
      {lines.map((ln, idx) => {
        const color = ln.type === "error" ? "salmon" : ln.type === "info" ? "#94a3b8" : "#dbeafe";
        return <div key={idx} style={{marginBottom:6, color}}>
          <small style={{opacity:0.8}}>[{ln.type}]</small>&nbsp;{ln.text}
        </div>;
      })}
    </div>
  );
}
