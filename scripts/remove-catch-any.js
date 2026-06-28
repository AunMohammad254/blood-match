const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changedCount = 0;

walk('src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, 'catch (err)');
    content = content.replace(/catch\s*\(\s*error\s*:\s*any\s*\)/g, 'catch (error)');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated catch block in ${filePath}`);
      changedCount++;
    }
  }
});

console.log(`Removed any from catch blocks in ${changedCount} files.`);
