const fs = require('fs');

function fixKeysInFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/key=\{card\.id\}/g, 'key={card.id || `card-${idx}`}');
    content = content.replace(/key=\{deck\.id\}/g, 'key={deck.id || `deck-${idx}`}');
    content = content.replace(/key=\{card\.id \+ idx\}/g, 'key={card.id ? `${card.id}-${idx}` : `card-${idx}`}');
    fs.writeFileSync(file, content);
}

const files = [
    'src/pages/StudentDashboard.tsx',
    'src/pages/StudyRoom.tsx',
    'src/components/VirtualizedFlashcardList.tsx',
    'src/components/ManualFlashcardImporter.tsx',
    'src/components/DocumentConverter.tsx',
    'src/components/DeckList.tsx',
    'src/pages/TeacherDashboard.tsx',
    'src/pages/AdminCreateCards.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) fixKeysInFile(f);
});
