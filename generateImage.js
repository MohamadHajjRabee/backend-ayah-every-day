const {loadImage, createCanvas, registerFont} = require("canvas");
const {join} = require("path");

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
    return lines;
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

const generateImage = async (image, ayah) => {

    try {
        registerFont(join(__dirname, 'ScheherazadeNew-Medium.ttf'), { family: 'ScheherazadeNew-Medium' })
        const background = await loadImage(image);
        const canvas = createCanvas(background.width, background.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(background, 0, 0, background.width, background.height);

        const fontSize = Math.floor(background.width * 0.05)
        const text = ayah
        const maxWidth = background.width - 100;
        const lineHeight = fontSize * 2.2;
        const padding = 20;
        const radius = 25;
        ctx.font = `${fontSize}px "ScheherazadeNew-Medium"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = wrapText(ctx, text, maxWidth);
        const backgroundWidth = ctx.measureText(lines[0]).width;

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
            ctx.fillText(line, textX, yPos);
        });
        return canvas.toBuffer('image/jpeg');
    } catch (error) {
        throw new Error('Error: ' + error.message)

    }
}

module.exports = {generateImage}
