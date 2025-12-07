/**
 * autoFix - an improved, deterministic autofix pipeline
 *
 * Changes from the previous version:
 * - Adds a heuristic to place missing closing brackets (}, ), ]) near the
 *   most likely end of the corresponding open-block instead of appending at EOF.
 * - Still conservative: line-by-line, uses indentation and nearby lines to guess location.
 *
 * Rules:
 *  - trim trailing spaces
 *  - convert tabs to 2 spaces
 *  - collapse multiple inline spaces
 *  - add semicolons heuristically
 *  - basic typo fixes: consolelog -> console.log, funciton -> function
 *  - bracket balancing with a heuristic insertion point
 *
 * Returns { fixedCode, fixes }.
 */

function shouldAddSemicolon(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return false;
  if (/[;{}:,]$/.test(trimmed)) return false;
  const controlKeywords = ["if", "for", "while", "switch", "function", "class", "else", "try", "catch", "finally"];
  for (const kw of controlKeywords) {
    if (trimmed.startsWith(kw + " ") || trimmed.startsWith(kw + "(") || trimmed === kw) return false;
  }
  if (/^(import|export)\b/.test(trimmed)) return false;
  if (/[=+\-*/%]|\w+\(.*\)/.test(trimmed)) return true;
  return false;
}

// helper: count leading spaces (tabs already converted)
function leadingSpaces(str) {
  const m = str.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

export function autoFix(code) {
  const rawLines = code.split("\n");
  const fixes = [];
  // work on a mutable copy
  const lines = rawLines.map((l) => l.replace(/\r$/, ""));

  // Stage 1: basic line fixes and gather bracket events
  const openStack = []; // { char, lineIndex, indent }
  // We'll record positions of opening braces so we can pick better insertion points for closers.
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1) trim trailing spaces
    const trimmedEnd = line.replace(/\s+$/, "");
    if (trimmedEnd !== line) {
      fixes.push(`Trimmed trailing spaces on line ${i+1}`);
      line = trimmedEnd;
    }

    // 2) tabs -> two spaces
    if (line.includes("\t")) {
      line = line.replace(/\t/g, "  ");
      fixes.push(`Replaced tab with spaces on line ${i+1}`);
    }

    // 3) collapse multiple internal spaces (preserve leading indentation)
    line = line.replace(/(^\s+)| {2,}/g, (m, leading) => leading ? leading : " ");

    // 4) small typo fixes
    if (line.includes("consolelog")) {
      line = line.replace(/consolelog/g, "console.log");
      fixes.push(`Fixed typo 'consolelog' -> 'console.log' on line ${i+1}`);
    }
    if (line.includes("funciton")) {
      line = line.replace(/funciton/g, "function");
      fixes.push(`Fixed typo 'funciton' -> 'function' on line ${i+1}`);
    }

    // 5) add semicolon heuristically
    if (shouldAddSemicolon(line)) {
      line = line.replace(/\s+$/, "") + ";";
      fixes.push(`Added semicolon on line ${i+1}`);
    }

    // 6) scan characters and track simple bracket stack with positions
    // We scan the line char-by-char but we ignore brackets inside strings (very naive).
    let inSingle = false, inDouble = false, inBacktick = false, escape = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (!inDouble && !inBacktick && ch === "'" ) { inSingle = !inSingle; continue; }
      if (!inSingle && !inBacktick && ch === '"' ) { inDouble = !inDouble; continue; }
      if (!inSingle && !inDouble && ch === '`' ) { inBacktick = !inBacktick; continue; }
      if (inSingle || inDouble || inBacktick) continue;

      if (ch === "{" || ch === "(" || ch === "[") {
        openStack.push({ char: ch, lineIndex: i, indent: leadingSpaces(line) });
      } else if (ch === "}" || ch === ")" || ch === "]") {
        // pop matching opening if present (match types)
        const match = { "}":"{", ")":"(", "]":"[" }[ch];
        // find the last matching opening in stack
        for (let s = openStack.length - 1; s >= 0; s--) {
          if (openStack[s].char === match) {
            openStack.splice(s, 1);
            break;
          }
        }
      }
    }

    lines[i] = line; // write back normalized line
  } // end per-line loop

  // Stage 2: handle remaining unmatched opens in openStack
  // We'll process from last opening to first so inner blocks get closed before outer blocks.
  if (openStack.length > 0) {
    // Convert to array copy to avoid mutating while iterating
    const pending = openStack.slice().reverse(); // last opened first
    for (const entry of pending) {
      const openChar = entry.char;
      const neededClose = { "{":"}", "(":")", "[":"]" }[openChar];
      const startLine = entry.lineIndex;
      const startIndent = entry.indent;

      // Heuristic: find best insertion line index
      // 1) prefer to insert after the last line that seems inside the block:
      //    find the last line j >= startLine where leadingSpaces(line_j) > startIndent
      // 2) if none, try to find the first line after startLine where leadingSpaces <= startIndent
      //    and insert BEFORE that line (so closer ends the block)
      // 3) otherwise append at EOF

      let insertIndex = null; // insert after insertIndex (i.e., between insertIndex and insertIndex+1)
      let lastInside = -1;
      for (let j = startLine + 1; j < lines.length; j++) {
        const ls = leadingSpaces(lines[j]);
        // skip blank lines when deciding
        if (lines[j].trim() === "") continue;
        if (ls > startIndent) lastInside = j;
      }
      if (lastInside !== -1) {
        insertIndex = lastInside; // place close just after this line
      } else {
        // try to find the first line after startLine where indent <= startIndent
        let firstNonNested = -1;
        for (let j = startLine + 1; j < lines.length; j++) {
          if (lines[j].trim() === "") continue;
          const ls = leadingSpaces(lines[j]);
          if (ls <= startIndent) { firstNonNested = j; break; }
        }
        if (firstNonNested !== -1) {
          insertIndex = firstNonNested - 1; // insert before that line => after previous
        } else {
          // no suitable spot, append at EOF
          insertIndex = lines.length - 1;
        }
      }

      // Now insert the closer line after insertIndex
      const closerLine = " ".repeat(startIndent) + neededClose;
      // If insertIndex is last line index, we append after it
      lines.splice(insertIndex + 1, 0, closerLine);
      fixes.push(`Inserted '${neededClose}' for '${openChar}' opened on line ${startLine+1} (placed at line ${insertIndex+2})`);
    }
  }

  // Final: join and reduce blank lines
  const fixedCode = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  return { fixedCode, fixes };
}
