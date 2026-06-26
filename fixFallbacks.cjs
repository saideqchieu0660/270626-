const fs = require('fs');
const files = [
  'src/components/ManualFlashcardImporter.tsx',
  'src/components/ExportStudyReport.tsx',
  'src/components/DocumentConverter.tsx',
  'src/components/DeckList.tsx',
  'src/pages/StudyRoom.tsx',
  'src/pages/StudentDashboard.tsx',
  'src/pages/TeacherDashboard.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\|\|\s*index\}/g, '|| `fallback-${index}`}');
    content = content.replace(/\|\|\s*idx\}/g, '|| `fallback-${idx}`}');
    content = content.replace(/key=\{card\.id\}/g, 'key={card.id || `card-${idx}`}');
    content = content.replace(/key=\{deck\.id\}/g, 'key={deck.id || `deck-${idx}`}');
    content = content.replace(/key=\{member\.id\}/g, 'key={member.id || `member-${i}`}');
    content = content.replace(/key=\{c\.id\}/g, 'key={c.id || `card-${idx}`}');
    content = content.replace(/key=\{u\.id\}/g, 'key={u.id || `user-${idx}`}');
    content = content.replace(/key=\{t\.id\}/g, 'key={t.id || `t-${idx}`}');
    content = content.replace(/key=\{b\.id\}/g, 'key={b.id || `b-${idx}`}');
    
    fs.writeFileSync(f, content);
  }
});
console.log("Done fallback keys replacement.");
