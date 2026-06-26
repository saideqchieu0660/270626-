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
    .replace(/key=\{card\.id\}/g, 'key={`${card.id}-${idx}`}')
    .replace(/key=\{deck\.id\}/g, 'key={`${deck.id}-${idx}`}')
    .replace(/key=\{card\.id \|\| \`card-\$\{idx\}\`\}/g, 'key={`${card.id || "card"}-${idx}`}')
    .replace(/key=\{deck\.id \|\| \`deck-\$\{idx\}\`\}/g, 'key={`${deck.id || "deck"}-${idx}`}')
    .replace(/key=\{u\.id \|\| \`user-\$\{idx\}\`\}/g, 'key={`${u.id || "user"}-${idx}`}')
    .replace(/key=\{p\.id \|\| \`pinned-\$\{idx\}\`\}/g, 'key={`${p.id || "pinned"}-${idx}`}')
    .replace(/key=\{item\.id \|\| \`feed-\$\{idx\}\`\}/g, 'key={`${item.id || "feed"}-${idx}`}')
    .replace(/key=\{log\.id \|\| \`[^\`]+\`\}/g, 'key={`${log.id || "log"}-${idx}`}')
    .replace(/key=\{c\.id \|\| \`card-\$\{index\}\`\}/g, 'key={`${c.id || "card"}-${index}`}')
    .replace(/key=\{card\.id \|\| \`card-\$\{index\}\`\}/g, 'key={`${card.id || "card"}-${index}`}')
    .replace(/key=\{u\.id \|\| \`user-\$\{index\}\`\}/g, 'key={`${u.id || "user"}-${index}`}');
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    changed++;
    console.log('Fixed', f);
  }
});
console.log('Fixed files:', changed);
