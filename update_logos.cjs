const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const oldLogoCheckmark = '<svg width="30" height="30" viewBox="0 0 100 100" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><path d="M85.45 43.75 A36 36 0 1 1 56.25 14.55" fill="none" stroke="#4F46E5" stroke-width="11" stroke-linecap="round"/><path d="M30 58 L46 74 L83.7 21.72" fill="none" stroke="#4F46E5" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="74" r="4" fill="#2DD4BF"/></svg>';
const newLogo34 = '<svg class="brand-logo-svg" width="34" height="34" viewBox="0 0 100 100" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><path d="M85.45 43.75 A36 36 0 1 1 56.25 14.55" fill="none" stroke="#00D9FF" stroke-width="11" stroke-linecap="round"/><path d="M30 58 L46 74 L83.7 21.72" fill="none" stroke="#00D9FF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="74" r="4" fill="#00D9FF"/></svg>';

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'landing.html');

for (const file of files) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(oldLogoCheckmark)) {
        content = content.replace(oldLogoCheckmark, newLogo34);
        content = content.replace('<div class="sidebar-logo">', '<div class="sidebar-logo" onclick="app.router.navigate(\'/landing\')" role="button" tabindex="0" style="cursor:pointer;">');
        content = content.replace('<div class="navbar-brand" style="margin-bottom: 24px;">', '<div class="navbar-brand" style="margin-bottom: 24px; cursor:pointer;" onclick="app.router.navigate(\'/landing\')" role="button" tabindex="0">');
        content = content.replace('<span>Streako</span>', '<span class="brand-name">STREAKO</span>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
