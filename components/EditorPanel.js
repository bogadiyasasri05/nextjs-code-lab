import React, { useEffect, useRef } from "react";

/**
 * EditorPanel (client-only CodeMirror)
 *
 * Important notes:
 * - We dynamically import CodeMirror + mode + CSS inside useEffect so this code
 *   only runs in the browser. This prevents "document is not defined" errors
 *   during Next.js server-side rendering.
 * - The editor keeps the cursor position when parent sets code programmatically.
 * - Small, human-style comments for readability.
 */

export default function EditorPanel({ code, onChange }) {
  const editorRef = useRef(null);
  const cmRef = useRef(null);

  useEffect(() => {
    // Ensure we are running on client (window must exist)
    if (typeof window === "undefined" || !editorRef.current) return;

    let mounted = true;
    // dynamic import to avoid SSR issues
    Promise.all([
      import("codemirror"),
      import("codemirror/lib/codemirror.css"),
      import("codemirror/mode/javascript/javascript")
    ])
      .then(([CodeMirror]) => {
        if (!mounted) return;

        // initialize editor only once
        if (!cmRef.current) {
          cmRef.current = CodeMirror.default(editorRef.current, {
            value: code ?? "",
            mode: "javascript",
            lineNumbers: true,
            indentUnit: 2,
            tabSize: 2,
            autofocus: true
          });

          cmRef.current.on("change", (cm) => {
            // forward changes to parent
            onChange && onChange(cm.getValue());
          });
        }
      })
      .catch((err) => {
        // A user-friendly console message to debug if dynamic import fails
        // (This will appear only in browser console)
        console.error("Failed to load CodeMirror dynamically:", err);
      });

    return () => {
      // cleanup on unmount
      mounted = false;
      if (cmRef.current) {
        try {
          // CodeMirror 5 has toTextArea only when created from a textarea.
          // We'll try to remove the DOM node
          cmRef.current.getWrapperElement && cmRef.current.getWrapperElement().remove();
        } catch (e) {
          // ignore cleanup errors
        }
        cmRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // keep editor in sync when parent programmatically updates code
  useEffect(() => {
    const cm = cmRef.current;
    if (!cm) return;
    try {
      const cur = cm.getCursor();
      if (cm.getValue() !== code) {
        cm.setValue(code);
        // restore cursor if possible
        cm.setCursor(cur);
      }
    } catch (e) {
      // swallow — sometimes editor not ready yet
    }
  }, [code]);

  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <div style={{fontWeight:700}}>main.js</div>
        <div style={{fontSize:12, color:"#94a3b8"}}>JS only — sandboxed</div>
      </div>
      <div ref={editorRef} style={{flex:1, minHeight:280}} />
    </div>
  );
}
