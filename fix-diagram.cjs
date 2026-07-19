const fs = require('fs');
let text = fs.readFileSync('src/components/WorkflowDiagram.tsx', 'utf8');
text = text.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/components/WorkflowDiagram.tsx', text, 'utf8');
console.log('Fixed file.');
