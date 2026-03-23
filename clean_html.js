const fs = require('fs');
const path = require('path');

const dataDir = 'data';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.html'));

console.log(`Found ${files.length} HTML files to clean`);

for (const file of files) {
    const filepath = path.join(dataDir, file);
    let html = fs.readFileSync(filepath, 'utf8');
    
    const originalLength = html.length;
    
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    html = html.replace(/<link[^>]*>/gi, '');
    
    html = html.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    
    html = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    
    fs.writeFileSync(filepath, html);
    console.log(`✓ Cleaned ${file} (${originalLength} → ${html.length} bytes)`);
}

console.log('\nCleaning complete!');
