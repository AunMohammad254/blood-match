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
    let originalContent = content;

    const methods = ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'];
    methods.forEach(method => {
      // match: export async function GET(req: Request) {
      // also variations like: export async function POST(req: Request, { params }: { params: { id: string } }) {
      const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(([^)]+)\\)\\s*{`, 'g');
      content = content.replace(regex, (match, p1) => {
        // if it already has a return type, skip
        if (p1.includes('):')) return match;
        return `export async function ${method}(${p1}): Promise<NextResponse> {`;
      });
      
      const regex2 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]+\\)\\s*:\\s*Promise<NextResponse>\\s*{`, 'g');
      // Fix potential duplicate Next response imports or add it if missing
      // Actually we just added `: Promise<NextResponse>`
    });

    if (content !== originalContent) {
      if (!content.includes('import { NextResponse }') && !content.includes('import {NextResponse}')) {
        content = `import { NextResponse } from "next/server";\n` + content;
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated return type in ${filePath}`);
      changedCount++;
    }
  }
});

console.log(`Added return types to ${changedCount} files.`);
