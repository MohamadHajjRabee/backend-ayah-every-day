const {loadImage, createCanvas, GlobalFonts} = require("@napi-rs/canvas");
const { resolve} = require("path");
const sharp = require('sharp');
const MAX_SIZE = 5 * 1024 * 1024;
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    const maxLength = Math.max(...lines.map(str => ctx.measureText(str).width));
    return {maxLength, lines};
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
async function compressImage(imageBuffer, quality){
    const compressedBuffer = await sharp(imageBuffer).jpeg({quality}).toBuffer()
    if(compressedBuffer.byteLength > MAX_SIZE){
        return await compressImage(compressedBuffer, quality - 10)
    }else{
        return compressedBuffer
    }
}

const generateImage = async (image, ayah) => {

    try {
        GlobalFonts.registerFromPath(resolve('./ScheherazadeNew-Regular.ttf'), 'Scheherazade New')
        const background = await loadImage(image);
        const canvas = createCanvas(background.width, background.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(background, 0, 0, background.width, background.height);
        const fontSizeScale = ayah.length > 200 ? 0.035 : 0.05
        const fontSize = Math.floor(background.width * fontSizeScale)
        const text = ayah
        const maxWidth = background.width * 0.9;
        const lineHeight = fontSize * 2.2;
        const radius = 25;
        ctx.font = `${fontSize}px "Scheherazade New"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const {maxLength, lines} = wrapText(ctx, text, maxWidth);
        const backgroundWidth = maxLength;

        const padding = 20;
        const textBlockHeight = lines.length * lineHeight + padding;
        const textBlockWidth = backgroundWidth + padding;

        const textX = canvas.width / 2;
        const textY = canvas.height / 2 - (textBlockHeight / 2) + (lineHeight / 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        drawRoundedRect(
            ctx,
            textX - textBlockWidth / 2,
            textY - lineHeight / 2 - padding / 2,
            textBlockWidth,
            textBlockHeight,
            radius
        );

        lines.forEach((line, index) => {
            const yPos = textY + (index * lineHeight);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, textX + 15, yPos);
        });
        const imageBuffer = canvas.toBuffer('image/jpeg');
        const imageSize = imageBuffer.byteLength;
        if(imageSize > MAX_SIZE) {
            return await compressImage(imageBuffer, 100);
        }else{
            return imageBuffer
        }
    } catch (error) {
        throw new Error('Error: ' + error.message)

    }
}

module.exports = {generateImage}
