const fs = require('fs');

// SVG for a simple dumbbell icon
const createDumbbellSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1e40af" rx="${size * 0.15}"/>
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Left weight -->
    <rect x="${-size * 0.4}" y="${-size * 0.15}" width="${size * 0.12}" height="${size * 0.3}" fill="white" rx="${size * 0.02}"/>
    <!-- Right weight -->
    <rect x="${size * 0.28}" y="${-size * 0.15}" width="${size * 0.12}" height="${size * 0.3}" fill="white" rx="${size * 0.02}"/>
    <!-- Bar -->
    <rect x="${-size * 0.28}" y="${-size * 0.04}" width="${size * 0.56}" height="${size * 0.08}" fill="white" rx="${size * 0.015}"/>
    <!-- Left grip detail -->
    <circle cx="${-size * 0.34}" cy="0" r="${size * 0.18}" fill="white" opacity="0.3"/>
    <!-- Right grip detail -->
    <circle cx="${size * 0.34}" cy="0" r="${size * 0.18}" fill="white" opacity="0.3"/>
  </g>
</svg>
`;

// Create 192x192 icon
const svg192 = createDumbbellSVG(192);
fs.writeFileSync('public/icon-192.svg', svg192);

// Create 512x512 icon
const svg512 = createDumbbellSVG(512);
fs.writeFileSync('public/icon-512.svg', svg512);

console.log('SVG icons created successfully!');
console.log('Note: You can convert these to PNG using an online tool or image editing software.');
console.log('Alternatively, SVG files can be used directly in the manifest.json');
