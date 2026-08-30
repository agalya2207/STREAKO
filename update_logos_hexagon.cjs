const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

const checkmarkSvgPattern = /<svg[^>]*>.*?<path d="M85\.45.*?<\/svg>/gs;

const svg40 = `<svg class="brand-logo-svg" width="40" height="40" viewBox="0 0 100 100" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;">
    <defs>
        <linearGradient id="logoHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#168CFF"/>
            <stop offset="100%" stop-color="#27DFFF"/>
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    <polygon points="50,6 90,28 90,72 50,94 10,72 10,28" stroke="url(#logoHexGrad)" stroke-width="6" fill="rgba(6, 27, 50, 0.6)" filter="url(#logoGlow)"/>
    <path d="M64 36 C64 30 58 26 50 26 C40 26 36 32 36 38 C36 48 64 48 64 60 C64 68 58 74 50 74 C40 74 34 68 34 62" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="50" r="4" fill="#27DFFF"/>
</svg>`;

const svg80 = `<svg class="brand-logo-svg" width="80" height="80" viewBox="0 0 100 100" fill="none" style="flex-shrink:0;">
    <defs>
        <linearGradient id="logoHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#168CFF"/>
            <stop offset="100%" stop-color="#27DFFF"/>
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    <polygon points="50,6 90,28 90,72 50,94 10,72 10,28" stroke="url(#logoHexGrad)" stroke-width="6" fill="rgba(6, 27, 50, 0.6)" filter="url(#logoGlow)"/>
    <path d="M64 36 C64 30 58 26 50 26 C40 26 36 32 36 38 C36 48 64 48 64 60 C64 68 58 74 50 74 C40 74 34 68 34 62" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="50" r="4" fill="#27DFFF"/>
</svg>`;

const svg24 = `<svg class="brand-logo-svg" width="24" height="24" viewBox="0 0 100 100" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;">
    <defs>
        <linearGradient id="logoHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#168CFF"/>
            <stop offset="100%" stop-color="#27DFFF"/>
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    <polygon points="50,6 90,28 90,72 50,94 10,72 10,28" stroke="url(#logoHexGrad)" stroke-width="6" fill="rgba(6, 27, 50, 0.6)" filter="url(#logoGlow)"/>
    <path d="M64 36 C64 30 58 26 50 26 C40 26 36 32 36 38 C36 48 64 48 64 60 C64 68 58 74 50 74 C40 74 34 68 34 62" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="50" r="4" fill="#27DFFF"/>
</svg>`;


const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    if (file === 'login.html' || file === 'signup.html') {
        if (content.match(checkmarkSvgPattern)) {
            content = content.replace(checkmarkSvgPattern, svg80);
            
            // Adjust the wrapper div to be centered
            content = content.replace(
                /<div class="navbar-brand" style="margin-bottom: 24px; cursor:pointer;" onclick="app.router.navigate\('\/landing'\)" role="button" tabindex="0">/,
                '<div class="navbar-brand form-logo" style="margin-bottom: 32px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 12px; width: 100%;" onclick="app.router.navigate(\'/landing\')" role="button" tabindex="0">'
            );
            
            // Adjust the font size of the STREAKO text in the form
            content = content.replace(
                /<span class="brand-name">STREAKO<\/span><\/div>/,
                '<span class="brand-name" style="font-size: 24px; letter-spacing: 2px;">STREAKO</span></div>'
            );
            updated = true;
        }
    } else if (file === 'landing.html') {
        if (content.match(checkmarkSvgPattern)) {
            // Replace the first occurrence (navbar) with 40x40
            let isFirst = true;
            content = content.replace(checkmarkSvgPattern, (match) => {
                if (isFirst) {
                    isFirst = false;
                    return svg40;
                } else {
                    return svg24; // Second occurrence is footer
                }
            });
            updated = true;
        }
    } else {
        if (content.match(checkmarkSvgPattern)) {
            content = content.replace(checkmarkSvgPattern, svg40);
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
