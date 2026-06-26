const fs = require('fs');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
const files = walk('src').filter(f => f.endsWith('.tsx'));
let changed = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content
    .replace(/key=\{set\.id \|\| index\}/g, 'key={`${set.id || "set"}-${index}`}')
    .replace(/key=\{card\.id \|\| index\}/g, 'key={`${card.id || "card"}-${index}`}')
    .replace(/key=\{node\.id \|\| index\}/g, 'key={`${node.id || "node"}-${index}`}')
    .replace(/key=\{u\.id \|\| index\}/g, 'key={`${u.id || "user"}-${index}`}')
    .replace(/key=\{p\.id \|\| index\}/g, 'key={`${p.id || "p"}-${index}`}')
    .replace(/key=\{item\.id \|\| index\}/g, 'key={`${item.id || "item"}-${index}`}');
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    changed++;
    console.log('Fixed', f);
  }
});
console.log('Fixed files:', changed);
