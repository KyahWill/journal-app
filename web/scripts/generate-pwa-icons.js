#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * This script generates all required PWA icons from the source SVG file.
 * It also creates placeholder screenshots for the PWA manifest.
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * Prerequisites: npm install --save-dev sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_SVG = path.join(__dirname, '../app/icon.svg');
const ICONS_DIR = path.join(__dirname, '../public/icons');
const SCREENSHOTS_DIR = path.join(__dirname, '../public/screenshots');

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Screenshot dimensions
const SCREENSHOTS = [
  { name: 'desktop.png', width: 1280, height: 720 },
  { name: 'mobile.png', width: 390, height: 844 },
];

async function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

async function generateIcon(size, purpose = 'any') {
  const filename = purpose === 'maskable' 
    ? `maskable-icon-${size}x${size}.png`
    : `icon-${size}x${size}.png`;
  const outputPath = path.join(ICONS_DIR, filename);

  try {
    if (purpose === 'maskable') {
      // Maskable icons need extra padding (safe zone is 80% of the icon)
      const padding = Math.round(size * 0.1);
      const innerSize = size - (padding * 2);
      
      // Create a background and composite the icon on top
      const icon = await sharp(SOURCE_SVG)
        .resize(innerSize, innerSize)
        .toBuffer();
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 249, g: 115, b: 22, alpha: 1 } // #f97316 - theme color
        }
      })
        .composite([{
          input: icon,
          top: padding,
          left: padding,
        }])
        .png()
        .toFile(outputPath);
    } else {
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    }
    
    console.log(`✅ Generated: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${filename}:`, error.message);
  }
}

async function generateScreenshot(name, width, height) {
  const outputPath = path.join(SCREENSHOTS_DIR, name);
  
  try {
    // Create a branded placeholder screenshot
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fff5f0"/>
            <stop offset="100%" style="stop-color:#fed7aa"/>
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f97316"/>
            <stop offset="100%" style="stop-color:#f59e0b"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        
        <!-- Header bar -->
        <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.08)}" fill="url(#accent)"/>
        
        <!-- App title -->
        <text x="${width / 2}" y="${Math.round(height * 0.05)}" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${Math.round(height * 0.025)}" 
              font-weight="600"
              fill="white" 
              text-anchor="middle">
          Journal App
        </text>
        
        <!-- Center content -->
        <text x="${width / 2}" y="${height / 2}" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${Math.round(height * 0.04)}" 
              font-weight="bold"
              fill="#f97316" 
              text-anchor="middle">
          Your Personal Space for Reflection
        </text>
        <text x="${width / 2}" y="${height / 2 + Math.round(height * 0.06)}" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${Math.round(height * 0.025)}" 
              fill="#9a3412" 
              text-anchor="middle">
          AI-powered insights to guide your journey
        </text>
        
        <!-- Decorative elements -->
        <circle cx="${width * 0.1}" cy="${height * 0.85}" r="${height * 0.08}" fill="#f97316" opacity="0.2"/>
        <circle cx="${width * 0.9}" cy="${height * 0.2}" r="${height * 0.12}" fill="#f59e0b" opacity="0.15"/>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated screenshot: ${name}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${name}:`, error.message);
  }
}

async function main() {
  console.log('🎨 PWA Icon Generator\n');
  
  // Check if source SVG exists
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ Source SVG not found:', SOURCE_SVG);
    process.exit(1);
  }
  
  // Ensure output directories exist
  await ensureDirectoryExists(ICONS_DIR);
  await ensureDirectoryExists(SCREENSHOTS_DIR);
  
  console.log('\n📱 Generating icons...\n');
  
  // Generate standard icons
  for (const size of ICON_SIZES) {
    await generateIcon(size, 'any');
  }
  
  // Generate maskable icon (only 512x512)
  await generateIcon(512, 'maskable');
  
  console.log('\n📸 Generating screenshots...\n');
  
  // Generate screenshots
  for (const { name, width, height } of SCREENSHOTS) {
    await generateScreenshot(name, width, height);
  }
  
  console.log('\n✨ Done! All PWA assets have been generated.\n');
  console.log('📋 Next steps:');
  console.log('   1. Review the generated icons in public/icons/');
  console.log('   2. Replace screenshots with actual app screenshots');
  console.log('   3. Run `npm run build` to build the app with PWA support');
}

main().catch(console.error);

