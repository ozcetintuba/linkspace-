import fs from 'fs';

function analyzeFile(filePath) {
  console.log('=== Analyzing ' + filePath + ' ===');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    console.log('No script setup found');
    return;
  }
  const script = scriptMatch[1];
  
  // Find all imports
  const importRegex = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  const importedNames = new Set();
  while ((match = importRegex.exec(script)) !== null) {
    const rawNames = match[1];
    const source = match[2];
    if (rawNames.includes('{')) {
      const inside = rawNames.match(/\{([\s\S]*?)\}/)[1];
      inside.split(',').forEach(s => {
        const name = s.trim().split(/\s+as\s+/)[0].trim();
        if (name) {
          if (importedNames.has(name)) {
            console.warn(`DUPLICATE IMPORT in ${filePath}: ${name} (from ${source})`);
          }
          importedNames.add(name);
        }
      });
    } else {
      const defaultName = rawNames.trim();
      if (defaultName) importedNames.add(defaultName);
    }
  }

  // Check top of script setup for early access before declaration (TDZ)
  const lines = script.split('\n');
  let storeToRefsLine = -1;
  let useLinkStoreLine = -1;
  let useAuthStoreLine = -1;
  
  lines.forEach((line, idx) => {
    if (line.includes('useLinkStore()')) useLinkStoreLine = idx + 1;
    if (line.includes('storeToRefs(')) storeToRefsLine = idx + 1;
    if (line.includes('useAuthStore()')) useAuthStoreLine = idx + 1;
  });

  console.log(`useLinkStore: line ${useLinkStoreLine}, storeToRefs: line ${storeToRefsLine}, useAuthStore: line ${useAuthStoreLine}`);
  
  // Check lines before useLinkStore/storeToRefs for accesses to links, profile, etc.
  if (storeToRefsLine > 0) {
    for (let i = 0; i < storeToRefsLine - 1; i++) {
      const l = lines[i];
      if (/\b(profile|links|activeTheme|authStore)\.value\b/.test(l)) {
        console.error(`POSSIBLE TDZ ACCESS at line ${i + 1}: ${l.trim()}`);
      }
    }
  }
}

analyzeFile('frontend/src/views/AdminView.vue');
analyzeFile('frontend/src/views/LoginView.vue');
analyzeFile('frontend/src/components/PhonePreview.vue');
