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

walk('src/app/api', (filePath) => {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('/**') && !content.includes('* @route')) {
      const routePath = filePath.split('src\\app')[1].replace(/\\/g, '/').replace('/route.ts', '');
      const docBlock = `/**
 * @route \${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */\n`;
      content = docBlock + content;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Added docblock to ${filePath}`);
      changedCount++;
    }
  }
});

console.log(`Added docblocks to ${changedCount} files.`);
