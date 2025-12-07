// Worker runner - receives message { code }
// It wraps code execution so console.log goes to postMessage.
// Also catches errors and returns them.
// NOTE: worker file is plain JS and must be placed in /public so it can be constructed via Worker('/worker-runner.js')

self.onmessage = function(e) {
  const { code } = e.data || {};
  const logs = [];
  function safeLog(...args) {
    try {
      logs.push(args.map(a => {
        try { return typeof a === "string" ? a : JSON.stringify(a); } catch(_) { return String(a); }
      }).join(" "));
    } catch(_) {
      logs.push(String(args));
    }
  }

  // replace console
  const console = { log: safeLog, error: safeLog, warn: safeLog, info: safeLog };

  // run code in a try/catch
  try {
    // Use Function constructor to create isolated scope
    const func = new Function("console", `${code}`);
    func(console);
    self.postMessage({ logs });
  } catch (err) {
    self.postMessage({ logs, error: (err && err.message) ? String(err.message) : String(err) });
  }
};
