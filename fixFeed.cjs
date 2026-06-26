const fs = require('fs');

const f = 'src/components/GlobalActivityFeed.tsx';
if (fs.existsSync(f)) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/key=\{p\.id\}/g, 'key={p.id || `post-${Math.random()}`}');
  content = content.replace(/key=\{item\.id\}/g, 'key={item.id || `item-${Math.random()}`}');
  fs.writeFileSync(f, content);
}
console.log("Done");
