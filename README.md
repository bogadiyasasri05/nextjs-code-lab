📘 nextjs-code-lab

A minimal browser-based code editor built with Next.js, featuring Run, Auto-Fix, and a Help Panel with keyword-based responses.

This project was created as part of an internship assignment to demonstrate basic code execution, simple auto-correction, and a guided help system inside a web application.

🚀 Features
1. Code Editor

Built using a lightweight client-side CodeMirror setup.

Supports JavaScript editing.

Editor state stored using React hooks.

2. Run Code

Uses a sandboxed Web Worker (worker-runner.js) to run user code safely.

Prevents blocking the main UI (e.g., infinite loops).

Captures:

console.log() output

errors and exceptions

execution timeout handling

3. Auto-Fix (Basic Rules)

The Auto-Fix button processes the code line-by-line and applies simple, safe transformations.
These are deterministic rules — not AI based.

Auto-Fix applies the following corrections:

✔ Add missing semicolons

Adds ; at the end of lines where safe.

✔ Fix indentation

Normalizes indentation to improve readability.

✔ Remove extra spaces

Trims unnecessary spaces from start/end of lines.

✔ Fix common bracket/parenthesis issues

Attempts to:

balance missing } or )

ensure opening + closing braces are placed correctly

patch simple structural errors

❌ What Auto-Fix does not do

(Important for clarity)

Does not fix typos like cosole → console

Does not interpret meaning or rewrite logic

Does not detect advanced syntax errors
This tool intentionally stays simple, as requested.

🆘 Help Panel (Keyword Based)

The Help button opens a small panel where the user can type a question.

The help system responds using keyword matching, not AI.

Example keywords supported:

run → Explains how the Run button works

autofix / fix → Explains Auto-Fix rules

error → Help on reading error messages

console → Notes on using console.log()

tips → Shows general guidance

If no known keyword is found, a fallback
"Sorry, I don’t have help for that yet."
is shown.

📁 Folder Structure
nextjs-code-lab/
├── components/
│   ├── EditorPanel.js
│   ├── ConsolePanel.js
│   └── HelpPanel.js
├── lib/
│   ├── autofix.js
│   └── sandbox.js
├── pages/
│   ├── index.js
│   └── _app.js
├── public/
│   └── worker-runner.js
├── styles/
│   └── globals.css
├── package.json
├── next.config.js
└── README.md

▶️ How to Run the Project
1. Install dependencies
npm install

2. Start development server
npm run dev


The app will be available at:

http://localhost:3000

🧪 Testing Features
Run

Type JavaScript code (ex: console.log("Hello")).

Click Run.

Output appears in the Console panel.

Auto-Fix

Try intentionally breaking code, such as:

function greet(name){
 console.log("Hello " + name)
greet("Nannaaa"
)


Click Auto-Fix → it cleans indentation and fixes missing braces/semicolons.

Help

Click Help, type:

run


or

autofix


to see keyword-based responses.

⚠️ Notes

Code execution is sandboxed, so it does not affect your actual browser environment.

Auto-Fix intentionally stays simple to match assignment requirements.

📄 License

This project is created for an internship assignment and is free to reuse or modify.