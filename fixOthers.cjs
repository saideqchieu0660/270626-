const fs = require('fs');
const glob = [
  'src/components/TopPerformersWidget.tsx',
  'src/components/AchievementCardExport.tsx',
  'src/components/FramerFireworks.tsx',
  'src/components/GlobalErrorToast.tsx',
  'src/components/Agent3Widget.tsx',
  'src/pages/ApiHealthMonitor.tsx',
  'src/pages/StudyRoom.tsx'
];
glob.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/key=\{u\.id\}/g, 'key={u.id || `u-${Math.random()}`}');
    content = content.replace(/key=\{currentBadge\?\.id\}/g, 'key={currentBadge?.id || `badge-${Math.random()}`}');
    content = content.replace(/key=\{p\.id\}/g, 'key={p.id || `p-${Math.random()}`}');
    content = content.replace(/key=\{error\.id\}/g, 'key={error.id || `err-${Math.random()}`}');
    content = content.replace(/key=\{set\.id\}/g, 'key={set.id || `set-${Math.random()}`}');
    content = content.replace(/key=\{node\.id\}/g, 'key={node.id || `node-${Math.random()}`}');
    content = content.replace(/key=\{log\.id\}/g, 'key={log.id || `log-${Math.random()}`}');
    fs.writeFileSync(f, content);
  }
});
console.log("Done all");
