const { loadImage, createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { resolve } = require("path");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MAX_SIZE = 5 * 1024 * 1024;
const FONT_CDN_URL = 'https://verses.quran.foundation/fonts/quran/hafs/v1/ttf';

// Cache for registered fonts to avoid re-downloading
const registeredFonts = new Set();

/**
 * Download and register a QCF font for a specific page
 * Uses temp directory caching for Vercel serverless functions
 * @param {number} pageNumber - The Quran page number (1-604)
 * @returns {Promise<string>} The font family name to use
 */
async function registerPageFont(pageNumber) {
    const fontName = `QCF_P${pageNumber.toString().padStart(3, '0')}`;
    
    // Check in-memory cache first (fastest)
    if (registeredFonts.has(fontName)) {
        return fontName;
    }
    
    const tempFontPath = path.join(os.tmpdir(), `qcf_p${pageNumber}.ttf`);
    
    // Check if font exists in temp directory (persists during warm invocations)
    if (fs.existsSync(tempFontPath)) {
        GlobalFonts.registerFromPath(tempFontPath, fontName);
        registeredFonts.add(fontName);
        return fontName;
    }
    
    // Download font from CDN
    const fontUrl = `${FONT_CDN_URL}/p${pageNumber}.ttf`;
    const response = await fetch(fontUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to download font for page ${pageNumber}: ${response.status}`);
    }
    
    const fontBuffer = Buffer.from(await response.arrayBuffer());
    
    // Save to temp directory
    fs.writeFileSync(tempFontPath, fontBuffer);
    
    // Register the font
    GlobalFonts.registerFromPath(tempFontPath, fontName);
    registeredFonts.add(fontName);
    
    return fontName;
}

/**
 * Wrap glyph code text into multiple lines
 * Each character in the glyph code represents a word
 */
function wrapText(ctx, text, maxWidth) {
    // For glyph codes, each character represents a word
    const words = text.split('').filter(c => c.trim().length > 0);
    let lines = [];
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n];
        } else {
            line = testLine;
        }
    }
    
    if (line) {
        lines.push(line);
    }
    
    // If no lines were created, force at least one line
    if (lines.length === 0 && text.length > 0) {
        lines.push(text);
    }
    
    const maxLength = Math.max(...lines.map(str => ctx.measureText(str).width));
    return { maxLength, lines };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

async function compressImage(imageBuffer, quality) {
    const compressedBuffer = await sharp(imageBuffer).jpeg({ quality }).toBuffer();
    if (compressedBuffer.byteLength > MAX_SIZE) {
        return await compressImage(compressedBuffer, quality - 10);
    }
    return compressedBuffer;
}

/**
 * Generate an image with Quranic verse using QCF glyph rendering
 * @param {string} backgroundImageUrl - URL of the background image
 * @param {Object} ayah - Ayah object containing page_number and code_v2
 */
const generateImage = async (backgroundImageUrl, ayah) => {
    try {
        const background = await loadImage(backgroundImageUrl);
        const canvas = createCanvas(background.width, background.height);
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.drawImage(background, 0, 0, background.width, background.height);
        
        // Validate required fields
        if (!ayah.page_number || !ayah.code_v2) {
            throw new Error('Missing required glyph data (page_number or code_v2)');
        }
        
        // Download and register QCF font for this page
        const fontName = await registerPageFont(ayah.page_number);
        const text = ayah.code_v2;
        
        // Calculate font size based on text length and image size
        const textLength = text.length;
        const fontSizeScale = textLength > 100 ? 0.035 : textLength > 50 ? 0.045 : 0.055;
        const fontSize = Math.floor(background.width * fontSizeScale);
        const maxWidth = background.width * 0.85;
        const lineHeight = fontSize * 1.8;
        const radius = 25;
        
        // Set up text rendering
        ctx.font = `${fontSize}px "${fontName}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = 'rtl';
        
        // Wrap text into lines
        const { maxLength, lines } = wrapText(ctx, text, maxWidth);
        const backgroundWidth = Math.max(maxLength, 200);
        
        const padding = 30;
        const textBlockHeight = lines.length * lineHeight + padding;
        const textBlockWidth = backgroundWidth + padding * 2;
        
        const textX = canvas.width / 2;
        const textY = canvas.height / 2 - (textBlockHeight / 2) + (lineHeight / 2);
        
        // Draw semi-transparent background for text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        drawRoundedRect(
            ctx,
            textX - textBlockWidth / 2,
            textY - lineHeight / 2 - padding / 2,
            textBlockWidth,
            textBlockHeight,
            radius
        );
        
        // Draw text lines
        lines.forEach((line, index) => {
            const yPos = textY + (index * lineHeight);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, textX, yPos);
        });
        
        // Generate buffer and compress if needed
        const imageBuffer = canvas.toBuffer('image/jpeg');
        
        if (imageBuffer.byteLength > MAX_SIZE) {
            return await compressImage(imageBuffer, 90);
        }
        
        return imageBuffer;
    } catch (error) {
        throw new Error('Error generating image: ' + error.message);
    }
};

module.exports = { generateImage };
