const fs = require('fs');

let content = fs.readFileSync('plan.md', 'utf8');
const lines = content.split('\\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Match a table row starting with "| number |"
  const match = line.match(/^\\|\\s*(\\d+)\\s*\\|/);
  
  if (match) {
    const taskId = parseInt(match[1], 10);
    // If the task is completed (1-38), we skip adding it to newLines
    if (taskId >= 1 && taskId <= 38) {
      continue;
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync('plan.md', newLines.join('\\n'), 'utf8');
console.log('Cleared completed tasks 1-38 from plan.md');
