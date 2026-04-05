const fs = require('fs');
const path = './faculty-app/app/view-schedule.tsx';
let content = fs.readFileSync(path, 'utf8');

const t2 = content.includes('FlatList');
const t3 = content.includes('SectionList');

console.log('FlatList found:', t2);
console.log('SectionList found:', t3);

// Find the exact FlatList string
const idx = content.indexOf('<FlatList');
if (idx > -1) {
    const endIdx = content.indexOf('/>', idx);
    console.log(content.substring(idx, endIdx + 2));
}
