const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/groq/g, 'cerebras');
code = code.replace(/Groq/g, 'Cerebras');
code = code.replace(/GROQ/g, 'CEREBRAS');
code = code.replace(/https:\/\/api.cerebras.com\/openai\/v1\/chat\/completions/g, 'https://api.cerebras.ai/v1/chat/completions');

fs.writeFileSync('server.ts', code);
