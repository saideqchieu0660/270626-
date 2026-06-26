const fs = require('fs');
const glob = require('child_process').execSync('find /app/applet/src -name "*.tsx"').toString().split('\n').filter(Boolean);

glob.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/ \|\| \`[A-Za-z0-9\-\$]+\`/g, '');
  content = content.replace(/ \? \`\$\{card\.id\}-\$\{idx\}\` \: \`card-\$\{idx\}\`/g, '');
  fs.writeFileSync(f, content);
});
console.log('Cleaned');
