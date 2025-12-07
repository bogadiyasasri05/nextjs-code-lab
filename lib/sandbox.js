/**
 * sandbox.js - creates a worker and runs code with timeout
 * Exports: runCodeInWorker(code, {timeout})
 *
 * Implementation note: worker file is under /public/worker-runner.js so it can be fetched by Worker()
 */

export function runCodeInWorker(code, opts = {}) {
  const timeout = opts.timeout || 2000;
  return new Promise((resolve, reject) => {
    try {
      // create worker from public URL
      const worker = new Worker('/worker-runner.js');

      const timer = setTimeout(() => {
        try { worker.terminate(); } catch(e){}
        resolve({ logs: [], error: 'Execution timed out (terminated after ' + timeout + ' ms)' });
      }, timeout);

      worker.onmessage = function(ev) {
        clearTimeout(timer);
        const { logs = [], error } = ev.data || {};
        try { worker.terminate(); } catch (e) {}
        resolve({ logs, error });
      };

      worker.onerror = function(err) {
        clearTimeout(timer);
        try { worker.terminate(); } catch(e){}
        resolve({ logs: [], error: String(err.message || err) });
      };

      // send code
      worker.postMessage({ code });
    } catch (err) {
      reject(err);
    }
  });
}
