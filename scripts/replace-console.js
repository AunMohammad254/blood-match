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
    if (filePath.includes('logger.ts')) return; // skip logger itself
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    let hasChanges = false;
    
    if (content.includes('console.error(')) {
      content = content.replace(/console\.error\(/g, 'logger.error(');
      hasChanges = true;
    }
    if (content.includes('console.warn(')) {
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      hasChanges = true;
    }
    if (content.match(/console\.log\([^)]*?[a-zA-Z]/)) { // Avoid replacing generic console.log() if needed, but we replace all
      content = content.replace(/console\.log\(/g, 'logger.info(');
      hasChanges = true;
    }

    if (hasChanges && content !== originalContent) {
      // Inject logger import if not present
      if (!content.includes('import { logger }') && !content.includes('import {logger}')) {
        // Find last import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        const importStatement = `import { logger } from "@/lib/logger";`;
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, importStatement);
        } else {
          lines.unshift(importStatement);
        }
        content = lines.join('\n');
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
      changedCount++;
    }
  }
});

console.log(`Replaced console statements in ${changedCount} files.`);
